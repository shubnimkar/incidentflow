import React, { useEffect, useState } from "react";
import { incidentApi } from "../services/api";
import { Link } from "react-router-dom";
import PriorityBadge from "./PriorityBadge";

const ClosedCases = () => {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClosed = async () => {
      setLoading(true);
      try {
        const res = await incidentApi.get("/incidents?status=closed");
        setIncidents(res.data);
      } catch {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClosed();
  }, []);

  const filtered = incidents.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Closed Cases</h1>
      <input
        type="text"
        placeholder="Search closed cases..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 rounded border w-full max-w-md dark:bg-gray-800 dark:text-white"
      />
      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No closed cases found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-4 py-2 text-left">Closed At</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(incident => (
                <tr key={incident._id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 font-medium">{incident.title}</td>
                  <td className="px-4 py-2">{incident.team || "-"}</td>
                  <td className="px-4 py-2">{incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-2">
                    <Link to={`/incidents/${incident._id}`} className="text-blue-600 dark:text-blue-400 hover:underline">View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClosedCases; 