const Incident = require("../models/Incident");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const path = require("path");
const multer = require("multer");

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
  const { title, description, severity } = req.body;
  const user = req.user; // ✅ this is set by verifyToken

  try {
    const incident = new Incident({
      title,
      description,
      severity,
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
    const incidents = await Incident.find().populate("createdBy", "email").populate("assignedTo", "email").populate("comments.user", "email");

    const enriched = incidents.map((incident) => {
      const email = incident.createdBy?.email || incident.createdByEmail || "N/A";
      return { ...incident.toObject(), createdByEmail: email };
    });

    res.json(enriched);
  } catch (error) {
    console.error("🔥 Error fetching incidents:", error.stack || error);
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
    ).populate("assignedTo", "email");

    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedIncident = await Incident.findByIdAndUpdate(id, updates, { new: true }).populate("createdBy assignedTo", "email");

    if (!updatedIncident) {
      return res.status(404).json({ message: "Incident not found" });
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

module.exports = { createIncident, getAllIncidents, updateIncidentStatus, assignIncident, updateIncident, addComment, getIncidentById, uploadAttachment };
