const mongoose = require("mongoose");

const scheduleEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
});

const onCallRotationSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ordered
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  schedule: [scheduleEntrySchema],
}, { timestamps: true });

module.exports = mongoose.model("OnCallRotation", onCallRotationSchema); 