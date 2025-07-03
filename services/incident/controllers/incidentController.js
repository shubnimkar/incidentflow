const Incident = require("../models/Incident");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const path = require("path");
const multer = require("multer");
const sendEmail = require('../../auth/utils/sendEmail');
const emailTemplates = require('../../auth/utils/emailTemplates');
const fs = require('fs');

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
  const { title, description, severity, tags, team, category } = req.body;
  const user = req.user; // ✅ this is set by verifyToken

  try {
    const incident = new Incident({
      title,
      description,
      severity,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      team,
      category,
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
    const { status, severity, assignedTo, tags, team, category } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
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

    if (status) incident.status = status;
    if (assignedTo) incident.assignedTo = assignedTo;

    await incident.save();
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
    await logAudit("assigned incident", req.user.id, id);

    // Send notification email to assigned user
    if (user.email) {
      const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/incidents/${id}`;
      await sendEmail(
        user.email,
        `You have been assigned to Incident: ${incident.title}`,
        emailTemplates.incidentNotification(user.name || user.email, incident.title, incident._id, 'assigned', url)
      );
    }

    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Validate tags, team, category if present
    if (updates.tags && !Array.isArray(updates.tags)) {
      updates.tags = [updates.tags];
    }
    const updatedIncident = await Incident.findByIdAndUpdate(id, updates, { new: true })
      .populate("createdBy assignedTo", "email name");

    if (!updatedIncident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Log audit
    await logAudit("updated incident", req.user.id, id);

    // Send notification email to assigned user if present
    if (updatedIncident.assignedTo && updatedIncident.assignedTo.email) {
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
    await logAudit("added comment", userId, incidentId);

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
    incident.attachments.push({
      filename: req.file.originalname,
      url: fileUrl,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    });
    await incident.save();
    // Log audit
    await logAudit("uploaded attachment", req.user.id, req.params.id);
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
async function logAudit(action, userId, incidentId) {
  await AuditLog.create({ action, performedBy: userId, incident: incidentId });
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
    await logAudit("deleted incident", req.user.id, id);
    res.json({ message: "Incident deleted" });
  } catch (err) {
    console.error("Failed to delete incident:", err);
    res.status(500).json({ message: "Failed to delete incident" });
  }
};

module.exports = { createIncident, getAllIncidents, updateIncidentStatus, assignIncident, updateIncident, addComment, getIncidentById, uploadAttachment, editComment, deleteComment, reactToComment, deleteIncident };
