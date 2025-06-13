const express = require("express");
const router = express.Router();
const { createIncident, getAllIncidents, updateIncidentStatus,assignIncident, updateIncident, addComment, getIncidentById} = require("../controllers/incidentController");
//const verifyToken = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");

// Public routes (any logged-in user)

router.post("/", verifyToken, createIncident);
router.get("/", verifyToken, getAllIncidents);
router.get("/:id", verifyToken, getIncidentById);
router.post("/:id/comments", verifyToken, addComment);

// Admin routes (admin only)
router.put("/:id", verifyToken, requireAdmin, updateIncidentStatus);
router.patch("/:id/assign", verifyToken,requireAdmin, assignIncident);
router.patch("/:id", verifyToken,requireAdmin, updateIncident);


module.exports = router;
