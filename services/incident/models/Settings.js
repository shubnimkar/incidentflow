const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  overdueWindowHours: {
    type: Number,
    default: 24,
    min: 1,
    max: 168 // up to 1 week
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema); 