import React, { useEffect, useState, useRef, Fragment } from "react";
import { useParams } from "react-router-dom";
import { incidentApi, userApi, onCallApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
//import 'emoji-mart/dist/emoji-mart.css';
import { FaRegEdit, FaTrashAlt } from 'react-icons/fa';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { MdAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import PriorityBadge from "./PriorityBadge";
import Select from "react-select";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];
const urgencyOptions = [
  { value: "High", label: "High" },
  { value: "Low", label: "Low" },
];

const incidentTypeOptions = [
  { value: "Base Incident", label: "Base Incident" },
  { value: "Security Incident", label: "Security Incident" },
  { value: "Service Outage", label: "Service Outage" },
];
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
const priorityOptions = [
  { value: "None", label: "None" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
  { value: "P4", label: "P4" },
];

const BACKEND_URL = "http://localhost:5001";

const IncidentDetails = () => {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({
    title: "",
    description: "",
    status: "",
    urgency: "",
    team: "",
    incidentType: "",
    impactedService: "",
    priority: "",
    assignedTo: "",
    responders: [],
    meetingUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingAttachment, setDeletingAttachment] = useState("");
  const fileInputRef = useRef();
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingMentions, setEditingMentions] = useState([]);
  const [usersForMentions, setUsersForMentions] = useState([]);
  const [mentionDropdown, setMentionDropdown] = useState({ open: false, options: [], index: 0, anchor: null });
  const [commentMentions, setCommentMentions] = useState([]);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);
  const [hoveredCommentId, setHoveredCommentId] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, users: [], x: 0, y: 0 });
  const emojiPickerRef = useRef(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', description: '' });
  const [hoveredEmoji, setHoveredEmoji] = useState({ commentId: null, emoji: null, users: [] });
  const [teams, setTeams] = useState([]);
  const [assignToOnCall, setAssignToOnCall] = useState(false);
  const [onCallUser, setOnCallUser] = useState(null);
  const [onCallUserForTeam, setOnCallUserForTeam] = useState(null);

  const fetchActivity = async () => {
    setActivityLoading(true);
    setActivityError("");
    try {
      const res = await axios.get(`${BACKEND_URL}/api/incidents/logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivity(res.data);
    } catch (err) {
      setActivityError("Failed to load activity feed");
    } finally {
      setActivityLoading(false);
    }
  };

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
          urgency: res.data.urgency || "",
          team: res.data.team || "",
          incidentType: res.data.incidentType || "",
          impactedService: res.data.impactedService || "",
          priority: res.data.priority || "",
          assignedTo: res.data.assignedTo?._id || "",
          responders: res.data.responders || [],
          meetingUrl: res.data.meetingUrl || "",
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

  useEffect(() => {
    fetchActivity();
  }, [id, token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userApi.get("/", { headers: { Authorization: `Bearer ${token}` } });
        setUsersForMentions(res.data);
      } catch (err) {
        // ignore
      }
    };
    fetchUsers();
  }, [token]);

  useEffect(() => {
    if (!showEmojiPickerFor) return;
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPickerFor(null);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setShowEmojiPickerFor(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEmojiPickerFor]);

  useEffect(() => {
    // Fetch teams from backend
    const fetchTeams = async () => {
      try {
        const res = await userApi.get("/teams", { headers: { Authorization: `Bearer ${token}` } });
        setTeams(res.data);
      } catch (err) {
        console.error("Error fetching teams:", err);
        // ignore
      }
    };
    fetchTeams();
  }, [token]);

  useEffect(() => {
    // Fetch on-call user when assignToOnCall and team are set
    const fetchOnCall = async () => {
      if (assignToOnCall && editFields.team) {
        try {
          const res = await onCallApi.get(`/current?team=${editFields.team}`);
          setOnCallUser(res.data);
        } catch (err) {
          setOnCallUser(null);
        }
      } else {
        setOnCallUser(null);
      }
    };
    fetchOnCall();
  }, [assignToOnCall, editFields.team]);

  useEffect(() => {
    // Fetch on-call user for the incident's team (for badge display)
    if (incident && incident.team) {
      onCallApi.get(`/current?team=${incident.team}`)
        .then(res => setOnCallUserForTeam(res.data))
        .catch(() => setOnCallUserForTeam(null));
    } else {
      setOnCallUserForTeam(null);
    }
  }, [incident]);

  const canEdit = user?.role === "admin" || user?.email === incident?.createdBy?.email || user?.email === incident?.createdByEmail;
  const canDeleteAttachment = canEdit;

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditFields({
      title: incident.title,
      description: incident.description,
      status: incident.status,
      urgency: incident.urgency || "",
      team: incident.team || "",
      incidentType: incident.incidentType || "",
      impactedService: incident.impactedService || "",
      priority: incident.priority || "",
      assignedTo: incident.assignedTo?._id || "",
      responders: incident.responders || [],
      meetingUrl: incident.meetingUrl || "",
    });
    setEditMode(false);
    setError("");
  };
  const handleFieldChange = (field, value) => setEditFields((prev) => ({ ...prev, [field]: value }));

  const userOptions = users.map((u) => ({ value: u._id, label: u.name || u.email }));
  const teamOptions = teams.map((t) => ({ value: t._id, label: t.name }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...editFields,
        urgency: editFields.urgency,
        team: editFields.team,
        incidentType: editFields.incidentType,
        impactedService: editFields.impactedService,
        priority: editFields.priority,
        assignedTo: editFields.assignedTo,
        responders: editFields.responders,
        meetingUrl: editFields.meetingUrl,
      };
      if (assignToOnCall && onCallUser?._id) {
        payload.assignedTo = onCallUser._id;
      }
      const res = await incidentApi.patch(`/incidents/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
      setEditMode(false);
      fetchActivity();
      toast.success('Incident updated successfully!');
    } catch (err) {
      console.error("Error updating incident:", err);
      const errorMessage = err.response?.data?.message || "Failed to update incident";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCommentInput = (e) => {
    const value = e.target.value;
    setCommentText(value);
    const cursor = e.target.selectionStart;
    const lastAt = value.lastIndexOf("@", cursor - 1);
    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(value[lastAt - 1]))) {
      const query = value.slice(lastAt + 1, cursor).toLowerCase();
      const options = usersForMentions.filter(u => u.email.toLowerCase().includes(query));
      setMentionDropdown({ open: true, options, index: 0, anchor: lastAt });
    } else {
      setMentionDropdown({ open: false, options: [], index: 0, anchor: null });
    }
  };

  const handleMentionSelect = (user) => {
    const value = commentText;
    const cursor = value.length;
    const lastAt = value.lastIndexOf("@", cursor - 1);
    const before = value.slice(0, lastAt + 1);
    const after = value.slice(cursor);
    const mentionText = user.email;
    setCommentText(before + mentionText + " " + after);
    setCommentMentions((prev) => [...prev, user._id]);
    setMentionDropdown({ open: false, options: [], index: 0, anchor: null });
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
      fetchActivity();
      toast.success('Comment added!');
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment.");
    }
  };

  const handleAssign = async (userId) => {
    setAssigning(true);
    setAssignError("");
    try {
      const res = await incidentApi.patch(`/incidents/${id}/assign`, { assignedTo: userId }, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
      fetchActivity();
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
      fetchActivity();
      toast.success('Attachment uploaded!');
    } catch (err) {
      setUploadError("Failed to upload attachment");
      toast.error("Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = (filename) => {
    setConfirmModal({
      open: true,
      title: 'Delete Attachment',
      description: 'Are you sure you want to delete this attachment?',
      onConfirm: async () => {
        setDeletingAttachment(filename);
        try {
          const res = await incidentApi.delete(`/incidents/${id}/attachments/${encodeURIComponent(filename)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIncident(res.data);
          fetchActivity();
          toast.success('Attachment deleted!');
        } catch (err) {
          toast.error("Failed to delete attachment");
        } finally {
          setDeletingAttachment("");
        }
      }
    });
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.message);
    setEditingMentions(comment.mentions || []);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingMentions([]);
  };

  const handleSaveEdit = async (commentId) => {
    try {
      const res = await incidentApi.patch(`/incidents/${id}/comments/${commentId}`, {
        message: editingCommentText,
        mentions: editingMentions,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
      setEditingCommentId(null);
      setEditingCommentText("");
      setEditingMentions([]);
      fetchActivity();
      toast.success('Comment updated!');
    } catch (err) {
      toast.error("Failed to edit comment");
    }
  };

  const handleDeleteComment = (commentId) => {
    setConfirmModal({
      open: true,
      title: 'Delete Comment',
      description: 'Are you sure you want to delete this comment?',
      onConfirm: async () => {
        try {
          const res = await incidentApi.delete(`/incidents/${id}/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
          setIncident(res.data);
          fetchActivity();
          toast.success('Comment deleted!');
        } catch (err) {
          toast.error("Failed to delete comment");
        }
      }
    });
  };

  const handleReact = async (commentId, emoji) => {
    try {
      const res = await incidentApi.patch(`/incidents/${id}/comments/${commentId}/reactions`, { emoji }, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
      fetchActivity();
      toast.success('Reaction updated!');
    } catch (err) {
      toast.error("Failed to react to comment");
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
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                ID: {incident._id}
              </span>
            </div>
            {/* Urgency */}
            <div className="mt-2">
              <span className="font-semibold">Urgency:</span>{" "}
              {editMode ? (
                <select
                  className="px-3 py-1 rounded-full text-xs font-semibold border dark:bg-gray-800 dark:text-white"
                  value={editFields.urgency}
                  onChange={e => handleFieldChange('urgency', e.target.value)}
                  disabled={saving}
                >
                  {urgencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <span className="ml-1 text-gray-700 dark:text-gray-200">{incident.urgency || 'N/A'}</span>
              )}
            </div>
            {/* Team */}
            <div className="mt-2">
              <span className="font-semibold">Team:</span>{" "}
              {editMode ? (
                <select
                  className="w-full border px-2 py-1 rounded dark:bg-gray-800 dark:text-white mt-1"
                  value={editFields.team}
                  onChange={e => handleFieldChange('team', e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select team</option>
                  {teamOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <span className="ml-1 text-gray-700 dark:text-gray-200">
                  {incident.team?.name || teams.find(t => t._id === (incident.team?._id || incident.team))?.name || 'N/A'}
                </span>
              )}
            </div>
            {editMode && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="assignToOnCall"
                  checked={assignToOnCall}
                  onChange={e => setAssignToOnCall(e.target.checked)}
                  disabled={!editFields.team}
                />
                <label htmlFor="assignToOnCall" className="text-sm text-gray-700 dark:text-gray-200">Assign to current on-call for team</label>
                {assignToOnCall && editFields.team && (
                  <span className="text-xs ml-2">
                    {onCallUser
                      ? `On-Call: ${onCallUser.name || onCallUser.email}`
                      : "No on-call user found"}
                  </span>
                )}
              </div>
            )}
          </div>
          <div>
            <span className="font-semibold">Assigned To:</span>
            {editMode ? (
              <select
                className="w-full border px-2 py-1 rounded dark:bg-gray-800 dark:text-white mt-1"
                value={editFields.assignedTo}
                onChange={e => handleFieldChange('assignedTo', e.target.value)}
                disabled={saving}
              >
                <option value="">Unassigned</option>
                {userOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : incident.assignedTo ? (
              <span className="ml-1 text-gray-700 dark:text-gray-200">{incident.assignedTo.name || incident.assignedTo.email}</span>
            ) : (
              <span className="ml-1 text-gray-500">Unassigned</span>
            )}
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
          {!editMode && incident.status === 'resolved' && user?.role === 'admin' && (
            <button
              className="mt-2 w-full px-3 py-2 rounded-lg bg-green-600 text-white font-semibold text-xs hover:bg-green-700 transition"
              onClick={() => setConfirmModal({
                open: true,
                title: 'Mark Incident as Closed?',
                description: 'Are you sure you want to mark this incident as closed? This action cannot be undone.',
                onConfirm: async () => {
                  await incidentApi.put(`/incidents/${incident._id}`, { status: 'closed' }, { headers: { Authorization: `Bearer ${token}` } });
                  const res = await incidentApi.get(`/incidents/${incident._id}`, { headers: { Authorization: `Bearer ${token}` } });
                  setIncident(res.data);
                  fetchActivity();
                  toast.success('Incident marked as closed!');
                }
              })}
            >
              Mark as Closed
            </button>
          )}
          {/* Incident Type */}
          <div className="mt-2">
            <span className="font-semibold">Incident Type:</span>{" "}
            <span className="ml-1 text-gray-700 dark:text-gray-200">{incident.incidentType || 'N/A'}</span>
          </div>
          {/* Impacted Service */}
          <div className="mt-2">
            <span className="font-semibold">Impacted Service:</span>{" "}
            <span className="ml-1 text-gray-700 dark:text-gray-200">{incident.impactedService || 'N/A'}</span>
          </div>
          {/* Priority */}
          <div className="mt-2">
            <span className="font-semibold">Priority:</span>{" "}
            <PriorityBadge priority={incident.priority || "None"} />
          </div>
          {/* Additional Responders */}
          <div className="mt-2">
            <span className="font-semibold">Additional Responders:</span>{" "}
            {editMode ? (
              <Select
                isMulti
                options={userOptions}
                value={userOptions.filter(opt => editFields.responders.some(u => u._id === opt.value))}
                onChange={options => handleFieldChange('responders', options.map(opt => users.find(u => u._id === opt.value)))}
                className="react-select-container mt-1"
                classNamePrefix="react-select"
                isDisabled={saving}
                placeholder="Select additional responders..."
              />
            ) : (
              <span className="ml-1 text-gray-700 dark:text-gray-200">{(incident.responders || []).map(u => u.name || u.email).join(', ') || 'None'}</span>
            )}
          </div>
          {/* Meeting URL */}
          <div className="mt-2">
            <span className="font-semibold">Meeting URL:</span>{" "}
            {editMode ? (
              <input
                className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:text-white"
                value={editFields.meetingUrl}
                onChange={e => handleFieldChange('meetingUrl', e.target.value)}
                disabled={saving}
                placeholder="https://example.com/meeting"
              />
            ) : (
              incident.meetingUrl ? (
                <a href={incident.meetingUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 underline">{incident.meetingUrl}</a>
              ) : (
                <span className="ml-1 text-gray-500">N/A</span>
              )
            )}
          </div>
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
                {[...incident.comments].reverse().map((c, i) => {
                  const canEditComment = String(user?.id) === String(c.user?._id);
                  const canDeleteComment = user?.role === "admin";
                  const mentionsInComment = (c.mentions || []).map(mid => usersForMentions.find(u => u._id === mid));
                  const usedEmojis = Array.from(new Set((c.reactions || []).map(r => r.emoji)));
                  console.log('Current user:', user?.id, 'Comment user:', c.user?._id, 'Can edit:', canEditComment);
                  console.log('Comment reactions:', c.reactions, 'usersForMentions:', usersForMentions);
                  return (
                    <li
                      key={i}
                      className="flex gap-3 items-start border p-3 rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 group relative hover:shadow-md transition-shadow"
                      onMouseEnter={() => setHoveredCommentId(c._id)}
                      onMouseLeave={() => setHoveredCommentId(null)}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800 mt-1">
                        {getInitials(c.user?.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {c.user?.name || c.user?.email || "Unknown User"}
                            {c.user?.role && (
                              <em className="text-xs text-gray-500 dark:text-gray-300 ml-1">({c.user.role})</em>
                            )}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        {editingCommentId === c._id ? (
                          <div className="flex flex-col gap-2 mt-1 border-2 border-blue-400 bg-blue-50 dark:bg-blue-900 rounded-lg p-2">
                            <textarea
                              className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:text-white min-h-[60px] focus:ring-2 focus:ring-blue-400"
                              value={editingCommentText}
                              onChange={e => setEditingCommentText(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleSaveEdit(c._id)} className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">Save</button>
                              <button onClick={handleCancelEdit} className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <Fragment>
                            <p className="text-gray-800 dark:text-gray-100 mt-1 break-words">
                              {c.message.split(/(@[\w.-]+)/g).map((part, idx) => {
                                if (part.startsWith("@")) {
                                  const mentioned = mentionsInComment.find(u => u && ("@" + u.email) === part);
                                  return mentioned ? (
                                    <span key={idx} className="bg-blue-100 text-blue-700 px-1 rounded">{part}</span>
                                  ) : part;
                                }
                                return part;
                              })}
                              {c.edited && <span className="ml-2 text-xs text-gray-400">(edited)</span>}
                            </p>
                            {mentionsInComment.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {mentionsInComment.map((u, idx) => u && <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">@{u.name || u.email}</span>)}
                              </div>
                            )}
                          </Fragment>
                        )}
                        {/* Reactions Row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap relative">
                          <div className="flex gap-1 items-center">
                            {usedEmojis.map(emoji => {
                              const count = c.reactions ? c.reactions.filter(r => r.emoji === emoji).length : 0;
                              const reacted = c.reactions ? c.reactions.some(r => r.emoji === emoji && r.user === user?.id) : false;
                              const users = (c.reactions || [])
                                .filter(r => r.emoji === emoji)
                                .map(r => {
                                  const u = usersForMentions.find(u => String(u._id) === String(r.user));
                                  return u?.name || u?.email;
                                })
                                .filter(Boolean);
                              return (
                                <span key={emoji} className="relative">
                                  <button
                                    type="button"
                                    onClick={() => handleReact(c._id, emoji)}
                                    onMouseEnter={() => setHoveredEmoji({ commentId: c._id, emoji, users })}
                                    onMouseLeave={() => setHoveredEmoji({ commentId: null, emoji: null, users: [] })}
                                    className={`px-2 py-1 rounded-full text-lg font-semibold transition-all duration-150 border border-transparent hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${reacted ? "bg-blue-200" : "bg-gray-100 dark:bg-gray-800"}`}
                                  >
                                    {emoji} {count > 0 && <span className="text-xs font-bold">{count}</span>}
                                  </button>
                                  {/* Tooltip for emoji users, shown below the emoji */}
                                  {hoveredEmoji.commentId === c._id && hoveredEmoji.emoji === emoji && hoveredEmoji.users.length > 0 && (
                                    <div
                                      className="absolute left-1/2 -translate-x-1/2 mt-2 bg-black text-white text-xs rounded px-2 py-1 z-30 whitespace-nowrap shadow-lg"
                                      style={{ top: '2.2em' }}
                                    >
                                      {hoveredEmoji.users.join(", ")}
                                    </div>
                                  )}
                                </span>
                              );
                            })}
                            {/* Plus button for emoji picker, only on hover */}
                            {hoveredCommentId === c._id && (
                              <button
                                type="button"
                                onClick={() => setShowEmojiPickerFor(c._id)}
                                className="ml-1 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-blue-400 text-white shadow-md hover:scale-110 hover:from-blue-600 hover:to-blue-500 transition-all duration-150 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                title="Add Reaction"
                              >
                                <MdAdd size={24} />
                              </button>
                            )}
                            {showEmojiPickerFor === c._id && (
                              <div
                                className="absolute z-20 mt-2 animate-emoji-fade-scale max-w-[90vw] sm:max-w-xs"
                                ref={emojiPickerRef}
                                style={{ minWidth: 280 }}
                              >
                                <Picker
                                  data={data}
                                  onEmojiSelect={emoji => {
                                    setShowEmojiPickerFor(null);
                                    handleReact(c._id, emoji.native);
                                  }}
                                  theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                                  previewPosition="none"
                                  skinTonePosition="none"
                                />
                              </div>
                            )}
                          </div>
                          {/* Edit/Delete controls, only on hover and at far right */}
                          {(canEditComment || canDeleteComment) && editingCommentId !== c._id && hoveredCommentId === c._id && (
                            <div className="flex gap-1 ml-auto">
                              {canEditComment && (
                                <button
                                  type="button"
                                  onClick={() => handleEditComment(c)}
                                  className="p-1 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-all duration-150 border border-transparent hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                  title="Edit"
                                >
                                  <FaRegEdit />
                                </button>
                              )}
                              {canDeleteComment && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c._id)}
                                  className="p-1 rounded-full bg-red-100 text-red-800 hover:bg-red-200 transition-all duration-150 border border-transparent hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                                  title="Delete"
                                >
                                  <FaTrashAlt />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2 relative">
              <div className="relative w-full">
                <input
                  type="text"
                  value={commentText}
                  onChange={handleCommentInput}
                  placeholder="Add a comment"
                  className="flex-1 border p-2 rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600 w-full"
                  ref={fileInputRef}
                />
                {mentionDropdown.open && mentionDropdown.options.length > 0 && (
                  <ul
                    className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-50 max-h-48 overflow-y-auto animate-emoji-fade-scale"
                    style={{ minWidth: 180 }}
                  >
                    {mentionDropdown.options.map((u, idx) => (
                      <li
                        key={u._id}
                        className={`px-3 py-2 cursor-pointer text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ${mentionDropdown.index === idx ? "bg-blue-50 dark:bg-blue-900" : ""}`}
                        onClick={() => handleMentionSelect(u)}
                      >
                        @{u.name || u.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
          {/* Activity Feed / Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 border border-gray-200 dark:border-gray-700 mt-4 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Activity Feed</h3>
            {activityLoading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            ) : activityError ? (
              <p className="text-red-500 dark:text-red-400">{activityError}</p>
            ) : activity.length > 0 ? (
              <ul className="space-y-4">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      {/* Icon based on action type */}
                      {a.action.includes('status') ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : a.action.includes('assign') ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 17l-4 4m0 0l-4-4m4 4V3" /></svg>
                      ) : a.action.includes('edit') || a.action.includes('update') ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18" /></svg>
                      ) : a.action.includes('comment') ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2m4-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                      ) : a.action.includes('attachment') ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l7.07-7.07a4 4 0 00-5.656-5.657l-7.07 7.07a6 6 0 108.485 8.485l7.071-7.07" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{a.performedBy?.email || 'System'}</span>
                        <span className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                        {a.action}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={async () => {
          if (confirmModal.onConfirm) await confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, open: false });
        }}
        title={confirmModal.title}
        description={confirmModal.description}
      />
    </div>
  );
};

export default IncidentDetails;
