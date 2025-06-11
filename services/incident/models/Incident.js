const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  title: String,
  description: String,
  severity: String,
  status: { type: String, default: "open" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Incident", incidentSchema);
