const express = require("express");
const {
  register,
  login,
  deleteUser,
  updateMe,
} = require("../controllers/userController");
const multer = require('multer');
const path = require('path');
const teamController = require("../controllers/teamController");

const User = require("../models/User");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();

// ✅ Public routes
router.post("/register", register);
router.post("/login", login);

// ✅ Get all users (authenticated only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Admin-protected routes

// ✅ Change user role (admin only)
router.patch("/:id/role", async (req, res) => {
  const { role } = req.body;

  if (!["admin", "responder"].includes(role)) {
    return res.status(400).json({ message: "Invalid role provided" });
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

    res.json({ message: "Role updated successfully", user });
  } catch (err) {
    console.error("Failed to change role:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Delete user (admin only)
router.delete("/:id", deleteUser);

router.use(authenticateToken, authorizeAdmin);

// Team management routes
router.post("/teams", teamController.createTeam);
router.get("/teams", teamController.getTeams);
router.get("/teams/:id", teamController.getTeamById);
router.put("/teams/:id", teamController.updateTeam);
router.delete("/teams/:id", teamController.deleteTeam);
router.post("/teams/:id/add-member", teamController.addMember);
router.post("/teams/:id/remove-member", teamController.removeMember);

module.exports = router;
