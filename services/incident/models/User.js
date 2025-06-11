// services/incident/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Add other fields as needed
});

module.exports = mongoose.model("User", userSchema);
