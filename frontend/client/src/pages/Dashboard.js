import React, { useEffect, useState } from "react";
import {incidentApi} from "../services/api";

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentApi.get("/incidents");
        setIncidents(res.data);
      } catch (err) {
        setError("Failed to fetch incidents. Are you logged in?");
        console.error(err);
      }
    };

    fetchIncidents();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Incident Dashboard</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {incidents.length === 0 && !error && <p>No incidents found.</p>}

      <ul>
        {incidents.map((incident) => (
          <li
            key={incident._id}
            style={{
              marginBottom: "1rem",
              borderBottom: "1px solid #ccc",
              paddingBottom: "1rem",
            }}
          >
            <strong>{incident.title}</strong> <br />
            <small>
              Status: {incident.status} | Severity: {incident.severity}
            </small>
            <br />
            <small>Created by: {incident.createdBy?.email || "N/A"}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
