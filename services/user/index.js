// /services/user/index.js
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const mongoUri = process.env.MONGO_URI;

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Serve avatar files statically (public access)
app.use("/api/users/avatar", express.static(path.join(__dirname, "uploads/avatars")));

// Fallback route for avatar requests (public access)
app.get("/api/users/avatar/:filename", (req, res) => {
  const filename = req.params.filename;
  const avatarPath = path.join(__dirname, "uploads/avatars", filename);
  
  if (fs.existsSync(avatarPath)) {
    res.sendFile(avatarPath);
  } else {
    // Return a default avatar or 404
    res.status(404).json({ message: "Avatar not found" });
  }
});

app.use("/api/users", userRoutes);

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("User DB connected");
    app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
  })
  .catch((err) => console.error("DB error", err));
