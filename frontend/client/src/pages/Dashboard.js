import React, { useEffect, useState } from "react";
import { incidentApi, userApi } from "../services/api";
import { Link } from "react-router-dom";

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userApi.get("/");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };

    fetchUsers();
  }, []);

  const handleAssign = async (incidentId, userId) => {
    try {
      await incidentApi.patch(`/incidents/${incidentId}/assign`, { userId });
      alert("Incident assigned successfully!");

      // Refresh incident list
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to assign incident", err);
      alert("Failed to assign incident");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Incident Dashboard</h2>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/create">
          <button>+ Create New Incident</button>
        </Link>
      </div>

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
            <br />
            <small>Assigned to: {incident.assignedTo?.email || "Unassigned"}</small>
            <br />
            <select
              value={incident.assignedTo?._id || ""}
              onChange={(e) => handleAssign(incident._id, e.target.value)}
            >
              <option value="">Assign to...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.email}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
