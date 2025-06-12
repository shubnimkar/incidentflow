const express = require("express");
const router = express.Router();
const { createIncident, getAllIncidents, updateIncidentStatus,assignIncident, updateIncident} = require("../controllers/incidentController");
//const verifyToken = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/auth");


router.post("/", verifyToken, createIncident);
router.get("/", verifyToken, getAllIncidents);
router.put("/:id", verifyToken, updateIncidentStatus);
router.patch("/:id/assign", verifyToken, assignIncident);
router.patch("/:id", verifyToken, updateIncident);



module.exports = router;
