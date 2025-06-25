const express = require("express");
const {
  createSchedule,
  getSchedules,
  getCurrentOnCall,
  overrideOnCall,
  rotateSchedule,

} = require("../controllers/onCallController");

const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, authorizeAdmin, createSchedule);
router.get("/", authenticateToken, getSchedules);
router.get("/:id/oncall", authenticateToken, getCurrentOnCall);
router.patch("/:id/override", authenticateToken, authorizeAdmin, overrideOnCall);
router.patch("/:id/rotate", authenticateToken, authorizeAdmin, rotateSchedule);

module.exports = router;
