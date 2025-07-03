const Team = require("../models/Team");
const User = require("../models/User");

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const team = new Team({ name, description, members });
    await team.save();
    res.status(201).json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate("members", "name email role");
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single team
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("members", "name email role");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, members },
      { new: true }
    ).populate("members", "name email role");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a member to a team
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (!team.members.includes(userId)) {
      team.members.push(userId);
      await team.save();
    }
    res.json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Remove a member from a team
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    team.members = team.members.filter(id => id.toString() !== userId);
    await team.save();
    res.json(team);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}; 