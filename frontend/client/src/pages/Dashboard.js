import React, { useEffect, useState, useRef } from "react";
import { incidentApi, userApi, onCallApi } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaPlus, FaSearch, FaFilter, FaUserCircle, FaClock } from 'react-icons/fa';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
Chart.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [onCallMap, setOnCallMap] = useState({});
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedIncidents, setSelectedIncidents] = useState([]);
  const [bulkAssignUser, setBulkAssignUser] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const selectAllRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentApi.get("/incidents");
        setIncidents(res.data);
      } catch (err) {
        setError("Failed to fetch incidents. Are you logged in?");
        console.error(err);
      }
    };
    fetchIncidents();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userApi.get("/");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    fetchUsers();
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
      } catch {}
    };
    fetchTeamsAndOnCall();
  }, []);

  const handleAssign = async (incidentId, userId) => {
    try {
      await incidentApi.patch(`/incidents/${incidentId}/assign`, {
        assignedTo: userId,
      });
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to assign incident", err);
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesTitle = incident.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? incident.status === statusFilter : true;
    const matchesSeverity = severityFilter
      ? incident.severity?.toLowerCase() === severityFilter
      : true;
    const matchesAssignedUser = assignedUserFilter
      ? incident.assignedTo?._id === assignedUserFilter
      : true;
    const matchesTag = tagFilter ? (incident.tags || []).includes(tagFilter) : true;
    const matchesTeam = teamFilter ? incident.team === teamFilter : true;
    const matchesCategory = categoryFilter ? incident.category === categoryFilter : true;
    return matchesTitle && matchesStatus && matchesSeverity && matchesAssignedUser && matchesTag && matchesTeam && matchesCategory;
  });

  const groupedIncidents = { open: [], in_progress: [], resolved: [] };
  filteredIncidents.forEach((i) => {
    groupedIncidents[i.status]?.push(i);
  });

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    const updatedIncidents = incidents.map((incident) =>
      incident._id === draggableId
        ? { ...incident, status: destination.droppableId }
        : incident
    );
    setIncidents(updatedIncidents);
    try {
      await incidentApi.patch(`/incidents/${draggableId}`, {
        status: destination.droppableId,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      setIncidents(incidents); // revert
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-500";
      case "moderate": return "bg-yellow-400";
      case "low": return "bg-green-600";
      default: return "bg-gray-400";
    }
  };

  const statusLabels = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved"
  };

  // Metrics calculations
  const totalIncidents = incidents.length;
  const openCount = incidents.filter(i => i.status === 'open').length;
  const inProgressCount = incidents.filter(i => i.status === 'in_progress').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const severityCounts = ['critical', 'high', 'moderate', 'low'].reduce((acc, sev) => {
    acc[sev] = incidents.filter(i => i.severity?.toLowerCase() === sev).length;
    return acc;
  }, {});

  // Chart data for incidents by status
  const statusChartData = {
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [
      {
        label: 'Incidents by Status',
        data: [openCount, inProgressCount, resolvedCount],
        backgroundColor: [
          'rgba(34,197,94,0.7)', // green
          'rgba(251,191,36,0.7)', // yellow
          'rgba(75,85,99,0.7)',   // gray
        ],
        borderColor: [
          'rgba(34,197,94,1)',
          'rgba(251,191,36,1)',
          'rgba(75,85,99,1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Handle select/deselect all in filteredIncidents
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIncidents(filteredIncidents.map(i => i._id));
    } else {
      setSelectedIncidents([]);
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
    setBulkLoading(true);
    try {
      await Promise.all(selectedIncidents.map(id => incidentApi.patch(`/incidents/${id}/assign`, { assignedTo: bulkAssignUser })));
      toast.success("Incidents assigned");
      setSelectedIncidents([]);
      setBulkAssignUser("");
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch {
      toast.error("Failed to assign incidents");
    } finally {
      setBulkLoading(false);
    }
  };
  // Bulk status change
  const handleBulkStatus = async () => {
    if (!bulkStatus) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedIncidents.map(id => incidentApi.patch(`/incidents/${id}`, { status: bulkStatus })));
      toast.success("Status updated");
      setSelectedIncidents([]);
      setBulkStatus("");
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setBulkLoading(false);
    }
  };
  // Bulk delete
  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(selectedIncidents.map(id => incidentApi.delete(`/incidents/${id}`)));
      toast.success("Incidents deleted");
      setSelectedIncidents([]);
      setShowDeleteConfirm(false);
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch {
      toast.error("Failed to delete incidents");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6 relative">
      {/* Floating New Incident Button */}
      <button
        onClick={() => navigate('/create')}
        className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2 text-lg font-bold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="Create New Incident"
      >
        <FaPlus /> <span className="hidden sm:inline">New Incident</span>
      </button>
      {/* Hero Heading */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Incident Dashboard</h2>
        </div>
        <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
        <p className="text-gray-500 dark:text-gray-400 mt-2 ml-12 text-sm">Track, assign, and resolve incidents efficiently.</p>
      </div>
      {/* Metrics Summary Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-start bg-white dark:bg-gray-800 rounded-xl shadow px-4 py-3 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-2xl font-bold text-blue-600">{totalIncidents}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-2xl font-bold text-green-600">{openCount}</span>
          <span className="text-xs text-gray-500">Open</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-2xl font-bold text-yellow-500">{inProgressCount}</span>
          <span className="text-xs text-gray-500">In Progress</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-2xl font-bold text-gray-600">{resolvedCount}</span>
          <span className="text-xs text-gray-500">Resolved</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-lg font-bold text-red-600">{severityCounts.critical}</span>
          <span className="text-xs text-gray-500">Critical</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-lg font-bold text-orange-500">{severityCounts.high}</span>
          <span className="text-xs text-gray-500">High</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-lg font-bold text-yellow-400">{severityCounts.moderate}</span>
          <span className="text-xs text-gray-500">Moderate</span>
        </div>
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-lg font-bold text-green-600">{severityCounts.low}</span>
          <span className="text-xs text-gray-500">Low</span>
        </div>
      </div>
      {/* Incidents by Status Chart */}
      {totalIncidents > 0 && (
        <div className="max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-8 bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-center text-md font-semibold mb-2">Incidents by Status</h4>
          <Pie data={statusChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
        </div>
      )}
      {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}
      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-6 items-center bg-white dark:bg-gray-800 rounded-xl shadow px-4 py-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-gray-400" />
          <select
            value={assignedUserFilter}
            onChange={(e) => setAssignedUserFilter(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Assignees</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name || user.email} {user.role === "admin" ? "👑" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <input
            type="text"
            placeholder="Filter by tag"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Teams</option>
            <option value="team1">Team 1</option>
            <option value="team2">Team 2</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <input
            type="text"
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      {/* Bulk Action Bar */}
      {selectedIncidents.length > 0 && (
        <div className="flex items-center gap-4 mb-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2 shadow">
          <span className="font-semibold text-blue-700 dark:text-blue-200">{selectedIncidents.length} selected</span>
          {/* Assign dropdown */}
          <select
            value={bulkAssignUser}
            onChange={e => setBulkAssignUser(e.target.value)}
            className="border px-2 py-1 rounded"
            disabled={bulkLoading}
          >
            <option value="">Assign to...</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name || u.email}</option>
            ))}
          </select>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition"
            onClick={handleBulkAssign}
            disabled={!bulkAssignUser || bulkLoading}
          >Assign</button>
          {/* Status dropdown */}
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="border px-2 py-1 rounded"
            disabled={bulkLoading}
          >
            <option value="">Change status...</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            className="bg-yellow-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-yellow-600 transition"
            onClick={handleBulkStatus}
            disabled={!bulkStatus || bulkLoading}
          >Change Status</button>
          {/* Delete */}
          <button
            className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 transition"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={bulkLoading}
          >Delete</button>
          <button className="ml-auto text-xs text-gray-500 hover:underline" onClick={() => setSelectedIncidents([])} disabled={bulkLoading}>Clear</button>
          {/* Confirm Delete Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                <h4 className="text-lg font-bold mb-2">Delete {selectedIncidents.length} incidents?</h4>
                <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button className="bg-gray-200 text-gray-700 px-4 py-1 rounded" onClick={() => setShowDeleteConfirm(false)} disabled={bulkLoading}>Cancel</button>
                  <button className="bg-red-600 text-white px-4 py-1 rounded" onClick={handleBulkDelete} disabled={bulkLoading}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Kanban Board Card */}
      <div className="overflow-x-auto rounded-2xl shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 animate-fade-in">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 flex-col md:flex-row">
            {Object.entries(groupedIncidents).map(([status, list]) => (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-w-[280px] max-w-sm bg-gray-50 dark:bg-gray-900 rounded-xl shadow p-3 transition-all border border-gray-200 dark:border-gray-700 ${snapshot.isDraggingOver ? "ring-2 ring-blue-400 scale-105" : "hover:shadow-xl"}`}
                  >
                    <h3 className="text-lg font-bold capitalize mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                      <input
                        type="checkbox"
                        ref={selectAllRef}
                        checked={list.every(i => selectedIncidents.includes(i._id)) && list.length > 0}
                        onChange={handleSelectAll}
                        className="mr-2 accent-blue-600"
                        title="Select all in this column"
                      />
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === "open" ? "bg-blue-400" : status === "in_progress" ? "bg-yellow-400" : "bg-green-500"}`}></span>
                      {statusLabels[status]}
                    </h3>
                    {list.map((incident, index) => (
                      <Draggable key={incident._id} draggableId={incident._id.toString()} index={index}>
                        {(provided, snapshot) => {
                          const onCallUser = onCallMap[incident.team];
                          const isOnCallAssigned = onCallUser && incident.assignedTo && incident.assignedTo._id === onCallUser._id;
                          const isSelected = selectedIncidents.includes(incident._id);
                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 border border-gray-100 dark:border-gray-700 transition-all ${snapshot.isDragging ? "ring-2 ring-blue-400 scale-105" : "hover:shadow-lg"} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectIncident(incident._id)}
                                    className="accent-blue-600"
                                    title="Select incident"
                                  />
                                  <strong className="text-base font-semibold truncate max-w-[120px]" title={incident.title}>{incident.title}</strong>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityBadgeColor(incident.severity)} text-white flex items-center gap-1`} title={incident.severity}>
                                  {incident.severity === 'critical' && '🔴'}
                                  {incident.severity === 'high' && '🟠'}
                                  {incident.severity === 'moderate' && '🟡'}
                                  {incident.severity === 'low' && '🟢'}
                                  {incident.severity}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow border-2 border-white dark:border-gray-800" title={incident.assignedTo?.name || incident.assignedTo?.email || 'Unassigned'}>
                                  {incident.assignedTo?.name?.charAt(0).toUpperCase() || incident.assignedTo?.email?.charAt(0).toUpperCase() || <FaUserCircle />}
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                                  Assigned to: {incident.assignedTo?.name || incident.assignedTo?.email || "Unassigned"}
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
                              </div>
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
                              <div className="flex flex-wrap gap-1 mt-1">
                                {incident.tags && incident.tags.length > 0 && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Tags: {incident.tags.join(', ')}</span>
                                )}
                                {incident.category && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Category: {incident.category}</span>
                                )}
                                {incident.team && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Team: {incident.team}</span>
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
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

export default Dashboard;
