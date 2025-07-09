const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
} = require("../controllers/incidentController");

const { verifyToken, canEditIncident } = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const AuditLog = require("../models/AuditLog");

// Setup multer for this route
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

// Advanced comment routes (must be above router.get('/:id', ...))
router.patch('/:id/comments/:commentId', verifyToken, editComment);
router.delete('/:id/comments/:commentId', verifyToken, deleteComment);
router.patch('/:id/comments/:commentId/reactions', verifyToken, verifyToken, reactToComment);

// Admin: Audit logs with filters and pagination (must be before any '/:id' routes)
router.get('/audit-logs', verifyToken, requireAdmin, getAuditLogs);

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
  upload.single("file"),
  uploadAttachment
);

// For delete, restrict to admins only:
router.delete("/:id/attachments/:filename", verifyToken, requireAdmin, async (req, res) => {
  const Incident = require("../models/Incident");
  const AuditLog = require("../models/AuditLog");
  const filePath = path.join(__dirname, '../../uploads/incident-attachments', req.params.filename);
  try {
    // Remove file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    // Remove from attachments array
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $pull: { attachments: { url: `/uploads/incident-attachments/${req.params.filename}` } } },
      { new: true }
    )
      .populate("createdBy", "email")
      .populate("assignedTo", "email")
      .populate("comments.user", "email role")
      .populate("attachments.uploadedBy", "email");
    // Find the display filename for the deleted attachment
    const displayFilename = (incident.attachments.find(att => att.url.endsWith(`/${req.params.filename}`))?.filename) || req.params.filename;
    // Log audit with filename
    await AuditLog.create({ action: "deleted attachment", performedBy: req.user.id, incident: req.params.id, details: { filename: displayFilename } });
    res.json(incident);
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
