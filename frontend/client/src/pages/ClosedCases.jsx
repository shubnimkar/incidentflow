import React, { useEffect, useState } from "react";
import { incidentApi } from "../services/api";
import { Link } from "react-router-dom";
import PriorityBadge from "./PriorityBadge";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "../pages/UserAvatar";
import { Tooltip } from "react-tooltip";

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
      <h1 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight">Incident Dashboard</h1>
      <input
        type="text"
        placeholder="Search closed cases..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-6 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 w-full max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
      />
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300"><span className="animate-spin">⏳</span> Loading closed cases...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 mt-8 text-center">No closed cases found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
              <tr>
                <th className="px-5 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Priority</th>
                <th className="px-5 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Title</th>
                <th className="px-5 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Team</th>
                <th className="px-5 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Assignee</th>
                <th className="px-5 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Closed At</th>
                <th className="px-5 py-3 text-left font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(incident => (
                <tr key={incident._id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition duration-200 ease-in-out transform hover:scale-[1.01]">
                  <td className="px-5 py-3"><PriorityBadge priority={incident.priority} /></td>
                  <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white max-w-xs truncate">{incident.title}</td>
                  <td className="px-5 py-3">
                    {incident.team && incident.team.name
                      ? (
                        <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs font-semibold">{incident.team.name}</span>
                      )
                      : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-3 flex items-center gap-2">
                    {incident.assignedTo && incident.assignedTo.avatarUrl && (
                      <img
                        src={incident.assignedTo.avatarUrl}
                        alt={incident.assignedTo.name || incident.assignedTo.email}
                        className="w-6 h-6 rounded-full mr-2 inline-block border border-gray-200 dark:border-gray-700 shadow-sm"
                      />
                    )}
                    {incident.assignedTo && (incident.assignedTo.name || incident.assignedTo.email)
                      ? (
                        <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium">{incident.assignedTo.name || incident.assignedTo.email}</span>
                      )
                      : <span className="text-gray-400">-</span>}
                  </td>
                  <td
                    className="px-5 py-3 text-gray-700 dark:text-gray-300"
                    title={incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : undefined}
                  >
                    {incident.updatedAt
                      ? formatDistanceToNow(new Date(incident.updatedAt), { addSuffix: true })
                      : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Link to={`/incidents/${incident._id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">View Details</Link>
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