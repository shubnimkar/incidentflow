// /services/user/controllers/adminController.js
const User = require("../models/User");
const UserAuditLog = require("../models/UserAuditLog");

exports.getAllUsers = async (req, res) => {
  const users = await User.find({}, "email role");
  res.json(users);
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!["responder", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const oldRole = user.role;
  if (oldRole === role) {
    return res.status(400).json({ message: "Role is already set to this value" });
  }
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  // Log audit
  await UserAuditLog.create({
    action: role === "admin" ? "promote" : "demote",
    performedBy: req.user._id,
    targetUser: user._id,
    details: { oldRole, newRole: role },
  });

  res.json({ message: `Updated role to ${role}`, user: updatedUser });
};
