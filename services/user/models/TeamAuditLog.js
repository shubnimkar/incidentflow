const mongoose = require("mongoose");

const teamAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. created, updated, deleted, added member, removed member
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  details: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TeamAuditLog", teamAuditLogSchema); 