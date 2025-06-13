// /services/user/controllers/adminController.js
const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  const users = await User.find({}, "email role");
  res.json(users);
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const updated = await User.findByIdAndUpdate(id, { role }, { new: true });
  res.json({ message: `Updated role to ${role}`, user: updated });
};
