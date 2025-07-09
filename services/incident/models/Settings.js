const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  overdueWindowHours: {
    P1: { type: Number, default: 24, min: 1, max: 168 },
    P2: { type: Number, default: 48, min: 1, max: 168 },
    P3: { type: Number, default: 72, min: 1, max: 168 },
    P4: { type: Number, default: 120, min: 1, max: 168 },
    P5: { type: Number, default: 168, min: 1, max: 168 },
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema); 