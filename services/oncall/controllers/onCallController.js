const OnCallRotation = require("../models/OnCallRotation");
const Team = require("../../user/models/Team");
const User = require("../../user/models/User");

// Create a new on-call rotation
exports.createRotation = async (req, res) => {
  try {
    const { team, users, startDate, endDate, schedule } = req.body;
    const rotation = new OnCallRotation({ team, users, startDate, endDate, schedule });
    await rotation.save();
    res.status(201).json(rotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all rotations (optionally by team)
exports.getRotations = async (req, res) => {
  try {
    const { team } = req.query;
    const filter = team ? { team } : {};
    const rotations = await OnCallRotation.find(filter)
      .populate("team", "name")
      .populate("users", "name email")
      .populate("schedule.user", "name email");
    res.json(rotations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single rotation
exports.getRotationById = async (req, res) => {
  try {
    const rotation = await OnCallRotation.findById(req.params.id)
      .populate("team", "name")
      .populate("users", "name email")
      .populate("schedule.user", "name email");
    if (!rotation) return res.status(404).json({ message: "Rotation not found" });
    res.json(rotation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a rotation
exports.updateRotation = async (req, res) => {
  try {
    const { team, users, startDate, endDate, schedule } = req.body;
    const rotation = await OnCallRotation.findByIdAndUpdate(
      req.params.id,
      { team, users, startDate, endDate, schedule },
      { new: true }
    )
      .populate("team", "name")
      .populate("users", "name email")
      .populate("schedule.user", "name email");
    if (!rotation) return res.status(404).json({ message: "Rotation not found" });
    res.json(rotation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a rotation
exports.deleteRotation = async (req, res) => {
  try {
    const rotation = await OnCallRotation.findByIdAndDelete(req.params.id);
    if (!rotation) return res.status(404).json({ message: "Rotation not found" });
    res.json({ message: "Rotation deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get current on-call user for a team (based on now)
exports.getCurrentOnCall = async (req, res) => {
  try {
    const { team } = req.query;
    if (!team) return res.status(400).json({ message: "Team is required" });
    const now = new Date();
    const rotation = await OnCallRotation.findOne({ team, startDate: { $lte: now }, $or: [ { endDate: { $gte: now } }, { endDate: null } ] })
      .populate("schedule.user", "name email");
    if (!rotation) return res.status(404).json({ message: "No active rotation found" });
    const current = rotation.schedule.find(s => s.start <= now && s.end >= now);
    if (!current) return res.status(404).json({ message: "No on-call user found for this time" });
    res.json(current.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 