const express = require("express");
const {
  register,
  login,
  deleteUser,
  updateMe,
  getRecentLogs,
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
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const router = express.Router();

// Set up multer storage for avatars
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}
// Set up S3 for avatars
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE, // Ensure correct Content-Type for images
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `avatars/${req.user._id}-${Date.now()}${ext}`);
    }
  })
});

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

// Helper to generate a pre-signed URL for S3 objects
const getPresignedUrl = (key) => {
  if (!key) return null;
  const s3Key = key.replace(/^https?:\/\/[^/]+\//, '');
  const presignedUrl = s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
    Expires: 60 * 5 // 5 minutes
  });
  console.log('[DEBUG] Generating pre-signed URL:', { key, s3Key, presignedUrl });
  return presignedUrl;
};

// ✅ Public routes
router.post("/register", register);
router.post("/login", login);

// ✅ Get all users (authenticated only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    // Attach pre-signed avatar URLs
    const usersWithPresigned = users.map(u => {
      const userObj = u.toObject();
      if (userObj.avatarUrl) {
        userObj.avatarUrl = getPresignedUrl(userObj.avatarUrl);
      }
      return userObj;
    });
    res.json(usersWithPresigned);
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
    const userObj = user.toObject();
    if (userObj.avatarUrl) {
      userObj.avatarUrl = getPresignedUrl(userObj.avatarUrl);
    }
    res.json(userObj);
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Update current user's profile (all editable fields, with email verification)
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const updateFields = {};
    const { name, title, bio, timezone, phones, smsNumbers, emails, city, country, status } = req.body;
    const user = await User.findById(req.user._id); // fetch with all fields
    if (!user) return res.status(404).json({ message: "User not found" });
    let verificationCodesChanged = false;
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ message: "Name is required" });
      }
      updateFields.name = name;
    }
    if (title !== undefined) updateFields.title = title;
    if (bio !== undefined) updateFields.bio = bio;
    if (timezone !== undefined) updateFields.timezone = timezone;
    if (city !== undefined) updateFields.city = city;
    if (country !== undefined) updateFields.country = country;
    if (status !== undefined) {
      // Only allow valid status values
      const allowedStatuses = [
        'available',
        'busy',
        'do not disturb',
        'be right back',
        'appear away',
        'appear offline'
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      updateFields.status = status;
    }
    // Track new phone verification codes to add after update
    let newPhoneCodes = [];
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
          newPhoneCodes.push({ value: phoneObj.value, code, expiresAt, type: 'phone' });
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
          verificationCodesChanged = true;
          // Send verification email
          const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5002/api/users'}/verify-email?email=${encodeURIComponent(emailObj.value)}&code=${code}`;
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
    // Main update for all other fields
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");
    // Now handle verificationCodes and emails ONLY on a fresh userWithPassword
    let needToSave = false;
    let userWithPassword = null;
    if (newPhoneCodes.length > 0) {
      // Instead of fetching and saving the user, use updateOne to push verification codes
      await User.updateOne(
        { _id: req.user._id },
        { $push: { verificationCodes: { $each: newPhoneCodes } } }
      );
    }
    // Always check emails on userWithPassword, never on user
    // (If you need to add a new email, use updateOne as well)
    // Remove the .save() call entirely for normal profile updates
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

// GET /verify-email for email link verification with redirect
router.get('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.query;
    const user = await User.findOne({ 'emails.value': email });
    if (!user) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-result?status=error&reason=user_not_found`);
    const vCode = user.verificationCodes.find(vc => vc.value === email && vc.code === code && vc.type === 'email');
    if (!vCode || vCode.expiresAt < new Date()) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-result?status=error&reason=invalid_or_expired`);
    }
    user.emails = user.emails.map(e => e.value === email ? { ...e.toObject(), verified: true, pending: false } : e);
    user.verificationCodes = user.verificationCodes.filter(vc => !(vc.value === email && vc.code === code && vc.type === 'email'));
    await user.save();
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-result?status=success`);
  } catch (err) {
    console.error('Failed to verify email (GET):', err);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-result?status=error&reason=server_error`);
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

