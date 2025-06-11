const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/incidents", require("./routes/incidentRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () =>
      console.log(`Incident service running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));
