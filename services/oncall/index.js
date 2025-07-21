const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// const onCallRoutes = require("./routes/onCallRoutes"); // Remove this line

const app = express();
app.use(cors());
app.use(express.json());

// Register routes
// app.use("/api/oncall", onCallRoutes); // Remove this line

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/incidentflow";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`OnCall service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  }); 