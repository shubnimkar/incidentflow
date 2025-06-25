const mongoose = require("mongoose");

const onCallScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String },
  rotationType: {
    type: String,
    enum: ["daily", "weekly"],
    default: "weekly"
  },
  timeZone: { type: String, default: "UTC" },
  users: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    }
  ],
  currentOnCallIndex: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  lastRotated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OnCallSchedule", onCallScheduleSchema);
