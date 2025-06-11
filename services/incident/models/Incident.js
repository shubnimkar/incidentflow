const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
  status: { type: String, enum: ["open", "acknowledged", "resolved"], default: "open" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Incident", incidentSchema);
