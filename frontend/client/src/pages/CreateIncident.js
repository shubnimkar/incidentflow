import React, { useState } from "react";
import { incidentApi } from "../services/api";
import { useNavigate } from "react-router-dom";

function CreateIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "low",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await incidentApi.post("/incidents", form);
      navigate("/dashboard"); // Redirect to dashboard after creation
    } catch (err) {
      console.error(err);
      setError("Failed to create incident. Please make sure you're logged in.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Create Incident</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label><br />
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Description:</label><br />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Severity:</label><br />
          <select name="severity" value={form.severity} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>Create Incident</button>
      </form>
    </div>
  );
}

export default CreateIncident;
