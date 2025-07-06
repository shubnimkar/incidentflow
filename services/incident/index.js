const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();


require("./models/User"); // 👈 register the User model
require("./models/Team");

dotenv.config();
const app = express();

// --- Socket.IO setup ---
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});
app.set('io', io); // Make io available in req.app
// --- End Socket.IO setup ---

app.use(cors({
  origin: "http://localhost:3000", // React app origin
  credentials: true,              // allows cookies/authorization headers
}));
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/incident-attachments");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve attachments as static files
app.use("/uploads/incident-attachments", express.static(uploadsDir));

app.use("/api/incidents", require("./routes/incidentRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(process.env.PORT, () =>
      console.log(`Incident service running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.log(err));
