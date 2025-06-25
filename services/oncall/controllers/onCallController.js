const OnCallSchedule = require("../models/onCallScheduleModel");
require("../models/User"); // 👈 Add this line to register the User model


// Create a new OnCall schedule
exports.createSchedule = async (req, res) => {
  try {
    const schedule = await OnCallSchedule.create(req.body);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await OnCallSchedule.find().populate("users.userId", "email name");
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get currently on-call user (by schedule ID)
exports.getCurrentOnCall = async (req, res) => {
  try {
    const schedule = await OnCallSchedule.findById(req.params.id).populate("users.userId", "email name");
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const currentUser = schedule.users[schedule.currentOnCallIndex];
    res.json(currentUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Override current on-call user
exports.overrideOnCall = async (req, res) => {
  try {
    const schedule = await OnCallSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    const newIndex = schedule.users.findIndex((u) => u.userId.toString() === req.body.userId);
    if (newIndex === -1) return res.status(400).json({ message: "User not in rotation" });

    schedule.currentOnCallIndex = newIndex;
    await schedule.save();

    res.json({ message: "Override successful", schedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Rotate to next user
exports.rotateSchedule = async (req, res) => {
  try {
    const schedule = await OnCallSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    schedule.currentOnCallIndex = (schedule.currentOnCallIndex + 1) % schedule.users.length;
    schedule.lastRotated = new Date();
    await schedule.save();

    res.json({ message: "Schedule rotated", schedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
