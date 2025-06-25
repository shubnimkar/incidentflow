const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const onCallRoutes = require("./routes/onCallRoutes");
app.use("/api/oncall-schedules", onCallRoutes);

const PORT = process.env.PORT || 5005;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`✅ OnCall service running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB error:", err));