// ✅ Delete avatar
router.delete("/me/avatar", authenticateToken, async (req, res) => {
  try {
    // Remove avatarUrl using findByIdAndUpdate to avoid password validation error
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl: null },
      { new: true }
    ).select("-password");
    res.json({ message: "Avatar deleted", user });
  } catch (err) {
    console.error("Failed to delete avatar:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Get all teams (authenticated only)
router.get("/teams", authenticateToken, teamController.getTeams);

// Send email verification code
router.post('/resend-email-verification', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const emailObj = user.emails.find(e => e.value === email && !e.verified);
    if (!emailObj) return res.status(400).json({ message: 'Email not found or already verified' });
    const code = require('crypto').randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationCodes.push({ value: email, code, expiresAt, type: 'email' });
    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5002/api/users'}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;
    await require('../../auth/utils/sendEmail')(email, 'Verify your email address', require('../../auth/utils/emailTemplates').verificationEmail(user.name, verificationUrl));
    await user.save();
    res.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('Failed to send verification email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Send phone verification code
router.post('/send-phone-verification', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    // E.164 validation
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Use +<countrycode><number>' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const phoneObj = (user.phones || []).find(p => p.value === phone && !p.verified);
    if (!phoneObj) return res.status(400).json({ message: 'Phone not found or already verified' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationCodes.push({ value: phone, code, expiresAt, type: 'phone' });
    await sendSMS(phone, `Your Incident Flow verification code is: ${code}`);
    await user.save();
    res.json({ message: 'Verification SMS sent' });
  } catch (err) {
    console.error('Failed to send verification SMS:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Verify email
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const vCode = user.verificationCodes.find(vc => vc.value === email && vc.code === code && vc.type === 'email');
    if (!vCode || vCode.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    user.emails = user.emails.map(e => e.value === email ? { ...e.toObject(), verified: true, pending: false } : e);
    user.verificationCodes = user.verificationCodes.filter(vc => !(vc.value === email && vc.code === code && vc.type === 'email'));
    await user.save();
    res.json({ message: 'Email verified' });
  } catch (err) {
    console.error('Failed to verify email:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Verify phone
router.post('/verify-phone', authenticateToken, async (req, res) => {
  try {
    const { phone, code } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const vCode = user.verificationCodes.find(vc => vc.value === phone && vc.code === code && vc.type === 'phone');
    if (!vCode || vCode.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    user.phones = user.phones.map(p => p.value === phone ? { ...p.toObject(), verified: true, pending: false } : p);
    user.verificationCodes = user.verificationCodes.filter(vc => !(vc.value === phone && vc.code === code && vc.type === 'phone'));
    await user.save();
    res.json({ message: 'Phone verified' });
  } catch (err) {
    console.error('Failed to verify phone:', err);
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

// Add after other /me endpoints
router.post('/me/unlink-social', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider || !['google', 'github', 'microsoft'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid provider' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Remove from socialAccounts array
    user.socialAccounts = (user.socialAccounts || []).filter(acc => acc.provider !== provider);
    // Remove provider-specific fields if present
    if (provider === 'google') {
      user.googleId = null;
      user.markModified('googleId');
    }
    if (provider === 'github') {
      user.githubId = null;
      user.markModified('githubId');
    }
    if (provider === 'microsoft') {
      user.microsoftId = null;
      user.markModified('microsoftId');
    }
    // If no social accounts left, set ssoProvider to 'local'
    if (!user.socialAccounts.length) user.ssoProvider = 'local';
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: `${provider} account unlinked`, user: userObj });
  } catch (err) {
    console.error('Failed to unlink social account:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Public: Get user by ID (for public profile)
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email phones avatarUrl country city role title bio timezone createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(404).json({ message: "User not found" });
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

router.get('/logs/recent', authenticateToken, getRecentLogs);

module.exports = router;
