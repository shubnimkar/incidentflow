import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { incidentApi, userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const severityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
];

const BACKEND_URL = "http://localhost:5001";

const IncidentDetails = () => {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", description: "", status: "", severity: "" });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingAttachment, setDeletingAttachment] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await incidentApi.get(`/incidents/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIncident(res.data);
        setEditFields({
          title: res.data.title,
          description: res.data.description,
          status: res.data.status,
          severity: res.data.severity,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching incident:", err);
      }
    };
    fetchIncident();
  }, [id, token]);

  useEffect(() => {
    // Fetch users for assignee dropdown (future use)
    const fetchUsers = async () => {
      try {
        const res = await userApi.get("/", { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
      } catch (err) {
        // ignore
      }
    };
    fetchUsers();
  }, [token]);

  const canEdit = user?.role === "admin" || user?.email === incident?.createdBy?.email || user?.email === incident?.createdByEmail;
  const canDeleteAttachment = canEdit;

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditFields({
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
    });
    setEditMode(false);
    setError("");
  };
  const handleFieldChange = (field, value) => setEditFields((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await incidentApi.patch(`/incidents/${id}`, editFields, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
      setEditMode(false);
    } catch (err) {
      setError("Failed to update incident");
    } finally {
      setSaving(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await incidentApi.post(
        `/incidents/${id}/comments`,
        { message: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIncident(res.data);
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment.");
    }
  };

  const handleAssign = async (userId) => {
    setAssigning(true);
    setAssignError("");
    try {
      const res = await incidentApi.patch(`/incidents/${id}/assign`, { assignedTo: userId }, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
    } catch (err) {
      setAssignError("Failed to assign user");
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email
      .split("@")[0]
      .split(/[^a-zA-Z]/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await incidentApi.post(`/incidents/${id}/attachments`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncident(res.data);
    } catch (err) {
      setUploadError("Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    setDeletingAttachment(filename);
    try {
      const res = await incidentApi.delete(`/incidents/${id}/attachments/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncident(res.data);
    } catch (err) {
      alert("Failed to delete attachment");
    } finally {
      setDeletingAttachment("");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-lg">Loading...</div>;
  if (!incident) return <div className="h-screen flex items-center justify-center text-lg">Incident not found</div>;

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      {/* Hero Heading */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Incident Details</h2>
        </div>
        <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
      </div>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Left Panel: Summary */}
        <div className="md:w-1/3 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col gap-6 min-w-[260px]">
          <div>
            {editMode ? (
              <input
                className="w-full text-xl font-bold mb-2 border px-2 py-1 rounded dark:bg-gray-800 dark:text-white"
                value={editFields.title}
                onChange={e => handleFieldChange('title', e.target.value)}
                disabled={saving}
              />
            ) : (
              <h2 className="text-xl font-bold mb-2">{incident.title}</h2>
            )}
            <div className="flex flex-wrap gap-2 items-center mb-2">
              {editMode ? (
                <select
                  className="px-3 py-1 rounded-full text-xs font-semibold border dark:bg-gray-800 dark:text-white"
                  value={editFields.status}
                  onChange={e => handleFieldChange('status', e.target.value)}
                  disabled={saving}
                >
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  incident.status === "open"
                    ? "bg-green-600"
                    : incident.status === "in_progress"
                    ? "bg-yellow-500"
                    : "bg-gray-600"
                }`}>
                  {incident.status.replace("_", " ").toUpperCase()}
                </span>
              )}
              {editMode ? (
                <select
                  className="px-3 py-1 rounded-full text-xs font-semibold border dark:bg-gray-800 dark:text-white"
                  value={editFields.severity}
                  onChange={e => handleFieldChange('severity', e.target.value)}
                  disabled={saving}
                >
                  {severityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  incident.severity === "critical"
                    ? "bg-red-600 text-white"
                    : incident.severity === "high"
                    ? "bg-orange-500 text-white"
                    : incident.severity === "moderate"
                    ? "bg-yellow-400 text-gray-900"
                    : incident.severity === "low"
                    ? "bg-green-600 text-white"
                    : "bg-gray-400 text-white"
                }`}>
                  {incident.severity}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                ID: {incident._id}
              </span>
            </div>
          </div>
          <div>
            <span className="font-semibold">Assigned To:</span>
            {editMode && user?.role === "admin" ? (
              <select
                className="ml-2 px-2 py-1 rounded border dark:bg-gray-800 dark:text-white"
                value={incident.assignedTo?._id || ""}
                onChange={e => handleAssign(e.target.value)}
                disabled={assigning}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.email} {u.role === "admin" ? "(admin)" : ""}</option>
                ))}
              </select>
            ) : incident.assignedTo ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800">
                  {getInitials(incident.assignedTo.email)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{incident.assignedTo.email}</span>
                  {incident.assignedTo.role && (
                    <span className={`text-xs font-medium px-2 py-0.5 mt-1 w-fit rounded-full ${
                      incident.assignedTo.role === "admin"
                        ? "bg-purple-100 dark:bg-purple-900 dark:text-purple-200 text-purple-800"
                        : "bg-green-100 dark:bg-green-900 dark:text-green-200 text-green-800"
                    }`}>
                      {incident.assignedTo.role}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className="ml-2 text-gray-500">Unassigned</span>
            )}
            {assigning && <span className="ml-2 text-xs text-blue-600">Assigning...</span>}
            {assignError && <span className="ml-2 text-xs text-red-600">{assignError}</span>}
          </div>
          <div>
            <span className="font-semibold">Created By:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800">
                {getInitials(incident.createdBy?.email || incident.createdByEmail)}
              </div>
              <span className="text-sm text-gray-800 dark:text-gray-200">{incident.createdBy?.email || incident.createdByEmail}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p><span className="font-semibold">Created At:</span> {incident.createdAt && !isNaN(Date.parse(incident.createdAt)) ? new Date(incident.createdAt).toLocaleString() : "N/A"}</p>
            <p><span className="font-semibold">Last Updated:</span> {new Date(incident.updatedAt).toLocaleString()}</p>
          </div>
          {/* Quick Actions Placeholder */}
          {canEdit && (
            <div className="flex gap-2 mt-2">
              {editMode ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
                  <button onClick={handleCancel} disabled={saving} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition">Cancel</button>
                </>
              ) : (
                <button onClick={handleEdit} className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold text-xs hover:bg-blue-200 transition">Edit</button>
              )}
              {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
            </div>
          )}
        </div>
        {/* Right Panel: Details & Comments */}
        <div className="md:w-2/3 w-full flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700 mb-2">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            {editMode ? (
              <textarea
                className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:text-white min-h-[80px]"
                value={editFields.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                disabled={saving}
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 mb-2">{incident.description}</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Comments</h3>
            {incident.comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {[...incident.comments].reverse().map((c, i) => (
                  <li key={i} className="flex gap-3 items-start border p-3 rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800 mt-1">
                      {getInitials(c.user?.email)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {c.user?.email || "Unknown User"}
                          {c.user?.role && (
                            <em className="text-xs text-gray-500 dark:text-gray-300 ml-1">({c.user.role})</em>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-100 mt-1">{c.message}</p>
                    </div>
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
                className="flex-1 border p-2 rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Submit
              </button>
            </form>
          </div>
          {/* Attachments Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700 mb-2">
            <h3 className="text-lg font-semibold mb-2">Attachments</h3>
            {canEdit && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAttachmentUpload}
                  className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploading}
                />
                {uploading && <span className="text-xs text-blue-600">Uploading...</span>}
                {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
              </div>
            )}
            {incident.attachments && incident.attachments.length > 0 ? (
              <ul className="space-y-2">
                {incident.attachments.map((att, i) => {
                  const filename = att.url.split("/").pop();
                  return (
                    <li key={i} className="flex items-center gap-3 p-2 rounded bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <a
                        href={BACKEND_URL + att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        {att.filename}
                      </a>
                      <a
                        href={`${BACKEND_URL}/api/incidents/${incident._id}/attachments/${encodeURIComponent(filename)}/download`}
                        download
                        className="ml-1 px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        Download
                      </a>
                      <span className="text-xs text-gray-500">{att.uploadedBy?.email || "Unknown"}</span>
                      <span className="text-xs text-gray-400">{att.uploadedAt ? new Date(att.uploadedAt).toLocaleString() : ""}</span>
                      {canDeleteAttachment && (
                        <button
                          onClick={() => handleDeleteAttachment(filename)}
                          disabled={deletingAttachment === filename}
                          className="ml-2 px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-xs text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-60"
                        >
                          {deletingAttachment === filename ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No attachments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;
