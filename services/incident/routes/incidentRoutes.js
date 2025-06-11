const express = require("express");
const router = express.Router();
const { createIncident, getAllIncidents, updateIncidentStatus } = require("../controllers/incidentController");
//const verifyToken = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/auth");


router.post("/", verifyToken, createIncident);
router.get("/", verifyToken, getAllIncidents);
router.put("/:id", verifyToken, updateIncidentStatus);

module.exports = router;
