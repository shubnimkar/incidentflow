const express = require("express");
const {
  register,
  login,
  deleteUser,
  updateMe,
} = require("../controllers/userController");
const multer = require('multer');
const path = require('path');

const User = require("../models/User");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();

// Multer config for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

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

// ✅ Update current user's profile (name, avatar)
router.patch("/me", authenticateToken, upload.single('avatar'), updateMe);

router.use(authenticateToken, authorizeAdmin);


module.exports = router;
