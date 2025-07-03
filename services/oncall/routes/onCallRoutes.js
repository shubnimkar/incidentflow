const express = require("express");
const { authenticateToken, authorizeAdmin } = require("../../user/middleware/auth");
const onCallController = require("../controllers/onCallController");

const router = express.Router();

// All routes require admin
router.use(authenticateToken, authorizeAdmin);

router.post("/rotations", onCallController.createRotation);
router.get("/rotations", onCallController.getRotations);
router.get("/rotations/:id", onCallController.getRotationById);
router.put("/rotations/:id", onCallController.updateRotation);
router.delete("/rotations/:id", onCallController.deleteRotation);
router.get("/current", onCallController.getCurrentOnCall);

module.exports = router; 