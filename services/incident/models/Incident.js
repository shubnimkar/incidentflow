// models/Incident.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reactions: [{
    emoji: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  }],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
});

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // must match model name
    },
    createdByEmail: {
      type: String,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Add tags for flexible categorization
    tags: [{ type: String }],
    // Add team assignment (reference to Team model)
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    // Add category for incident type
    category: {
      type: String,
    },
    comments: [commentSchema],
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);
