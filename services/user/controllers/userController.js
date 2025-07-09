// /services/user/controllers/userController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserAuditLog = require("../models/UserAuditLog");

const JWT_SECRET = process.env.JWT_SECRET; // use env vars in production

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    console.log("User not found");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await user.comparePassword(password);
  console.log("Password match:", isMatch);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token });
};
// ✅ DELETE user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id;

    // Defensive: check req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Prevent deleting your own account
    if (req.user.id === userIdToDelete) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const deleted = await User.findByIdAndDelete(userIdToDelete);

    if (!deleted) {
      return res.status(404).json({ message: "User not found." });
    }

    // Log audit
    await UserAuditLog.create({
      action: "delete",
      performedBy: req.user._id,
      targetUser: deleted._id,
      details: { email: deleted.email, role: deleted.role },
    });

    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error while deleting user." });
  }
};