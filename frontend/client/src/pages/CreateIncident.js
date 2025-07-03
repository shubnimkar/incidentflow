import React, { useState, useContext, useEffect } from "react";
import { incidentApi, userApi, onCallApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import { DarkModeContext } from "../context/DarkModeContext"; // ✅ import context
import toast from 'react-hot-toast';

const severityIcons = {
  low: '🟢',
  moderate: '🟡',
  high: '🟠',
  critical: '🔴',
};

function CreateIncident() {
  const navigate = useNavigate();
  const { darkMode } = useContext(DarkModeContext); // ✅ get darkMode from context
  const [teams, setTeams] = useState([]);
  const [assignToOnCall, setAssignToOnCall] = useState(false);
  const [onCallUser, setOnCallUser] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "low",
    tags: "",
    team: "",
    category: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    // Fetch teams from backend
    const fetchTeams = async () => {
      try {
        const res = await userApi.get("/teams");
        setTeams(res.data);
      } catch (err) {
        // ignore
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    // Fetch on-call user when assignToOnCall and team are set
    const fetchOnCall = async () => {
      if (assignToOnCall && form.team) {
        try {
          const res = await onCallApi.get(`/current?team=${form.team}`);
          setOnCallUser(res.data);
        } catch (err) {
          setOnCallUser(null);
        }
      } else {
        setOnCallUser(null);
      }
    };
    fetchOnCall();
  }, [assignToOnCall, form.team]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Convert tags to array, send all fields
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (assignToOnCall && onCallUser?._id) {
        payload.assignedTo = onCallUser._id;
      }
      await incidentApi.post("/incidents", payload);
      toast.success('Incident created!');
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to create incident. Please make sure you're logged in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">Create Incident</h2>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6 text-center">Fill out the details below to report a new incident.</p>
        {error && <div className="mb-4 p-2 rounded bg-red-100 text-red-700 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              autoFocus
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">A short, descriptive title for the incident.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Provide as much detail as possible about the incident.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200 flex items-center gap-2">
              Severity
              <span className="text-lg">{severityIcons[form.severity]}</span>
            </label>
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">How severe is the incident?</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Tags</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Comma-separated (e.g. bug,urgent)"
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Add tags to categorize the incident.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Outage, Security, Bug"
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Type or category of the incident.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Team</label>
            <select
              name="team"
              value={form.team}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Assign to a team.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="assignToOnCall"
              checked={assignToOnCall}
              onChange={e => setAssignToOnCall(e.target.checked)}
              disabled={!form.team}
            />
            <label htmlFor="assignToOnCall" className="text-sm text-gray-700 dark:text-gray-200">Assign to current on-call for team</label>
            {assignToOnCall && form.team && (
              <span className="text-xs ml-2">
                {onCallUser
                  ? `On-Call: ${onCallUser.name || onCallUser.email}`
                  : "No on-call user found"}
              </span>
            )}
          </div>
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

export default CreateIncident;
