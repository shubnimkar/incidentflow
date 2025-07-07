const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assumes user model is named 'User'
    required: true,
  },
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Incident",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
