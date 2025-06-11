const Incident = require("../models/Incident");


const createIncident = async (req, res) => {
  const { title, description, severity } = req.body;
  const userId = req.user.id; // From token
  const userEmail = req.user.email; // assuming this is included in the token


  try {
    const incident = new Incident({
      title,
      description,
      severity,
      createdBy: userId,
      createdByEmail: userEmail

    });

    await incident.save();
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().populate("createdBy", "email");

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

module.exports = { createIncident, getAllIncidents, updateIncidentStatus };
