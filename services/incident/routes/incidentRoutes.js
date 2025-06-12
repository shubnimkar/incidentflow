const express = require("express");
const router = express.Router();
const { createIncident, getAllIncidents, updateIncidentStatus,assignIncident, updateIncident, addComment, getIncidentById} = require("../controllers/incidentController");
//const verifyToken = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/auth");


router.post("/", verifyToken, createIncident);
router.get("/", verifyToken, getAllIncidents);
router.put("/:id", verifyToken, updateIncidentStatus);
router.patch("/:id/assign", verifyToken, assignIncident);
router.patch("/:id", verifyToken, updateIncident);
router.post("/:id/comments", verifyToken, addComment);
router.get("/:id", verifyToken, getIncidentById);





module.exports = router;
