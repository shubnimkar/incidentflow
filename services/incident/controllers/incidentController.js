const Incident = require("../models/Incident");
const User = require("../models/User");


const createIncident = async (req, res) => {
  const { title, description, severity } = req.body;
  const user = req.user; // ✅ this is set by verifyToken

  try {
    const incident = new Incident({
      title,
      description,
      severity,
      createdBy: user.id,           // ✅ userId was not defined — use req.user.id
      createdByEmail: user.email,   // ✅ optional
    });

    await incident.save();
    res.status(201).json(incident);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: "Error creating incident" });
  }
};


const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().populate("createdBy", "email").populate("assignedTo", "email");

    const enriched = incidents.map((incident) => {
      const email = incident.createdBy?.email || incident.createdByEmail || "N/A";
      return { ...incident.toObject(), createdByEmail: email };
    });

    res.json(enriched);
  } catch (error) {
    console.error("🔥 Error fetching incidents:", error.stack || error);
    res.status(500).json({ message: "Server error" });
  }
};



const updateIncidentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;

  try {
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    if (status) incident.status = status;
    if (assignedTo) incident.assignedTo = assignedTo;

    await incident.save();
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const assignIncident = async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  try {
    const user = await User.findById(assignedTo);
    if (!user) return res.status(404).json({ message: "User not found" });

    const incident = await Incident.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true }
    ).populate("assignedTo", "email");

    res.status(200).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedIncident = await Incident.findByIdAndUpdate(id, updates, { new: true }).populate("createdBy assignedTo", "email");

    if (!updatedIncident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(updatedIncident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createIncident, getAllIncidents, updateIncidentStatus, assignIncident, updateIncident };
