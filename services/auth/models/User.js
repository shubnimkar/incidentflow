const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["admin", "responder"],
    default: "responder"
  },
  avatarUrl: String,
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
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
