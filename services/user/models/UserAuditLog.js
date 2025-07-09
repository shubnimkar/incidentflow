const mongoose = require("mongoose");

const userAuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("UserAuditLog", userAuditLogSchema); 