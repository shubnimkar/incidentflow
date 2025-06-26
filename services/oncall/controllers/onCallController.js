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

// Edit a schedule
exports.updateSchedule = async (req, res) => {
  try {
    const updated = await OnCallSchedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Schedule not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const deleted = await OnCallSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Schedule not found" });
    res.json({ message: "Schedule deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// onCallController.js (at the bottom)

exports.updateUserScheduleDates = async (req, res) => {
  const { userId, startDate, endDate } = req.body;

  try {
    const schedule = await OnCallSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const userEntry = schedule.users.id(userId);
    if (!userEntry) {
      return res.status(404).json({ message: "User not found in this schedule" });
    }

    userEntry.startDate = new Date(startDate);
    userEntry.endDate = new Date(endDate);

    await schedule.save();
    res.status(200).json({ message: "User schedule updated successfully" });
  } catch (error) {
    console.error("Error updating user schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


