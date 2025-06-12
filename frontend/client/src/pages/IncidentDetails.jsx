import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {incidentApi} from "../services/api"; // adjust if different
import { useAuth } from "../context/AuthContext"; // adjust if different

const IncidentDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [incident, setIncident] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await incidentApi.get(`/incidents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIncident(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching incident:", err);
      }
    };

    fetchIncident();
  }, [id, token]);

  const handleCommentSubmit = async (e) => {
  e.preventDefault();
  if (!commentText.trim()) return;

  try {
    const res = await incidentApi.post(
      `/incidents/${id}/comments`, // ✅ singular
      { message: commentText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setIncident(res.data); // refreshed incident with updated comments
    setCommentText("");
  } catch (err) {
    console.error("Error adding comment:", err);
    alert("Failed to add comment.");
  }
};


  if (loading) return <div>Loading...</div>;
  if (!incident) return <div>Incident not found</div>;

  return (
<div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md space-y-4">
  <h2 className="text-2xl font-bold">{incident.title}</h2>

  <p className="text-gray-700">{incident.description}</p>
  <p><strong>Incident ID:</strong> {incident._id}</p>

  <div className="flex items-center gap-3">
    <span><strong>Status:</strong></span>
    <span className={`px-2 py-1 rounded-full text-white text-sm ${
      incident.status === "open"
        ? "bg-green-600"
        : incident.status === "in_progress"
        ? "bg-yellow-500"
        : "bg-gray-600"
    }`}>
      {incident.status.replace("_", " ").toUpperCase()}
    </span>
  </div>

  <p><strong>Severity:</strong> {incident.severity}</p>
  <p><strong>Created By:</strong> {incident.createdBy?.email || incident.createdByEmail}</p>
  <p><strong>Assigned To:</strong> {incident.assignedTo?.email || "Unassigned"}</p>
  <p><strong>Created At:</strong> {new Date(incident.createdAt).toLocaleString()}</p>
  <p><strong>Last Updated:</strong> {new Date(incident.updatedAt).toLocaleString()}</p>

  <hr />

  <div className="mt-6">
    <h3 className="text-xl font-semibold mb-2">Comments</h3>
    {incident.comments.length === 0 ? (
      <p>No comments yet.</p>
    ) : (
      <ul className="space-y-2">
        {[...incident.comments].reverse().map((c, i) => (
          <li key={i} className="border p-2 rounded bg-gray-50">
            <div className="flex justify-between">
              <p className="text-sm text-gray-600">
                <strong>{c.user?.email || "Unknown User"}</strong>{" "}
                {c.user?.role && <em className="text-xs text-gray-500">({c.user.role})</em>}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
            <p>{c.message}</p>
          </li>
        ))}
      </ul>
    )}

    <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2">
      <input
        type="text"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Add a comment"
        className="flex-1 border p-2 rounded"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </form>
  </div>
</div>

  );
};

export default IncidentDetails;
