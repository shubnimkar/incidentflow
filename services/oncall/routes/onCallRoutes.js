const express = require("express");
const {
  createSchedule,
  getSchedules,
  getCurrentOnCall,
  overrideOnCall,
  rotateSchedule,
  updateSchedule,
  deleteSchedule,
  updateUserScheduleDates

} = require("../controllers/onCallController");

const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, authorizeAdmin, createSchedule);
router.get("/", authenticateToken, getSchedules);
router.get("/:id/oncall", authenticateToken, getCurrentOnCall);
router.patch("/:id/override", authenticateToken, authorizeAdmin, overrideOnCall);
router.patch("/:id/rotate", authenticateToken, authorizeAdmin, rotateSchedule);
router.delete("/:id", authenticateToken, authorizeAdmin, deleteSchedule);
router.put("/:id", authenticateToken, authorizeAdmin, updateSchedule);
router.put("/:id/update-user-date", authenticateToken, authorizeAdmin, updateUserScheduleDates);



module.exports = router;
