// /services/user/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["responder", "admin"],
    default: "responder",
  },
  avatarUrl: { type: String }, // ✅ Move it outside of 'role'
  title: { type: String, default: '' },
  bio: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  status: {
    type: String,
    enum: [
      'available',
      'busy',
      'do not disturb',
      'be right back',
      'appear away',
      'appear offline'
    ],
    default: 'available',
  },
  lastLogin: { type: Date },
  city: { type: String },
  country: { type: String },
  googleId: { type: String, default: null },
  githubId: { type: String, default: null },
  microsoftId: { type: String, default: null },
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
        pending: { type: Boolean, default: true }, // Will be set to false after code verification
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
        value: { type: String, required: true }, // email or phone
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        type: { type: String, enum: ['email', 'phone'], required: true },
      }
    ],
    default: [],
  },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
