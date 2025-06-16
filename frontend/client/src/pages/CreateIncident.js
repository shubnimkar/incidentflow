import React, { useState, useContext } from "react";
import { incidentApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import { DarkModeContext } from "../context/DarkModeContext"; // ✅ import context

function CreateIncident() {
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext); // ✅ get darkMode from context

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
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to create incident. Please make sure you're logged in.");
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: darkMode ? "#1e1e1e" : "#fff",
        color: darkMode ? "#f9f9f9" : "#000",
        minHeight: "100vh",
      }}
    >
      <h2>Create Incident</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Title:</label><br />
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: darkMode ? "#2c2c2c" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Description:</label><br />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: darkMode ? "#2c2c2c" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Severity:</label><br />
          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            style={{
              padding: "0.5rem",
              backgroundColor: darkMode ? "#2c2c2c" : "#fff",
              color: darkMode ? "#fff" : "#000",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <button
          type="submit"
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.2rem",
            backgroundColor: darkMode ? "#007bff" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Create Incident
        </button>
      </form>
    </div>
  );
}

export default CreateIncident;
