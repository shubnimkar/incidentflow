const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: {
    type: String,
    enum: ["admin", "responder"],
    default: "responder"
  },
  avatarUrl: { type: String },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // SSO fields
  googleId: String,
  githubId: String,
  microsoftId: String,
  ssoProvider: {
    type: String,
    enum: ["local", "google", "github", "microsoft"],
    default: "local"
  },
  // Extra fields for full user profile compatibility
  title: { type: String, default: '' },
  bio: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  lastLogin: { type: Date },
  city: { type: String },
  country: { type: String },
  socialAccounts: [
    {
      provider: { type: String },
      id: { type: String },
      email: { type: String },
    }
  ],
  phones: {
    type: [
      {
        value: { type: String, required: true },
        verified: { type: Boolean, default: false },
        pending: { type: Boolean, default: true },
      }
    ],
    default: [],
  },
  smsNumbers: { type: [String], default: [] },
  emails: {
    type: [
      {
        value: { type: String, required: true },
        verified: { type: Boolean, default: false },
        pending: { type: Boolean, default: true },
      }
    ],
    default: [],
  },
  verificationCodes: {
    type: [
      {
        value: { type: String, required: true },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        type: { type: String, enum: ['email', 'phone'], required: true },
      }
    ],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
