const Incident = require("../models/Incident");


const createIncident = async (req, res) => {
  try {
    const { title, description, severity } = req.body;

    const newIncident = new Incident({
      title,
      description,
      severity,
      createdBy: req.user.userId,
      createdByEmail: req.user.email,
    });

    await newIncident.save();
    res.status(201).json(newIncident);
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ message: "Server error" });
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
