const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { collection: "users" }); // ensure it maps to existing collection

module.exports = mongoose.model("User", userSchema);
