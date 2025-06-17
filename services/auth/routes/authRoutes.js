const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { register, login } = require("../controllers/authController");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

// REGISTER & LOGIN
router.post("/register", register);
router.post("/login", login);

// ✅ Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // ✅ For security: don't reveal whether email exists
      return res.status(200).json({
        message: "Password reset link sent to your email (if registered).",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    const emailHTML = `
      <p>Hello ${user.name || "User"},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await sendEmail(user.email, "Reset Your Password", emailHTML);

    res.status(200).json({
      message: "Password reset link sent to your email (if registered).",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// ✅ Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

module.exports = router;
