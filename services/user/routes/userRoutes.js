const express = require("express");
const {
  register,
  login,
  deleteUser,
  updateMe,
} = require("../controllers/userController");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const teamController = require("../controllers/teamController");
const sendEmail = require('../../auth/utils/sendEmail');
const emailTemplates = require('../../auth/utils/emailTemplates');
const crypto = require('crypto');
const twilio = require('twilio');
require('dotenv').config();

const User = require("../models/User");
const UserAuditLog = require("../models/UserAuditLog");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Set up multer storage for avatars
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user._id + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// Replace the mock sendSMS with Twilio integration
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sendSMS = async (phone, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    throw new Error('Twilio environment variables not set');
  }
  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to: phone
  });
};

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

// ✅ Get current user's profile
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Update current user's profile (all editable fields, with email verification)
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const updateFields = {};
    const { name, title, bio, timezone, phones, smsNumbers, emails } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }
      updateFields.name = name;
    }
    if (title !== undefined) updateFields.title = title;
    if (bio !== undefined) updateFields.bio = bio;
    if (timezone !== undefined) updateFields.timezone = timezone;
    if (phones !== undefined) {
      // Handle phones with verification
      const normalizePhone = (p) => {
        if (typeof p === 'string') return { value: p, verified: false, pending: true };
        if (p && typeof p === 'object' && p.value) return {
          value: p.value,
          verified: !!p.verified,
          pending: p.pending !== undefined ? !!p.pending : !p.verified
        };
        return null;
      };
      const inputPhones = phones.map(normalizePhone).filter(Boolean);
      // Remove duplicates in input
      const uniquePhones = [];
      for (const p of inputPhones) {
        if (!uniquePhones.find(u => u.value === p.value)) uniquePhones.push(p);
      }
      // Check for duplicates in DB (other users)
      for (const p of uniquePhones) {
        const exists = await User.findOne({ 'phones.value': p.value, _id: { $ne: user._id } });
        if (exists) {
          return res.status(400).json({ message: `Phone ${p.value} already in use` });
        }
      }
      const newPhones = [];
      for (const phoneObj of uniquePhones) {
        const existing = (user.phones || []).find(p => p.value === phoneObj.value);
        if (existing) {
          newPhones.push(existing);
        } else {
          // New phone, add as pending/verified false
          const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          user.verificationCodes.push({ value: phoneObj.value, code, expiresAt, type: 'phone' });
          newPhones.push({ value: phoneObj.value, verified: false, pending: true });
          // Send verification SMS
          try {
            await sendSMS(phoneObj.value, `Your Incident Flow verification code is: ${code}`);
          } catch (err) {
            console.error('Failed to send verification SMS:', err);
          }
        }
      }
      updateFields.phones = newPhones;
    }
    if (smsNumbers !== undefined) updateFields.smsNumbers = smsNumbers;
    // Handle emails with verification
    if (emails !== undefined) {
      console.log('Processing emails update:', emails); // Debug log
      // Ensure all emails are objects with value, verified, pending
      const normalizeEmail = (e) => {
        if (typeof e === 'string') return { value: e, verified: false, pending: true };
        if (e && typeof e === 'object' && e.value) return {
          value: e.value,
          verified: !!e.verified,
          pending: e.pending !== undefined ? !!e.pending : !e.verified
        };
        return null;
      };
      const inputEmails = emails.map(normalizeEmail).filter(Boolean);
      // Remove duplicates in input
      const uniqueEmails = [];
      for (const e of inputEmails) {
        if (!uniqueEmails.find(u => u.value === e.value)) uniqueEmails.push(e);
      }
      // Check for duplicates in DB (other users)
      for (const e of uniqueEmails) {
        const exists = await User.findOne({ 'emails.value': e.value, _id: { $ne: user._id } });
        if (exists) {
          return res.status(400).json({ message: `Email ${e.value} already in use` });
        }
      }
      const newEmails = [];
      for (const emailObj of uniqueEmails) {
        const existing = (user.emails || []).find(e => e.value === emailObj.value);
        if (existing) {
          newEmails.push(existing);
        } else {
          // New email, add as pending/verified false
          const code = crypto.randomBytes(16).toString('hex');
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          user.verificationCodes.push({ value: emailObj.value, code, expiresAt, type: 'email' });
          newEmails.push({ value: emailObj.value, verified: false, pending: true });
          // Send verification email
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(emailObj.value)}&code=${code}`;
          console.log('About to send verification email to', emailObj.value); // Debug log
          try {
            await sendEmail(
              emailObj.value,
              'Verify your email address',
              emailTemplates.verificationEmail(user.name, verificationUrl)
            );
          } catch (err) {
            console.error('Failed to send verification email:', err);
          }
        }
      }
      updateFields.emails = newEmails;
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");
    await user.save(); // Save verificationCodes if changed
    res.json(updatedUser);
  } catch (err) {
    console.error("Failed to update user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Verify email endpoint
router.post("/verify-email", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ 'emails.value': email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const vCode = user.verificationCodes.find(vc => vc.value === email && vc.code === code && vc.type === 'email');
    if (!vCode || vCode.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    // Mark email as verified
    user.emails = user.emails.map(e => e.value === email ? { ...e.toObject(), verified: true, pending: false } : e);
    user.verificationCodes = user.verificationCodes.filter(vc => !(vc.value === email && vc.code === code && vc.type === 'email'));
    await user.save();
    res.json({ message: "Email verified" });
  } catch (err) {
    console.error("Failed to verify email:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Change current user's password
router.put("/me/password", authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old and new password are required" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Failed to update password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Upload avatar
router.post("/me/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const avatarUrl = `/api/users/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select("-password");
    res.json({ message: "Avatar updated", user });
  } catch (err) {
    console.error("Failed to upload avatar:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Delete avatar
router.delete("/me/avatar", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.avatarUrl) {
      const filePath = path.join(avatarDir, path.basename(user.avatarUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    user.avatarUrl = undefined;
    await user.save();
    res.json({ message: "Avatar deleted" });
  } catch (err) {
    console.error("Failed to delete avatar:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Serve avatars statically
router.use('/avatars', express.static(avatarDir));

// ✅ Get all teams (authenticated only)
router.get("/teams", authenticateToken, teamController.getTeams);

// ✅ Admin-protected routes
router.use(authenticateToken, authorizeAdmin);

// Team management routes (admin only)
router.post("/teams", teamController.createTeam);
router.get("/teams/:id", teamController.getTeamById);
router.put("/teams/:id", teamController.updateTeam);
router.delete("/teams/:id", teamController.deleteTeam);
router.post("/teams/:id/add-member", teamController.addMember);
router.post("/teams/:id/remove-member", teamController.removeMember);

// Change user role (admin only)
router.patch("/:id/role", adminController.updateUserRole);

// Delete user (admin only)
router.delete("/:id", deleteUser);

// Resend email verification endpoint
router.post('/resend-email-verification', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const emailObj = user.emails.find(e => e.value === email && !e.verified);
    if (!emailObj) return res.status(400).json({ message: 'Email not found or already verified' });

    const code = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationCodes.push({ value: email, code, expiresAt, type: 'email' });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;
    await sendEmail(
      email,
      'Verify your email address',
      emailTemplates.verificationEmail(user.name, verificationUrl)
    );
    await user.save();
    res.json({ message: 'Verification email resent' });
  } catch (err) {
    console.error('Failed to resend verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete email endpoint
router.delete('/me/email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.emails = user.emails.filter(e => e.value !== email);
    // Also remove any pending verification codes for this email
    user.verificationCodes = user.verificationCodes.filter(vc => vc.value !== email || vc.type !== 'email');
    await user.save();
    res.json({ message: 'Email deleted', emails: user.emails });
  } catch (err) {
    console.error('Failed to delete email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /verify-phone
router.post("/verify-phone", async (req, res) => {
  try {
    const { phone, code } = req.body;
    const user = await User.findOne({ 'phones.value': phone });
    if (!user) return res.status(404).json({ message: "User not found" });
    const vCode = user.verificationCodes.find(vc => vc.value === phone && vc.code === code && vc.type === 'phone');
    if (!vCode || vCode.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    // Mark phone as verified
    user.phones = user.phones.map(p => p.value === phone ? { ...p.toObject(), verified: true, pending: false } : p);
    user.verificationCodes = user.verificationCodes.filter(vc => !(vc.value === phone && vc.code === code && vc.type === 'phone'));
    await user.save();
    res.json({ message: "Phone verified" });
  } catch (err) {
    console.error("Failed to verify phone:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /resend-phone-verification
router.post('/resend-phone-verification', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const phoneObj = user.phones.find(p => p.value === phone && !p.verified);
    if (!phoneObj) return res.status(400).json({ message: 'Phone not found or already verified' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationCodes.push({ value: phone, code, expiresAt, type: 'phone' });
    await sendSMS(phone, `Your Incident Flow verification code is: ${code}`);
    await user.save();
    res.json({ message: 'Verification SMS resent' });
  } catch (err) {
    console.error('Failed to resend verification SMS:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin-protected: Get user audit logs
router.get("/audit-logs", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await UserAuditLog.find()
      .populate("performedBy", "email name")
      .populate("targetUser", "email name")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await UserAuditLog.countDocuments();
    res.json({
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user audit logs" });
  }
});

module.exports = router;
