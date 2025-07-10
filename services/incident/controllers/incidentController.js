const Incident = require("../models/Incident");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const path = require("path");
const multer = require("multer");
const sendEmail = require('../../auth/utils/sendEmail');
const emailTemplates = require('../../auth/utils/emailTemplates');
const fs = require('fs');
const Settings = require('../models/Settings');

// Multer setup for attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/incident-attachments'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const createIncident = async (req, res) => {
  const { title, description, urgency, status, assignedTo, tags, team, category, incidentType, impactedService, priority, responders, meetingUrl } = req.body;
  const user = req.user; // ✅ this is set by verifyToken

  try {
    const incident = new Incident({
      title,
      description,
      urgency,
      status,
      assignedTo,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      team,
      category,
      incidentType,
      impactedService,
      priority,
      responders: Array.isArray(responders) ? responders : (responders ? [responders] : []),
      meetingUrl,
      createdBy: user.id,           // ✅ userId was not defined — use req.user.id
      createdByEmail: user.email,   // ✅ optional
    });

    await incident.save();
    res.status(201).json(incident);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: "Error creating incident" });
  }
};


const getAllIncidents = async (req, res) => {
  try {
    const { status, urgency, assignedTo, tags, team, category } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (team) filter.team = team;
    if (category) filter.category = category;
    if (tags) {
      // tags can be comma-separated or array
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArray };
    }
    const incidents = await Incident.find(filter)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email");

    const enriched = incidents.map((incident) => {
      const email = incident.createdBy?.email || incident.createdByEmail || "N/A";
      return { ...incident.toObject(), createdByEmail: email };
    });

    res.json(enriched);
  } catch (error) {
    console.error("\ud83d\udd25 Error fetching incidents:", error.stack || error);
    res.status(500).json({ message: "Server error" });
  }
};



const updateIncidentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;

  try {
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    let statusChanged = false;
    let oldStatus = incident.status;
    if (status && status !== incident.status) {
      statusChanged = true;
      incident.status = status;
    }
    if (assignedTo) incident.assignedTo = assignedTo;

    await incident.save();
    // Log status change if it happened
    if (statusChanged) {
      await logAudit(
        status === "closed" ? "closed incident" : "updated field",
        req.user.id,
        id,
        { field: "status", oldValue: oldStatus, newValue: status },
        req.requestId,
        req
      );
    }
    // Emit real-time update
    req.app.get('io').emit('incidentUpdated', {
      ...incident.toObject(),
      updatedBy: req.user.id
    });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignIncident = async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  try {
    const user = await User.findById(assignedTo);
    if (!user) return res.status(404).json({ message: "User not found" });

    const incident = await Incident.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true }
    ).populate("assignedTo", "email name");

    // Log audit
    await logAudit("assigned incident", req.user.id, id, { field: 'assignedTo', oldValue: incident.assignedTo, newValue: assignedTo }, req.requestId, req);

    // Temporarily remove email sending
    // if (user.email) {
    //   const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents/${id}`;
    //   await sendEmail(
    //     user.email,
    //     `You have been assigned to Incident: ${incident.title}`,
    //     emailTemplates.incidentNotification(user.name || user.email, incident.title, incident._id, 'assigned', url)
    //   );
    // }

    // Emit real-time update
    req.app.get('io').emit('incidentUpdated', {
      ...incident.toObject(),
      updatedBy: req.user.id
    });
    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper to canonicalize values for comparison
function canonicalize(val) {
  if (Array.isArray(val)) {
    return val.map(v => (typeof v === 'object' ? v._id || v.id : v)).sort();
  }
  if (val && typeof val === 'object') {
    return val._id || val.id || val;
  }
  return val;
}

updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Validate tags, team, category if present
    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = [updates.tags];
    }
    if (updates.responders && !Array.isArray(updates.responders)) {
      updates.responders = [updates.responders];
    }
    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }
    // Track all relevant fields
    const fieldsToTrack = [
      "title", "description", "urgency", "status", "assignedTo", "team",
      "incidentType", "impactedService", "priority", "responders", "meetingUrl"
    ];
    for (const field of fieldsToTrack) {
      const oldValueCanonical = canonicalize(incident[field]);
      const newValueCanonical = canonicalize(updates[field]);
      const changed = JSON.stringify(oldValueCanonical) !== JSON.stringify(newValueCanonical);
      if (changed && updates[field] !== undefined) {
        // Special case: status changed to 'closed'
        if (field === 'status' && updates[field] === 'closed') {
          await logAudit(
            'closed incident',
            req.user.id,
            id,
            { field, oldValue: incident[field], newValue: updates[field] },
            req.requestId,
            req
          );
        // Special case: assignedTo changed
        } else if (field === 'assignedTo') {
          // Fetch assigned user email if possible
          let assignedToUser = null;
          if (updates[field]) {
            assignedToUser = await User.findById(updates[field]);
          }
          await logAudit(
            'assigned incident',
            req.user.id,
            id,
            {
              field,
              oldValue: incident[field],
              newValue: updates[field],
              assignedToEmail: assignedToUser ? assignedToUser.email : undefined,
              incidentTitle: incident.title
            },
            req.requestId,
            req
          );
        } else {
          await logAudit(
            'updated field',
            req.user.id,
            id,
            { field, oldValue: incident[field], newValue: updates[field] },
            req.requestId,
            req
          );
        }
      }
    }
    // Now update the incident
    const updatedIncident = await Incident.findByIdAndUpdate(id, updates, { new: true })
      .populate("createdBy assignedTo", "email name")
      .populate("responders", "name email")
      .populate("team", "name");
    if (!updatedIncident) {
      return res.status(404).json({ message: "Incident not found" });
    }
    // Send notification email to assigned user if present (wrapped in try-catch to prevent email errors from affecting the update)
    if (updatedIncident.assignedTo && updatedIncident.assignedTo.email) {
      try {
        const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents/${id}`;
        await sendEmail(
          updatedIncident.assignedTo.email,
          `Incident Updated: ${updatedIncident.title}`,
          emailTemplates.incidentNotification(
            updatedIncident.assignedTo.name || updatedIncident.assignedTo.email,
            updatedIncident.title,
            updatedIncident._id,
            'updated',
            url
          )
        );
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError.message);
        // Don't fail the request if email sending fails
      }
    }
    res.json(updatedIncident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const incidentId = req.params.id;
    const { message } = req.body; // ✅ Change this
    const userId = req.user.id;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Comment is required" });
    }

    const incident = await Incident.findById(incidentId);
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    incident.comments.push({ user: userId, message }); // ✅ Change this
    await incident.save();

    // Log audit
    await logAudit("added comment", userId, incidentId, { comment: message }, req.requestId, req);

    const updatedIncident = await Incident.findById(incidentId)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email");

    res.status(201).json(updatedIncident);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Server error" });
  }
};
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("responders", "name email")
      .populate("team", "name")
      .populate("comments.user", "email role")
      .populate("attachments.uploadedBy", "email");

    if (!incident) return res.status(404).json({ message: "Incident not found" });

    res.json(incident);
  } catch (err) {
    console.error("Error fetching incident:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Attachment upload handler
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    const fileUrl = `/uploads/incident-attachments/${req.file.filename}`;
    const customFilename = req.body.filename;
    incident.attachments.push({
      filename: customFilename || req.file.originalname,
      url: fileUrl,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    });
    await incident.save();
    // Log audit
    await logAudit("uploaded attachment", req.user.id, req.params.id, { filename: customFilename || req.file.originalname }, req.requestId, req);
    const updatedIncident = await Incident.findById(req.params.id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email")
      .populate("attachments.uploadedBy", "email");
    res.status(201).json(updatedIncident);
  } catch (err) {
    console.error("Attachment upload error:", err);
    res.status(500).json({ message: "Failed to upload attachment" });
  }
};

// Helper to create audit log
async function logAudit(action, userId, incidentId, details = null, requestId = null, req = null) {
  const log = await AuditLog.create({ action, performedBy: userId, incident: incidentId, details, requestId });
  // Emit socket event if possible
  if (req && req.app && req.app.get && req.app.get('io')) {
    // Populate performedBy and incident for richer frontend data
    const populatedLog = await AuditLog.findById(log._id)
      .populate('performedBy', 'email name')
      .populate('incident', 'title');
    req.app.get('io').emit('auditLogCreated', populatedLog);
  }
}

// Edit a comment
const editComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { message, mentions } = req.body;
    const userId = req.user.id;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    const comment = incident.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (String(comment.user) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }
    comment.message = message;
    comment.mentions = mentions || [];
    comment.edited = true;
    comment.editedAt = new Date();
    await incident.save();
    const updatedIncident = await Incident.findById(id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email role")
      .populate("comments.mentions", "email")
      .populate("attachments.uploadedBy", "email");
    res.json(updatedIncident);
  } catch (err) {
    res.status(500).json({ message: "Failed to edit comment" });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    const comment = incident.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (String(comment.user) !== String(userId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    incident.comments.pull(commentId);
    await incident.save();
    const updatedIncident = await Incident.findById(id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email role")
      .populate("comments.mentions", "email")
      .populate("attachments.uploadedBy", "email");
    res.json(updatedIncident);
  } catch (err) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// React to a comment (add or remove reaction)
const reactToComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    const comment = incident.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    // Remove reaction if already exists, else add
    const existing = comment.reactions.find(r => r.emoji === emoji && String(r.user) === String(userId));
    if (existing) {
      comment.reactions = comment.reactions.filter(r => !(r.emoji === emoji && String(r.user) === String(userId)));
    } else {
      comment.reactions.push({ emoji, user: userId });
    }
    // Debug log
    console.log('User', userId, 'toggled reaction', emoji, 'Current reactions:', comment.reactions);
    await incident.save();
    const updatedIncident = await Incident.findById(id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email role")
      .populate("comments.mentions", "email")
      .populate("attachments.uploadedBy", "email");
    res.json(updatedIncident);
  } catch (err) {
    res.status(500).json({ message: "Failed to react to comment" });
  }
};

// Delete an incident (admin only)
const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    // Remove attachments from disk
    if (incident.attachments && incident.attachments.length > 0) {
      for (const att of incident.attachments) {
        if (att.url) {
          const filePath = path.join(__dirname, '../../uploads/incident-attachments', att.url.split('/').pop());
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
          }
        }
      }
    }
    await Incident.findByIdAndDelete(id);
    // Log audit with incident details
    await logAudit("deleted incident", req.user.id, id, {
      title: incident.title,
      status: incident.status,
      assignedTo: incident.assignedTo,
    }, req.requestId, req);
    res.json({ message: "Incident deleted" });
  } catch (err) {
    console.error("Failed to delete incident:", err);
    res.status(500).json({ message: "Failed to delete incident" });
  }
};

// Get overdue window per priority (in hours)
const getOverdueWindow = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    // Ensure all priorities are present
    const defaults = { P1: 24, P2: 48, P3: 72, P4: 120, P5: 168 };
    const overdueWindow = { ...defaults, ...settings.overdueWindowHours };
    res.json({ overdueWindowHours: overdueWindow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update overdue window per priority (admin only)
const updateOverdueWindow = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { overdueWindowHours } = req.body;
    if (!overdueWindowHours || typeof overdueWindowHours !== 'object') {
      return res.status(400).json({ message: 'Invalid payload' });
    }
    const priorities = ['P1', 'P2', 'P3', 'P4', 'P5'];
    for (const p of priorities) {
      if (
        overdueWindowHours[p] === undefined ||
        typeof overdueWindowHours[p] !== 'number' ||
        overdueWindowHours[p] < 1 ||
        overdueWindowHours[p] > 168
      ) {
        return res.status(400).json({ message: `Invalid value for ${p} (1-168 hours allowed)` });
      }
    }
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    settings.overdueWindowHours = overdueWindowHours;
    await settings.save();
    res.json({ overdueWindowHours: settings.overdueWindowHours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Archive an incident (only if status is 'closed')
const archiveIncident = async (req, res) => {
  const { id } = req.params;
  try {
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    if (incident.status !== 'closed') {
      return res.status(400).json({ message: "Only closed incidents can be archived" });
    }
    incident.status = 'archived';
    incident.archivedAt = new Date();
    await incident.save();
    // Log audit
    await logAudit("archived incident", req.user.id, id, null, req.requestId, req);
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all archived incidents
const getArchivedIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ status: 'archived' })
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email");
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fetch audit logs with filters and pagination
const getAuditLogs = async (req, res) => {
  try {
    const { user, action, incident, startDate, endDate, sessionId, requestId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (user) filter.performedBy = user;
    if (action) filter.action = action;
    if (incident) filter.incident = incident;
    if (sessionId) filter.sessionId = sessionId;
    if (requestId) filter.requestId = requestId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        // Include the entire end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'email name')
      .populate('incident', 'title')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await AuditLog.countDocuments(filter);
    res.json({
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createIncident, getAllIncidents, updateIncidentStatus, assignIncident, updateIncident, addComment, getIncidentById, uploadAttachment, editComment, deleteComment, reactToComment, deleteIncident, getOverdueWindow, updateOverdueWindow, archiveIncident, getArchivedIncidents, getAuditLogs };
