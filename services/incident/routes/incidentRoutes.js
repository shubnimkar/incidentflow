const express = require("express");
const router = express.Router();

const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  updateIncidentStatus,
  assignIncident,
  addComment,
} = require("../controllers/incidentController");

const verifyToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");
const AuditLog = require("../models/AuditLog");

// Public routes — any logged-in user
router.post("/", verifyToken, createIncident);
router.get("/", verifyToken, getAllIncidents);
router.get("/:id", verifyToken, getIncidentById);
router.post("/:id/comments", verifyToken, addComment);

// Admin routes
router.put("/:id", verifyToken, requireAdmin, updateIncidentStatus);         // update status
router.patch("/:id/assign", verifyToken, requireAdmin, assignIncident);      // assign user
router.patch("/:id", verifyToken, requireAdmin, updateIncident);             // update title, desc, etc.

// Audit logs route (admin-only)
router.get("/logs/:incidentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLog.find({ incident: req.params.incidentId }).populate("performedBy", "email");
    res.json(logs);
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

module.exports = router;
