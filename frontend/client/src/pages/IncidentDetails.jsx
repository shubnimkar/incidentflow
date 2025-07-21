import React, { useEffect, useState, useRef, Fragment } from "react";
import { useParams } from "react-router-dom";
import { incidentApi, userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
//import 'emoji-mart/dist/emoji-mart.css';
import { FaRegEdit, FaTrashAlt, FaFilePdf, FaFileImage, FaFileAlt, FaFile, FaDownload } from 'react-icons/fa';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { MdAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import PriorityBadge from "./PriorityBadge";
import Select from "react-select";
import { io } from "socket.io-client";

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
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
  { value: "P4", label: "P4" },
  { value: "P5", label: "P5" },
];

const BACKEND_URL = "http://localhost:5001";

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

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'open':
      return 'badge-warning';
    case 'in_progress':
      return 'badge-warning';
    case 'resolved':
      return 'badge-success';
    case 'closed':
      return 'text-meta bg-gray-100 border border-gray-200';
    default:
      return 'text-meta bg-gray-100 border border-gray-200';
  }
};

const IncidentHeader = ({ incident, onEdit, onClose, onEscalate, editMode, saving, onSave, onCancel, canEdit, showClose, onCloseIncident, isClosed, showReopen, onReopenIncident }) => (
  <div className="bg-white rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8 border border-gray-100 mb-8 card">
    {/* Left: Main Info */}
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      {/* Title and badges */}
      <div className="flex items-center gap-4 flex-wrap mb-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--if-text-main)] truncate flex items-center gap-2">
          {incident?.title}
        </h1>
        {incident?.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(incident.status)}`}>{incident.status.replace('_', ' ')}</span>
        )}
        {incident?.priority && <span><PriorityBadge priority={incident.priority} /></span>}
      </div>
      {/* Closed info message */}
      {isClosed && (
        <div className="mt-2 mb-1 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          Closed incidents are view only
        </div>
      )}
      {/* Commander */}
      {incident?.assignedTo && (
        <div className="flex items-center gap-2 group mb-1">
          <span className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-lg border-2 border-white shadow group-hover:ring-2 group-hover:ring-blue-400 transition">
            {incident.assignedTo.name?.[0] || getInitials(incident.assignedTo.email)}
          </span>
          <span className="text-base font-medium text-[var(--if-text-main)] group-hover:underline cursor-pointer" title={incident.assignedTo.email}>
            {incident.assignedTo.name || incident.assignedTo.email}
          </span>
          <span className="text-xs text-meta ml-2">Incident Commander</span>
        </div>
      )}
      {/* Meta info row */}
      <div className="flex flex-wrap gap-4 text-xs text-meta bg-gray-50 rounded px-3 py-1">
        <span>ID: {incident?._id}</span>
        <span>Created at: {incident?.createdAt ? new Date(incident.createdAt).toLocaleString() : 'N/A'}</span>
        <span>Created by: {incident?.createdBy?.name || incident?.createdBy?.email || incident?.createdByEmail || 'N/A'}</span>
        <span>Last updated: {incident?.updatedAt ? new Date(incident.updatedAt).toLocaleString() : 'N/A'}</span>
      </div>
    </div>
    {/* Right: Actions */}
    <div className="flex flex-col md:flex-row gap-2 flex-shrink-0 items-end md:items-center justify-end mt-4 md:mt-0">
      {canEdit && !editMode && (
        <button onClick={onEdit} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg btn-primary font-semibold text-sm shadow transition">
          <FaRegEdit className="mr-1" /> Edit
        </button>
      )}
      {editMode && (
        <>
          <button onClick={onSave} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg btn-primary font-semibold text-sm shadow transition" disabled={saving}>Save</button>
          <button onClick={onCancel} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold text-sm shadow hover:bg-gray-300 transition ml-2">Cancel</button>
        </>
      )}
      {/* Close Incident Button */}
      {showClose && (
        <button
          onClick={onCloseIncident}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm shadow hover:bg-red-700 transition ml-2"
        >
          <FaRegEdit className="mr-1" /> Close Incident
        </button>
      )}
      {/* Reopen Incident Button */}
      {showReopen && (
        <button
          onClick={onReopenIncident}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm shadow hover:bg-green-700 transition ml-2"
        >
          <FaRegEdit className="mr-1" /> Reopen Incident
        </button>
      )}
    </div>
  </div>
);

const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow border border-[#e5e7eb] p-6 mb-6 ${className}`}>
    {title && <h2 className="text-lg font-semibold mb-4 text-slate-800">{title}</h2>}
    {children}
  </div>
);

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return <FaFileImage className="text-blue-400" />;
  if (["pdf"].includes(ext)) return <FaFilePdf className="text-red-500" />;
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext)) return <FaFileAlt className="text-gray-500" />;
  return <FaFile className="text-gray-400" />;
}

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [customFilename, setCustomFilename] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [reopenFields, setReopenFields] = useState(null);
  const socketRef = useRef(null);

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

  // Only allow editing if not closed
  const isClosed = incident?.status === 'closed';
  const canEdit = (user?.role === "admin" || user?.email === incident?.createdBy?.email || user?.email === incident?.createdByEmail) && !isClosed;
  const canDeleteAttachment = canEdit;

  const handleEdit = () => { if (!isClosed) setEditMode(true); };
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
      const res = await incidentApi.patch(`/incidents/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const ext = file.name.split('.').pop();
    const base = file.name.replace(new RegExp(`\\.${ext}$`), '');
    setCustomFilename(base);
  };

  const handleAttachmentUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    const ext = selectedFile.name.split('.').pop();
    const filename = `${customFilename}.${ext}`;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('filename', filename);
    try {
      const res = await incidentApi.post(`/incidents/${id}/attachments`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncident(res.data);
      fetchActivity();
      toast.success('Attachment uploaded!');
    } catch (err) {
      setUploadError('Failed to upload attachment');
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setCustomFilename("");
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  function formatValue(val, field, users, teams) {
    if (field === 'responders' && Array.isArray(val)) {
      return val.map(idOrObj => {
        if (typeof idOrObj === 'object') {
          return idOrObj.name || idOrObj.email || idOrObj._id || JSON.stringify(idOrObj);
        }
        const user = users.find(u => u._id === idOrObj);
        return user ? (user.name || user.email) : idOrObj;
      }).join(', ');
    }
    if (field === 'assignedTo' && val) {
      if (typeof val === 'object') {
        return val.name || val.email || val._id || JSON.stringify(val);
      }
      const user = users.find(u => u._id === val);
      return user ? (user.name || user.email) : val;
    }
    if (field === 'team' && val) {
      if (typeof val === 'object') {
        return val.name || val._id || JSON.stringify(val);
      }
      const team = teams.find(t => t._id === val);
      return team ? team.name : val;
    }
    if (Array.isArray(val)) {
      return val.map(v => v?.name || v?.email || v?._id || v).join(', ');
    }
    if (val && typeof val === 'object') {
      return val.name || val.email || val._id || JSON.stringify(val);
    }
    return String(val);
  }

  function renderAuditLogDetails(a) {
    if (!a.details) return a.action;
    if (a.details.field && a.details.oldValue !== undefined && a.details.newValue !== undefined) {
      return (
        <>
          <span className="font-semibold text-blue-700">{a.performedBy?.email || 'Someone'}</span>
          {" changed "}
          <span className="font-semibold capitalize">{a.details.field.replace(/([A-Z])/g, ' $1')}</span>
          {" from "}
          <span className="font-mono">{formatValue(a.details.oldValue, a.details.field, users, teams)}</span>
          {" to "}
          <span className="font-mono">{formatValue(a.details.newValue, a.details.field, users, teams)}</span>
          {"."}
        </>
      );
    }
    if (a.details.comment) {
      return <><span className="font-semibold text-blue-700">{a.performedBy?.email || 'Someone'}</span> added a comment: <span className="italic">"{a.details.comment}"</span></>;
    }
    if (a.details.filename) {
      if (a.action === "deleted attachment") {
        return <><span className="font-semibold text-blue-700">{a.performedBy?.email || 'Someone'}</span> deleted attachment: <span className="font-mono">{a.details.filename}</span></>;
      }
      return <><span className="font-semibold text-blue-700">{a.performedBy?.email || 'Someone'}</span> uploaded attachment: <span className="font-mono">{a.details.filename}</span></>;
    }
    // fallback
    return a.action;
  }

  const handleCloseIncident = () => setShowCloseModal(true);
  const handleConfirmClose = async () => {
    try {
      const res = await incidentApi.put(`/incidents/${id}`, { status: 'closed' }, { headers: { Authorization: `Bearer ${token}` } });
      setIncident(res.data);
      setShowCloseModal(false);
      toast.success('Incident closed successfully!');
    } catch (err) {
      toast.error('Failed to close incident');
      setShowCloseModal(false);
    }
  };

  const handleReopenIncident = () => {
    setReopenFields({ ...editFields, status: 'open' });
    setShowReopenModal(true);
  };

  const handleReopenFieldChange = (field, value) => setReopenFields(prev => ({ ...prev, [field]: value }));

  const handleContinueReopen = () => {
    setShowReopenModal(false);
    setShowReopenConfirm(true);
  };

  const handleConfirmReopen = async () => {
    try {
      const payload = { ...reopenFields, status: 'open' };
      await incidentApi.patch(`/incidents/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      // Re-fetch the incident to ensure all fields are up to date
      const res = await incidentApi.get(`/incidents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
      setShowReopenConfirm(false);
      fetchActivity();
      toast.success('Incident reopened and updated!');
    } catch (err) {
      toast.error('Failed to reopen incident');
      setShowReopenConfirm(false);
    }
  };

  // Real-time updates for incident and activity feed
  useEffect(() => {
    socketRef.current = io("http://localhost:5001");
    socketRef.current.on("incidentUpdated", (updatedIncident) => {
      if (updatedIncident._id === id) {
        // Refetch incident and activity feed
        incidentApi.get(`/incidents/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => setIncident(res.data));
        fetchActivity();
      }
    });
    socketRef.current.on("auditLogCreated", (log) => {
      if (log.incident && (log.incident._id === id || log.incident === id)) {
        fetchActivity();
      }
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id, token]);

  if (loading) return <div className="h-screen flex items-center justify-center text-lg">Loading...</div>;
  if (!incident) return <div className="h-screen flex items-center justify-center text-lg">Incident not found</div>;

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (commentText.trim()) handleCommentSubmit(e);
    }
  };
  const handleFilenameKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && selectedFile && customFilename && !isClosed && !uploading) {
      e.preventDefault();
      handleAttachmentUpload();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {/* Header */}
          <IncidentHeader
            incident={incident}
            onEdit={handleEdit}
            onClose={() => {}}
            onEscalate={() => {}}
            editMode={editMode}
            saving={saving}
            onSave={handleSave}
            onCancel={handleCancel}
            canEdit={canEdit}
            showClose={canEdit && !editMode && incident?.status === 'resolved'}
            onCloseIncident={handleCloseIncident}
            isClosed={isClosed}
            showReopen={isClosed && (user?.role === 'admin' || user?.email === incident?.createdBy?.email || user?.email === incident?.createdByEmail)}
            onReopenIncident={handleReopenIncident}
          />
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column: Details, Participants, Attachments */}
            <div className="flex-1 min-w-0">
              <Card title="Details" className="card">
                {/* Title */}
                {editMode ? (
                  <input
                    className="w-full text-2xl font-bold mb-3 border px-2 py-1 rounded"
                    value={editFields.title}
                    onChange={e => handleFieldChange('title', e.target.value)}
                    disabled={saving || isClosed}
                  />
                ) : (
                  <h2 className="text-2xl font-bold mb-3">{incident?.title}</h2>
                )}
                {/* Description */}
                {editMode ? (
                  <textarea
                    className="w-full border rounded-lg p-2 min-h-[80px] mb-4"
                    value={editFields.description}
                    onChange={e => handleFieldChange('description', e.target.value)}
                    disabled={saving || isClosed}
                  />
                ) : (
                  <p className="text-meta mb-4 whitespace-pre-line">{incident?.description}</p>
                )}
                {/* Main fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {/* Incident Type */}
                  <div>
                    <span className="font-semibold">Incident Type:</span>{' '}
                    {editMode ? (
                      <select
                        className="w-full px-3 py-1 rounded border mt-1"
                        value={editFields.incidentType}
                        onChange={e => handleFieldChange('incidentType', e.target.value)}
                        disabled={saving || isClosed}
                      >
                        {incidentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <span className="ml-1">{incident?.incidentType}</span>
                    )}
                  </div>
                  {/* Impacted Service */}
                  <div>
                    <span className="font-semibold">Impacted Service:</span>{' '}
                    {editMode ? (
                      <select
                        className="w-full px-3 py-1 rounded border mt-1"
                        value={editFields.impactedService}
                        onChange={e => handleFieldChange('impactedService', e.target.value)}
                        disabled={saving || isClosed}
                      >
                        {serviceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <span className="ml-1">{incident?.impactedService}</span>
                    )}
                  </div>
                  {/* Urgency */}
                  <div>
                    <span className="font-semibold">Urgency:</span>{' '}
                    {editMode ? (
                      <select
                        className="w-full px-3 py-1 rounded border mt-1"
                        value={editFields.urgency}
                        onChange={e => handleFieldChange('urgency', e.target.value)}
                        disabled={saving || isClosed}
                      >
                        {urgencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <span className="ml-1">{incident?.urgency}</span>
                    )}
                  </div>
                  {/* Priority */}
                  <div>
                    <span className="font-semibold">Priority:</span>{' '}
                    {editMode ? (
                      <select
                        className="w-full px-3 py-1 rounded border mt-1"
                        value={editFields.priority}
                        onChange={e => handleFieldChange('priority', e.target.value)}
                        disabled={saving || isClosed}
                      >
                        {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <span className="ml-1"><PriorityBadge priority={incident?.priority} /></span>
                    )}
                  </div>
                  {/* Incident Commander */}
                  <div>
                    <span className="font-semibold">Incident Commander:</span>{' '}
                    {editMode ? (
                      <Select
                        className="w-full mt-1"
                        value={users.find(u => u._id === editFields.assignedTo) ? { value: editFields.assignedTo, label: users.find(u => u._id === editFields.assignedTo)?.name ? `${users.find(u => u._id === editFields.assignedTo)?.name} (${users.find(u => u._id === editFields.assignedTo)?.email})` : users.find(u => u._id === editFields.assignedTo)?.email } : null}
                        onChange={opt => handleFieldChange('assignedTo', opt ? opt.value : '')}
                        options={users.map(u => ({ value: u._id, label: u.name ? `${u.name} (${u.email})` : u.email }))}
                        isClearable
                        isDisabled={saving || isClosed}
                      />
                    ) : (
                      <span className="ml-1">{users.find(u => u._id === (incident?.assignedTo?._id || incident?.assignedTo))?.name || users.find(u => u._id === (incident?.assignedTo?._id || incident?.assignedTo))?.email || 'Unassigned'}</span>
                    )}
                  </div>
                  {/* Team */}
                  <div>
                    <span className="font-semibold">Team:</span>{' '}
                    {editMode ? (
                      <Select
                        className="w-full mt-1"
                        value={teams.find(t => t._id === editFields.team) ? { value: editFields.team, label: teams.find(t => t._id === editFields.team)?.name } : null}
                        onChange={opt => handleFieldChange('team', opt ? opt.value : '')}
                        options={teams.map(t => ({ value: t._id, label: t.name }))}
                        isClearable
                        isDisabled={saving || isClosed}
                      />
                    ) : (
                      <span className="ml-1">{teams.find(t => t._id === (incident?.team?._id || incident?.team))?.name || 'N/A'}</span>
                    )}
                  </div>
                  {/* Meeting URL */}
                  <div className="md:col-span-2">
                    <span className="font-semibold">Meeting URL:</span>{' '}
                    {editMode ? (
                      <input
                        className="w-full border rounded-lg p-2 mt-1"
                        value={editFields.meetingUrl}
                        onChange={e => handleFieldChange('meetingUrl', e.target.value)}
                        disabled={saving || isClosed}
                        placeholder="https://example.com/meeting"
                      />
                    ) : (
                      incident?.meetingUrl ? (
                        <a href={incident.meetingUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 underline break-all">{incident.meetingUrl}</a>
                      ) : (
                        <span className="ml-1 text-gray-500">N/A</span>
                      )
                    )}
                  </div>
                </div> {/* <-- This closes the grid div */}
              </Card>
              <Card title="Additional Responders">
                {editMode ? (
                  <Select
                    isMulti
                    className="w-full"
                    value={users.filter(u => editFields.responders.includes(u._id)).map(u => ({ value: u._id, label: u.name ? `${u.name} (${u.email})` : u.email }))}
                    onChange={options =>
                      handleFieldChange(
                        'responders',
                        options ? options.map(opt => opt.value) : []
                      )
                    }
                    options={users.map(u => ({ value: u._id, label: u.name ? `${u.name} (${u.email})` : u.email }))}
                    isDisabled={saving || isClosed}
                    placeholder="Add additional responders..."
                  />
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {incident?.responders && incident.responders.length > 0
                      ? incident.responders.map((u, i) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <span className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-xs">
                              {u.name?.[0] || getInitials(u.email)}
                            </span>
                            <span className="text-xs">{u.name || u.email}</span>
                          </div>
                        ))
                      : <span className="text-gray-500">No additional responders</span>
                    }
                  </div>
                )}
              </Card>
              <Card title="Attachments" className="card">
                <div className="mb-4 flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={uploading || isClosed}
                  />
                  {selectedFile && (
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        type="text"
                        value={customFilename}
                        onChange={e => setCustomFilename(e.target.value)}
                        onKeyDown={handleFilenameKeyDown}
                        className="border rounded px-2 py-1"
                        disabled={isClosed}
                      />
                      <span>.{selectedFile.name.split('.').pop()}</span>
                      <button
                        onClick={handleAttachmentUpload}
                        className="btn-primary px-3 py-1 rounded font-semibold transition"
                        disabled={uploading || !customFilename || isClosed}
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => { setSelectedFile(null); setCustomFilename(""); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="ml-2 px-2 py-1 rounded bg-gray-200 text-xs text-gray-700 hover:bg-gray-300"
                        disabled={isClosed}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {uploading && <span className="text-xs text-blue-600">Uploading...</span>}
                  {uploadError && <span className="text-xs text-red-600">{uploadError}</span>}
                </div>
                {/* Attachments List */}
                {incident?.attachments && incident.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {incident.attachments.map((att, i) => {
                      const filename = att.filename || att.url.split("/").pop();
                      const ext = filename.split('.').pop();
                      return (
                        <li key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition group">
                          <div className="text-2xl flex-shrink-0">
                            {getFileIcon(filename)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline text-blue-700"
                                title="Open in new tab"
                              >
                                {filename.replace(new RegExp(`\\.${ext}$`), '')}
                                <span className="text-xs text-gray-400 font-normal">.{ext}</span>
                              </a>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Uploaded by {att.uploadedBy?.email || "Unknown"} · {att.uploadedAt ? new Date(att.uploadedAt).toLocaleString() : ""}
                            </div>
                          </div>
                          <a
                            href={att.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
                            title="Download"
                          >
                            <FaDownload />
                          </a>
                          {!isClosed && user?.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteAttachment(att.url.split("/").pop())}
                              disabled={deletingAttachment === att.url.split("/").pop()}
                              className="p-2 rounded-full hover:bg-[var(--if-warning-bg)] text-[var(--if-warning)] disabled:opacity-60"
                              title="Delete"
                            >
                              <FaTrashAlt />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-meta">No attachments yet.</p>
                )}
              </Card>
            </div>
            {/* Right column: Activity/Comments */}
            <div className="w-full md:w-2/5">
              <Card title="Activity & Comments" className="card">
                {/* Activity Feed */}
                <div className="mb-6 max-h-64 overflow-y-auto">
                  <h3 className="text-md font-semibold mb-2">Activity Feed</h3>
                  {activityLoading ? (
                    <p className="text-meta">Loading...</p>
                  ) : activityError ? (
                    <p className="text-red-500">{activityError}</p>
                  ) : activity.length > 0 ? (
                    <ul className="space-y-4">
                      {[...activity].reverse().map((a, i) => (
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
                              <span className="font-semibold text-sm text-gray-800">{a.performedBy?.email || 'System'}</span>
                              <span className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-700 mt-0.5">
                              {renderAuditLogDetails(a)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-meta">No activity yet.</p>
                  )}
                </div>
                {/* Comments Section */}
                <div>
                  <h3 className="text-md font-semibold mb-2">Comments</h3>
                  {/* Add Comment Box at the top */}
                  {!isClosed && (
                    <form onSubmit={handleCommentSubmit} className="flex gap-2 items-end mt-4">
                      <textarea
                        className="flex-1 border rounded-lg p-2 min-h-[40px] text-sm"
                        value={commentText}
                        onChange={handleCommentInput}
                        onKeyDown={handleCommentKeyDown}
                        placeholder="Add a comment..."
                        disabled={isClosed}
                      />
                      <button
                        type="submit"
                        className="btn-primary px-4 py-2 rounded font-semibold text-sm"
                        disabled={!commentText.trim() || isClosed}
                      >
                        Comment
                      </button>
                    </form>
                  )}
                  {isClosed && (
                    <div className="mt-4 text-sm text-gray-500 italic">Comments are disabled for closed incidents.</div>
                  )}
                  {/* Comments List below the add comment box */}
                  {incident?.comments?.length === 0 ? (
                    <p className="text-meta">No comments yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {[...incident.comments].reverse().map((c, i) => {
                        const canEditComment = String(user?.id) === String(c.user?._id);
                        const canDeleteComment = user?.role === "admin";
                        const mentionsInComment = (c.mentions || []).map(mid => usersForMentions.find(u => u._id === mid));
                        const usedEmojis = Array.from(new Set((c.reactions || []).map(r => r.emoji)));
                        return (
                          <li
                            key={i}
                            className="flex gap-3 items-start border p-3 rounded-xl bg-gray-50 group relative hover:shadow-md transition-shadow"
                            onMouseEnter={() => setHoveredCommentId(c._id)}
                            onMouseLeave={() => setHoveredCommentId(null)}
                          >
                            <div className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-sm font-bold border-2 border-white mt-1">
                              {getInitials(c.user?.email)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 truncate">
                                  {c.user?.name || c.user?.email || "Unknown User"}
                                  {c.user?.role && (
                                    <em className="text-xs text-gray-500 ml-1">({c.user.role})</em>
                                  )}
                                </span>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                              {editingCommentId === c._id ? (
                                <div className="flex flex-col gap-2 mt-1 border-2 border-blue-400 bg-blue-50 rounded-lg p-2">
                                  <textarea
                                    className="w-full border rounded-lg p-2 min-h-[60px] focus:ring-2 focus:ring-blue-400"
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
                                  <p className="text-gray-800 mt-1 break-words">
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
                                          className={`px-2 py-1 rounded-full text-lg font-semibold transition-all duration-150 border border-transparent hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${reacted ? "bg-blue-200" : "bg-gray-100"}`}
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
                </div>
              </Card>
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
          {/* Close Incident Modal */}
          <ConfirmModal
            open={showCloseModal}
            onClose={() => setShowCloseModal(false)}
            onConfirm={handleConfirmClose}
            title="Close Incident?"
            description="Are you sure you want to close this incident? This action cannot be undone."
          />
          {/* Reopen Incident Modal (Step 1: Edit Form) */}
          <ConfirmModal
            open={showReopenModal}
            onClose={() => setShowReopenModal(false)}
            onConfirm={handleContinueReopen}
            title="Reopen Incident"
            confirmText="Continue"
            description="Edit any fields below before reopening. All changes will be logged."
          >
            {reopenFields && (
              <div className="space-y-3 mt-4">
                <input
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.title}
                  onChange={e => handleReopenFieldChange('title', e.target.value)}
                  placeholder="Title"
                />
                <textarea
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.description}
                  onChange={e => handleReopenFieldChange('description', e.target.value)}
                  placeholder="Description"
                />
                <select
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.incidentType}
                  onChange={e => handleReopenFieldChange('incidentType', e.target.value)}
                >
                  {incidentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.impactedService}
                  onChange={e => handleReopenFieldChange('impactedService', e.target.value)}
                >
                  {serviceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.urgency}
                  onChange={e => handleReopenFieldChange('urgency', e.target.value)}
                >
                  {urgencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.priority}
                  onChange={e => handleReopenFieldChange('priority', e.target.value)}
                >
                  {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <Select
                  options={users.map(u => ({ value: u._id, label: u.name || u.email }))}
                  value={users.find(u => u._id === reopenFields.assignedTo) ? { value: reopenFields.assignedTo, label: users.find(u => u._id === reopenFields.assignedTo)?.name || users.find(u => u._id === reopenFields.assignedTo)?.email } : null}
                  onChange={option => handleReopenFieldChange('assignedTo', option ? option.value : '')}
                  isClearable
                  placeholder="Assign to..."
                />
                <Select
                  options={teams.map(t => ({ value: t._id, label: t.name }))}
                  value={teams.find(t => t._id === reopenFields.team) ? { value: reopenFields.team, label: teams.find(t => t._id === reopenFields.team)?.name } : null}
                  onChange={option => handleReopenFieldChange('team', option ? option.value : '')}
                  isClearable
                  placeholder="Team..."
                />
                <input
                  className="w-full border rounded px-2 py-1"
                  value={reopenFields.meetingUrl}
                  onChange={e => handleReopenFieldChange('meetingUrl', e.target.value)}
                  placeholder="Meeting URL"
                />
                <Select
                  options={users.map(u => ({ value: u._id, label: u.name || u.email }))}
                  value={reopenFields.responders?.map(rid => {
                    const u = users.find(u => u._id === rid);
                    return u ? { value: u._id, label: u.name || u.email } : null;
                  }).filter(Boolean) || []}
                  onChange={options => handleReopenFieldChange('responders', options ? options.map(o => o.value) : [])}
                  isMulti
                  isClearable
                  placeholder="Additional Responders..."
                />
              </div>
            )}
          </ConfirmModal>
          {/* Reopen Incident Confirmation Modal (Step 2) */}
          <ConfirmModal
            open={showReopenConfirm}
            onClose={() => setShowReopenConfirm(false)}
            onConfirm={handleConfirmReopen}
            title="Reopen Incident"
            confirmText="Confirm"
            description="Are you sure you want to reopen this incident? All changes will be logged."
          />
          {/* Global Footer */}
          <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
            <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
          </footer>
        </div>
      </div>
    </>
  );
};

export default IncidentDetails;
