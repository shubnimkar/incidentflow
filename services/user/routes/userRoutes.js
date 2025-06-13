const express = require("express");
const { register, login } = require("../controllers/userController");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");
const requireAdmin = require("../middleware/admin");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// 🔐 Fetch all users (admin only)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔧 Change role (admin only)
router.patch("/:id/role", verifyToken, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["admin", "responder"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;