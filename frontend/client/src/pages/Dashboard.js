import React, { useEffect, useState, useRef } from "react";
import { incidentApi, userApi, onCallApi } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaUserCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaBell,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaEye,
  FaEdit,
  FaTrash,
  FaEllipsisH,
  FaCalendarAlt,
  FaTag,
  FaLayerGroup,
  FaTimes
} from 'react-icons/fa';
import { Pie, Line } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import ConfirmModal from "../components/ConfirmModal";
import PriorityBadge from "./PriorityBadge";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

function Dashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [onCallMap, setOnCallMap] = useState({});
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [bulkAssignUser, setBulkAssignUser] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('dashboardViewMode');
    return saved || 'kanban';
  }); // 'kanban' or 'list'
  const [overdueWindow, setOverdueWindow] = useState(24);
  const [overduePerSeverity, setOverduePerSeverity] = useState({ critical: 4, high: 24, moderate: 48, low: 72 });
  const selectAllRef = useRef();
  const navigate = useNavigate();
  const [closeConfirmId, setCloseConfirmId] = useState(null);
  const searchInputRef = useRef();

  // Fetch overdue window on mount
  useEffect(() => {
    const fetchOverdueWindow = async () => {
      try {
        const res = await incidentApi.get('/incidents/settings/overdue-window');
        setOverdueWindow(res.data.overdueWindowHours);
        setOverduePerSeverity({ ...{ critical: 4, high: 24, moderate: 48, low: 72 }, ...res.data.overdueWindowPerSeverity });
      } catch (err) {
        // fallback to default 24
        setOverdueWindow(24);
        setOverduePerSeverity({ critical: 4, high: 24, moderate: 48, low: 72 });
      }
    };
    fetchOverdueWindow();
  }, []);

  // Save view mode to localStorage whenever it changes
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('dashboardViewMode', newMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [incidentsRes, usersRes] = await Promise.all([
          incidentApi.get("/incidents"),
          userApi.get("/")
        ]);
        setIncidents(incidentsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError("Failed to fetch data. Are you logged in?");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTeamsAndOnCall = async () => {
      try {
        const res = await userApi.get("/teams");
        setTeams(res.data);
        const onCallObj = {};
        for (const team of res.data) {
          try {
            const ocRes = await onCallApi.get(`/current?team=${team._id}`);
            onCallObj[team._id] = ocRes.data;
          } catch {
            onCallObj[team._id] = null;
          }
        }
        setOnCallMap(onCallObj);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setTeams([]);
        setError("Failed to load teams. Please contact your admin if this persists.");
      }
    };
    fetchTeamsAndOnCall();
  }, []);

  // Real-time updates with Socket.IO
  useEffect(() => {
    const socket = io('ws://localhost:5001');
    socket.on('incidentUpdated', (updatedIncident) => {
      setIncidents((prev) =>
        prev.map((incident) =>
          incident._id === updatedIncident._id ? { ...incident, ...updatedIncident } : incident
        )
      );
      // Only show toast if update was made by another user
      if (updatedIncident.updatedBy !== user?.id) {
        toast.success(`Incident "${updatedIncident.title}" updated in real time!`);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const handleAssign = async (incidentId, userId) => {
    if (!userId) return; // Don't make API call if no user selected
    
    // Check if user has admin privileges
    if (user?.role !== 'admin') {
      toast.error("Only admins can assign incidents. Please contact an administrator.");
      return;
    }
    
    try {
      const response = await incidentApi.patch(`/incidents/${incidentId}/assign`, {
        assignedTo: userId,
      });
      
      // Update the incidents list with the response data
      const updatedIncidents = incidents.map(incident => 
        incident._id === incidentId 
          ? { ...incident, assignedTo: response.data.assignedTo }
          : incident
      );
      setIncidents(updatedIncidents);
      
      toast.success("Incident assigned successfully");
    } catch (err) {
      console.error("Failed to assign incident", err);
      console.error("Error details:", err.response?.data || err.message);
      
      if (err.response?.status === 403) {
        toast.error("Access denied. Admin privileges required to assign incidents.");
      } else if (err.response?.status === 404) {
        toast.error("User not found. Please select a valid user.");
      } else {
        toast.error("Failed to assign incident. Please try again.");
      }
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesTitle = incident.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? incident.status === statusFilter : true;
    const matchesAssignedUser = assignedUserFilter
      ? incident.assignedTo?._id === assignedUserFilter
      : true;
    const matchesTag = tagFilter ? (incident.tags || []).includes(tagFilter) : true;
    const matchesTeam = teamFilter ? incident.team === teamFilter : true;
    const matchesCategory = categoryFilter ? incident.category === categoryFilter : true;
    return matchesTitle && matchesStatus && matchesAssignedUser && matchesTag && matchesTeam && matchesCategory;
  });

  const statusLabels = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
  };

  const groupedIncidents = { open: [], in_progress: [], resolved: [] };
  filteredIncidents.forEach((i) => {
    if (i.status !== 'closed') {
      groupedIncidents[i.status]?.push(i);
    }
  });

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    
    // Check if user has admin privileges
    if (user?.role !== 'admin') {
      toast.error("Only admins can update incident status via drag and drop.");
      return;
    }
    
    // Optimistically update the UI
    const updatedIncidents = incidents.map((incident) =>
      incident._id === draggableId
        ? { ...incident, status: destination.droppableId }
        : incident
    );
    setIncidents(updatedIncidents);
    
    try {
      // Use PUT for status updates as per the API routes
      await incidentApi.put(`/incidents/${draggableId}`, {
        status: destination.droppableId,
      });
      toast.success("Status updated successfully");
    } catch (err) {
      console.error("Failed to update status", err);
      // Revert the optimistic update
      setIncidents(incidents);
      if (err.response?.status === 403) {
        toast.error("Access denied. Admin privileges required to update incident status.");
      } else {
        toast.error("Failed to update status. Please try again.");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Enhanced metrics calculations
  const totalIncidents = incidents.length;
  const openCount = incidents.filter(i => i.status === 'open').length;
  const inProgressCount = incidents.filter(i => i.status === 'in_progress').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const unassignedCount = incidents.filter(i => !i.assignedTo).length;
  const overdueCount = incidents.filter(i => {
    const createdAt = new Date(i.createdAt);
    const now = new Date();
    const sev = i.severity?.toLowerCase();
    const windowHours = overduePerSeverity[sev] || overdueWindow;
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return hoursDiff > windowHours && i.status !== 'resolved';
  }).length;

  // Chart data for incidents by status
  const statusChartData = {
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [
      {
        label: 'Incidents by Status',
        data: [openCount, inProgressCount, resolvedCount],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(245, 158, 11, 0.8)', // yellow
          'rgba(34, 197, 94, 0.8)',  // green
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Handle select/deselect all in a specific status column
  const handleSelectAll = (status) => (e) => {
    const columnIncidents = filteredIncidents.filter(i => i.status === status);
    if (e.target.checked) {
      setSelectedIncidents(prev => Array.from(new Set([...prev, ...columnIncidents.map(i => i._id)])));
    } else {
      setSelectedIncidents(prev => prev.filter(id => !columnIncidents.some(i => i._id === id)));
    }
  };

  const handleSelectIncident = (id) => {
    setSelectedIncidents((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Bulk assign
  const handleBulkAssign = async () => {
    if (!bulkAssignUser) return;
    
    // Check if user has admin privileges
    if (user?.role !== 'admin') {
      toast.error("Only admins can assign incidents. Please contact an administrator.");
      return;
    }
    
    setBulkLoading(true);
    try {
      await Promise.all(selectedIncidents.map(id => incidentApi.patch(`/incidents/${id}/assign`, { assignedTo: bulkAssignUser })));
      toast.success("Incidents assigned successfully");
      setSelectedIncidents([]);
      setBulkAssignUser("");
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to assign incidents", err);
      if (err.response?.status === 403) {
        toast.error("Access denied. Admin privileges required to assign incidents.");
      } else {
        toast.error("Failed to assign incidents. Please try again.");
      }
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk status change
  const handleBulkStatus = async () => {
    if (!bulkStatus) return;
    
    // Check if user has admin privileges
    if (user?.role !== 'admin') {
      toast.error("Only admins can update incident status. Please contact an administrator.");
      return;
    }
    
    setBulkLoading(true);
    try {
      await Promise.all(selectedIncidents.map(id => incidentApi.put(`/incidents/${id}`, { status: bulkStatus })));
      toast.success("Status updated successfully");
      setSelectedIncidents([]);
      setBulkStatus("");
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to update status", err);
      if (err.response?.status === 403) {
        toast.error("Access denied. Admin privileges required to update incident status.");
      } else {
        toast.error("Failed to update status. Please try again.");
      }
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    // Check if user has admin privileges
    if (user?.role !== 'admin') {
      toast.error("Only admins can delete incidents. Please contact an administrator.");
      return;
    }
    
    setBulkLoading(true);
    try {
      await Promise.all(selectedIncidents.map(id => incidentApi.delete(`/incidents/${id}`)));
      toast.success("Incidents deleted successfully");
      setSelectedIncidents([]);
      setShowDeleteConfirm(false);
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to delete incidents", err);
      if (err.response?.status === 403) {
        toast.error("Access denied. Admin privileges required to delete incidents.");
      } else {
        toast.error("Failed to delete incidents. Please try again.");
      }
    } finally {
      setBulkLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="text-white text-sm" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Incident Manager</h1>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <FaBell className="text-yellow-500" />
                  <span>{overdueCount} Overdue</span>
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleViewModeChange(viewMode === 'kanban' ? 'list' : 'kanban')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {viewMode === 'kanban' ? 'List View' : 'Kanban View'}
              </button>
              <button
                onClick={() => navigate('/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FaPlus className="mr-2" />
                New Incident
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalIncidents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <FaClock className="text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{resolvedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-9 transition-all duration-200 shadow-sm"
                  ref={searchInputRef}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                    onClick={() => {
                      setSearchTerm("");
                      searchInputRef.current && searchInputRef.current.focus();
                    }}
                    aria-label="Clear search"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-2 py-1.5 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm h-9 min-w-[120px]"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={assignedUserFilter}
              onChange={(e) => setAssignedUserFilter(e.target.value)}
              className="border px-2 py-1.5 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm h-9 min-w-[120px]"
            >
              <option value="">All Assignees</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name || user.email} {user.role === "admin" ? "👑" : ""}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="border px-2 py-1.5 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm h-9 min-w-[120px]"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>
          {user?.role !== 'admin' && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FaShieldAlt className="text-yellow-500" />
              <span>Admin privileges required for editing incidents. View-only mode for non-admin users.</span>
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        {selectedIncidents.length > 0 && user?.role === 'admin' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedIncidents.length} incident(s) selected
                </span>
                
                <select
                  value={bulkAssignUser}
                  onChange={e => setBulkAssignUser(e.target.value)}
                  className="px-3 py-1 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                  disabled={bulkLoading}
                >
                  <option value="">Assign to...</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name || u.email}</option>
                  ))}
                </select>
                
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignUser || bulkLoading}
                >
                  {bulkLoading ? <FaSpinner className="animate-spin" /> : 'Assign'}
                </button>

                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value)}
                  className="px-3 py-1 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                  disabled={bulkLoading}
                >
                  <option value="">Change status...</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                
                <button
                  className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  onClick={handleBulkStatus}
                  disabled={!bulkStatus || bulkLoading}
                >
                  {bulkLoading ? <FaSpinner className="animate-spin" /> : 'Update Status'}
                </button>

                <button
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={bulkLoading}
                >
                  Delete
                </button>
              </div>
              
              <button 
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setSelectedIncidents([])}
                disabled={bulkLoading}
              >
                Clear selection
              </button>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <FaTrash className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Incidents</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete {selectedIncidents.length} selected incident(s)?
              </p>
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={bulkLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Kanban Board */}
        {viewMode === 'kanban' && (
          <div className="space-y-6">
            <DragDropContext onDragEnd={user?.role === 'admin' ? onDragEnd : () => {}}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.entries(groupedIncidents).map(([status, list]) => (
                  <Droppable droppableId={status} key={status} isDropDisabled={user?.role !== 'admin'}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
                          snapshot.isDraggingOver ? "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            {user?.role === 'admin' && (
                              <input
                                type="checkbox"
                                checked={list.every(i => selectedIncidents.includes(i._id)) && list.length > 0}
                                onChange={handleSelectAll(status)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                              {statusLabels[status]}
                            </h3>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                              {list.length}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                                                      {list.map((incident, index) => (
                              <Draggable key={incident._id} draggableId={incident._id.toString()} index={index} isDragDisabled={user?.role !== 'admin'}>
                                {(provided, snapshot) => {
                                  const onCallUser = onCallMap[incident.team];
                                  const isOnCallAssigned = onCallUser && incident.assignedTo && incident.assignedTo._id === onCallUser._id;
                                  const isSelected = selectedIncidents.includes(incident._id);
                                  const sev = incident.severity?.toLowerCase();
                                  const windowHours = overduePerSeverity[sev] || overdueWindow;
                                  const isOverdue = new Date(incident.createdAt) < new Date(Date.now() - windowHours * 60 * 60 * 1000) && incident.status !== 'resolved';
                                  
                                  return (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 transition-all
                                        ${snapshot.isDragging ? "ring-2 ring-blue-400 shadow-lg scale-105" : "hover:shadow-md"}
                                        ${isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""}
                                        ${isOverdue ? "border-l-4 border-l-red-500" : ""}
                                        ${user?.role !== 'admin' ? "cursor-default" : "cursor-move"}`}
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          {user?.role === 'admin' && (
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleSelectIncident(incident._id)}
                                              className="accent-blue-600"
                                              title="Select incident"
                                            />
                                          )}
                                          <strong className="text-base font-semibold truncate max-w-[120px]" title={incident.title}>{incident.title}</strong>
                                          {isOverdue && (
                                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Overdue</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow border-2 border-white dark:border-gray-800" title={incident.assignedTo?.name || incident.assignedTo?.email || 'Unassigned'}>
                                          {incident.assignedTo?.name?.charAt(0).toUpperCase() || incident.assignedTo?.email?.charAt(0).toUpperCase() || <FaUserCircle />}
                                        </div>
                                        <p className="text-xs text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                                          Assigned to: <span title={incident.assignedTo?.email}>{incident.assignedTo?.name || incident.assignedTo?.email || "Unassigned"}</span>
                                          {incident.assignedTo?.role === "admin" && <span className="text-yellow-400 ml-1">👑 Admin</span>}
                                        </p>
                                        {isOnCallAssigned && (
                                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full ml-2" title="Assigned to current on-call user">On-Call</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                        <FaClock />
                                        <span title={incident.updatedAt ? new Date(incident.updatedAt).toLocaleString() : ''}>
                                          {incident.updatedAt ? new Date(incident.updatedAt).toLocaleDateString() : '—'}
                                        </span>
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>{statusLabels[incident.status]}</span>
                                      </div>
                                      {user?.role === 'admin' ? (
                                        <select
                                          value={incident.assignedTo?._id || ""}
                                          onChange={(e) => handleAssign(incident._id, e.target.value)}
                                          className="w-full mt-1 mb-2 border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                          title="Assign incident"
                                        >
                                          <option value="">Assign to...</option>
                                          {users.map((user) => (
                                            <option key={user._id} value={user._id}>
                                              {user.name || user.email} {user.role === "admin" ? "👑" : ""}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <div className="mt-1 mb-2 text-xs text-gray-600 dark:text-gray-400">
                                          <span className="font-medium">Assignment:</span> {incident.assignedTo?.name || incident.assignedTo?.email || "Unassigned"}
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {incident.tags && incident.tags.length > 0 && (
                                          incident.tags.map((tag, idx) => (
                                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full" title={tag}>{tag}</span>
                                          ))
                                        )}
                                        {incident.category && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full" title={incident.category}>Category: {incident.category}</span>
                                        )}
                                        {incident.team && (
                                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full" title={incident.team}>Team: {teams.find(t => t._id === incident.team)?.name || "N/A"}</span>
                                        )}
                                      </div>
                                      <Link
                                        to={`/incidents/${incident._id}`}
                                        className="block text-blue-600 dark:text-blue-400 text-xs font-semibold mt-2 hover:underline"
                                        title="View Incident Details"
                                      >
                                        View Details
                                      </Link>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {user?.role === 'admin' && (
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={filteredIncidents.every(i => selectedIncidents.includes(i._id)) && filteredIncidents.length > 0}
                          onChange={handleSelectAll(statusFilter)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Incident</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {filteredIncidents.map((incident) => {
                    const sev = incident.severity?.toLowerCase();
                    const windowHours = overduePerSeverity[sev] || overdueWindow;
                    const isOverdue = new Date(incident.createdAt) < new Date(Date.now() - windowHours * 60 * 60 * 1000) && incident.status !== 'resolved';
                    
                    return (
                      <tr key={incident._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        {user?.role === 'admin' && (
                          <td className="px-2 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedIncidents.includes(incident._id)}
                              onChange={() => handleSelectIncident(incident._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {incident.title}
                            </div>
                            {incident.tags && incident.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {incident.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(incident.status)}`}>{statusLabels[incident.status]}</span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                              {incident.assignedTo?.name?.charAt(0).toUpperCase() || incident.assignedTo?.email?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {incident.assignedTo?.name || incident.assignedTo?.email || "Unassigned"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          {new Date(incident.createdAt).toLocaleDateString()}
                          {isOverdue && (
                            <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/incidents/${incident._id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              <FaEye className="w-4 h-4" />
                            </Link>
                            {user?.role === 'admin' && (
                              <select
                                value={incident.assignedTo?._id || ""}
                                onChange={(e) => handleAssign(incident._id, e.target.value)}
                                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">Assign...</option>
                                {users.map((user) => (
                                  <option key={user._id} value={user._id}>
                                    {user.name || user.email}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {totalIncidents > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Incidents by Status</h3>
              <div className="h-64">
                <Pie 
                  data={statusChartData} 
                  options={{ 
                    plugins: { 
                      legend: { position: 'bottom' },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unassigned Incidents</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{unassignedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average Resolution Time</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">2.3 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">SLA Compliance</span>
                  <span className="text-lg font-semibold text-green-600">94%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation modal */}
        {closeConfirmId && (
          <ConfirmModal
            title="Mark Incident as Closed?"
            message="Are you sure you want to mark this incident as closed? This action cannot be undone."
            onConfirm={async () => {
              await incidentApi.put(`/incidents/${closeConfirmId}`, { status: 'closed' });
              setCloseConfirmId(null);
              // Refresh incidents
              const res = await incidentApi.get('/incidents');
              setIncidents(res.data);
            }}
            onCancel={() => setCloseConfirmId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
