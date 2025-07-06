const jwt = require("jsonwebtoken");
const Incident = require("../models/Incident");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Custom middleware to allow admins and incident creators to edit incidents
const canEditIncident = async (req, res, next) => {
  try {
    const incidentId = req.params.id;
    const incident = await Incident.findById(incidentId);
    
    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Allow admins to edit any incident
    if (req.user.role === "admin") {
      return next();
    }

    // Allow incident creators to edit their own incidents
    if (incident.createdBy && String(incident.createdBy) === String(req.user.id)) {
      return next();
    }

    // Allow if user email matches createdByEmail
    if (incident.createdByEmail && incident.createdByEmail === req.user.email) {
      return next();
    }

    return res.status(403).json({ message: "Not authorized to edit this incident" });
  } catch (err) {
    console.error('canEditIncident - Error:', err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  verifyToken,
  canEditIncident
};

