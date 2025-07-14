const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  assignIncident,
  addComment,
  uploadAttachment,
  editComment,
  deleteComment,
  reactToComment,
  deleteIncident,
  getOverdueWindow,
  updateOverdueWindow,
  archiveIncident,
  getArchivedIncidents,
  getAuditLogs,
  getAuditLogMetrics,
} = require("../controllers/incidentController");

const { verifyToken, canEditIncident } = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const AuditLog = require("../models/AuditLog");

// Use S3-based upload from controller
const { upload: s3Upload } = require("../controllers/incidentController");

// Advanced comment routes (must be above router.get('/:id', ...))
router.patch('/:id/comments/:commentId', verifyToken, editComment);
router.delete('/:id/comments/:commentId', verifyToken, deleteComment);
router.patch('/:id/comments/:commentId/reactions', verifyToken, verifyToken, reactToComment);

// Admin: Audit logs with filters and pagination (must be before any '/:id' routes)
router.get('/audit-logs', verifyToken, requireAdmin, getAuditLogs);
// Admin: Audit log metrics (last 24h/7d)
router.get('/audit-log-metrics', verifyToken, requireAdmin, getAuditLogMetrics);

// Public routes — any logged-in user
router.post('/', verifyToken, createIncident);
router.get('/', verifyToken, getAllIncidents);
router.post('/:id/comments', verifyToken, addComment);
router.get('/:id', verifyToken, getIncidentById);

// Admin routes
router.put("/:id", verifyToken, requireAdmin, updateIncidentStatus);         // update status
router.patch("/:id/assign", verifyToken, requireAdmin, assignIncident);      // assign user
router.patch("/:id", verifyToken, canEditIncident, updateIncident);          // update title, desc, etc. - allows admins and creators
router.delete('/:id', verifyToken, requireAdmin, deleteIncident);

// Audit logs route (any logged-in user)
router.get("/logs/:incidentId", verifyToken, async (req, res) => {
  try {
    const logs = await AuditLog.find({ incident: req.params.incidentId }).populate("performedBy", "email");
    res.json(logs);
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// For upload, allow any authenticated user:
router.post(
  "/:id/attachments",
  verifyToken,
  s3Upload.single("file"),
  uploadAttachment
);

// For delete, restrict to admins only:
router.delete("/:id/attachments/:filename", verifyToken, requireAdmin, async (req, res) => {
  const Incident = require("../models/Incident");
  const AuditLog = require("../models/AuditLog");
  try {
    // Find the incident
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    // Find the attachment by filename
    const attachment = incident.attachments.find(att => att.filename === req.params.filename || (att.url && att.url.includes(req.params.filename)));
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });
    // Extract S3 key from URL
    const url = new URL(attachment.url);
    const key = decodeURIComponent(url.pathname).replace(/^\//, '');
    // Delete from S3
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }).promise();
    // Remove from attachments array
    await Incident.findByIdAndUpdate(
      req.params.id,
      { $pull: { attachments: { url: attachment.url } } },
      { new: true }
    );
    // Log audit
    await AuditLog.create({ action: "deleted attachment", performedBy: req.user.id, incident: req.params.id, details: { filename: attachment.filename } });
    // Return updated incident
    const updatedIncident = await Incident.findById(req.params.id)
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email role")
      .populate("attachments.uploadedBy", "email");
    res.json(updatedIncident);
  } catch (err) {
    console.error("Failed to delete attachment:", err);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
});

// Download attachment route (no auth)
router.get("/:id/attachments/:filename/download", async (req, res) => {
  const filePath = path.join(__dirname, '../../uploads/incident-attachments', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }
  res.download(filePath, req.params.filename);
});

// Overdue window settings
router.get('/settings/overdue-window', verifyToken, getOverdueWindow);
router.patch('/settings/overdue-window', verifyToken, requireAdmin, updateOverdueWindow);

// Archive routes (admin only)
router.put('/:id/archive', verifyToken, requireAdmin, archiveIncident);
router.get('/archived', verifyToken, requireAdmin, getArchivedIncidents);

module.exports = router;
