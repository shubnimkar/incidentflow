// /services/user/index.js
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
require("dotenv").config();
const mongoUri = process.env.MONGO_URI;

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("User DB connected");
    app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
  })
  .catch((err) => console.error("DB error", err));
