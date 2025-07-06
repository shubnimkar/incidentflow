import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { userApi } from "../services/api";

export default function CreateIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    incidentType: null,
    impactedService: null,
    description: "",
    urgency: null,
    priority: null,
    assignee: null,
    responders: [],
    meetingUrl: "",
    team: null,
  });
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");

  // Hardcoded service options
  const serviceOptions = [
    { value: "API Gateway", label: "API Gateway" },
    { value: "Frontend Web App", label: "Frontend Web App" },
    { value: "Mobile App", label: "Mobile App" },
    { value: "Database", label: "Database" },
    { value: "Authentication Service", label: "Authentication Service" },
    { value: "Payments Service", label: "Payments Service" },
    { value: "Notification Service", label: "Notification Service" },
    { value: "File Storage", label: "File Storage" },
    { value: "Search Service", label: "Search Service" },
    { value: "Reporting/Analytics", label: "Reporting/Analytics" },
    { value: "Third-Party Integration", label: "Third-Party Integration" },
    { value: "Internal Tools", label: "Internal Tools" },
    { value: "Load Balancer", label: "Load Balancer" },
    { value: "Network / VPN", label: "Network / VPN" },
    { value: "CI/CD Pipeline", label: "CI/CD Pipeline" },
    { value: "Monitoring/Alerting", label: "Monitoring/Alerting" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    // Fetch users using userApi (with token automatically attached)
    userApi.get("/")
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
    // Fetch teams
    userApi.get("/teams")
      .then((res) => setTeams(res.data))
      .catch(() => setTeams([]));
  }, []);

  // Options for selects
  const incidentTypeOptions = [
    { value: "Base Incident", label: "Base Incident" },
    { value: "Security Incident", label: "Security Incident" },
    { value: "Service Outage", label: "Service Outage" },
  ];
  const urgencyOptions = [
    { value: "High", label: "High" },
    { value: "Low", label: "Low" },
  ];
  const priorityOptions = [
    { value: "None", label: "None" },
    { value: "P1", label: "P1" },
    { value: "P2", label: "P2" },
    { value: "P3", label: "P3" },
    { value: "P4", label: "P4" },
  ];
  const userOptions = users.map((u) => ({
    value: u._id,
    label: u.name || u.email,
  }));
  const teamOptions = teams.map((t) => ({ value: t._id, label: t.name }));

  // Handlers
  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        incidentType: form.incidentType?.value,
        impactedService: form.impactedService?.value,
        description: form.description,
        urgency: form.urgency?.value,
        priority: form.priority?.value,
        assignedTo: form.assignee?.value,
        responders: form.responders.map((r) => r.value),
        meetingUrl: form.meetingUrl,
        team: form.team?.value,
      };
      const res = await fetch("http://localhost:5001/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to create incident. Please check your input and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Create New Incident</h2>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6 text-center">Fill out the details below to create a new incident.</p>
        {error && <div className="mb-4 p-2 rounded bg-red-100 text-red-700 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Title<span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange("title", e.target.value)}
              required
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Incident Type */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Incident Type<span className="text-red-500">*</span></label>
            <Select
              options={incidentTypeOptions}
              value={form.incidentType}
              onChange={option => handleChange("incidentType", option)}
              required
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          {/* Impacted Service */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Impacted Service<span className="text-red-500">*</span></label>
            <Select
              options={serviceOptions}
              value={form.impactedService}
              onChange={option => handleChange("impactedService", option)}
              required
              isSearchable
              placeholder="Search..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Description</label>
            <textarea
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              rows={4}
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200 flex items-center gap-1">
              Urgency
              <span className="text-gray-400 cursor-pointer" title="How responders are notified.">ⓘ</span>
            </label>
            <Select
              options={urgencyOptions}
              value={form.urgency}
              onChange={option => handleChange("urgency", option)}
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
            <p className="text-xs text-gray-400 mt-1">How responders are notified.</p>
          </div>
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Priority</label>
            <Select
              options={priorityOptions}
              value={form.priority}
              onChange={option => handleChange("priority", option)}
              isSearchable
              className="react-select-container"
              classNamePrefix="react-select"
            />
            <p className="text-xs text-gray-400 mt-1">Helps responders know which incidents to focus on first.</p>
          </div>
          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Assignee</label>
            <Select
              options={userOptions}
              value={form.assignee}
              onChange={option => handleChange("assignee", option)}
              isSearchable
              placeholder="Search..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          {/* Team */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Team</label>
            <Select
              options={teamOptions}
              value={form.team}
              onChange={option => handleChange("team", option)}
              isSearchable
              placeholder="Select team..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          {/* Advanced Options */}
          <div>
            <button
              type="button"
              className="w-full text-left text-sm font-semibold text-blue-600 dark:text-blue-400 py-2 px-1 hover:underline focus:outline-none"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "▼" : "►"} Advanced Options
            </button>
            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-2 space-y-4">
                {/* Add additional responders */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Add additional responders to help</label>
                  <Select
                    options={userOptions}
                    value={form.responders}
                    onChange={options => handleChange("responders", options || [])}
                    isMulti
                    isSearchable
                    placeholder="Search..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                {/* Meeting URL */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Meeting URL</label>
                  <input
                    type="text"
                    value={form.meetingUrl}
                    onChange={e => handleChange("meetingUrl", e.target.value)}
                    placeholder="https://example.com/123-456-789"
                    className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              className="w-1/2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center"
              disabled={loading}
            >
              {loading && <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>}
              Create Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
