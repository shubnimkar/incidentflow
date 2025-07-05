const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  overdueWindowHours: {
    type: Number,
    default: 24,
    min: 1,
    max: 168 // up to 1 week
  },
  overdueWindowPerSeverity: {
    type: Object,
    default: {
      critical: 4,
      high: 24,
      moderate: 48,
      low: 72
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema); 