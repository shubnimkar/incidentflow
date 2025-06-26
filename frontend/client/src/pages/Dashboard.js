import React, { useEffect, useState } from "react";
import { incidentApi, userApi } from "../services/api";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");

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
    return matchesTitle && matchesStatus && matchesSeverity && matchesAssignedUser;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      {/* Hero Heading */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Incident Dashboard</h2>
        </div>
        <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
      </div>

      {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-6">
        <input
          type="text"
          placeholder="Search by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
        <select
          value={assignedUserFilter}
          onChange={(e) => setAssignedUserFilter(e.target.value)}
          className="border px-2 py-1 rounded dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Assignees</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.email} {user.role === "admin" ? "👑" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board Card */}
      <div className="overflow-x-auto rounded-2xl shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 flex-col md:flex-row">
            {Object.entries(groupedIncidents).map(([status, list]) => (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-w-[280px] max-w-sm bg-gray-50 dark:bg-gray-900 rounded-xl shadow p-3 transition-all border border-gray-200 dark:border-gray-700 ${snapshot.isDraggingOver ? "ring-2 ring-blue-400" : ""}`}
                  >
                    <h3 className="text-lg font-bold capitalize mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === "open" ? "bg-blue-400" : status === "in_progress" ? "bg-yellow-400" : "bg-green-500"}`}></span>
                      {statusLabels[status]}
                    </h3>
                    {list.map((incident, index) => (
                      <Draggable key={incident._id} draggableId={incident._id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 border border-gray-100 dark:border-gray-700 transition-all ${snapshot.isDragging ? "ring-2 ring-blue-400 scale-105" : "hover:shadow-lg"}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <strong className="text-base font-semibold">{incident.title}</strong>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getSeverityBadgeColor(incident.severity)} text-white`}>{incident.severity}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow border-2 border-white dark:border-gray-800">
                                {incident.assignedTo?.email?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-200">
                                Assigned to: {incident.assignedTo?.email || "Unassigned"}
                                {incident.assignedTo?.role === "admin" && <span className="text-yellow-400 ml-1">👑 Admin</span>}
                              </p>
                            </div>
                            <select
                              value={incident.assignedTo?._id || ""}
                              onChange={(e) => handleAssign(incident._id, e.target.value)}
                              className="w-full mt-1 mb-2 border px-2 py-1 rounded dark:bg-gray-800 dark:text-white"
                            >
                              <option value="">Assign to...</option>
                              {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                  {user.email} {user.role === "admin" ? "👑" : ""}
                                </option>
                              ))}
                            </select>
                            <Link
                              to={`/incidents/${incident._id}`}
                              className="block text-blue-600 dark:text-blue-400 text-xs font-semibold mt-2 hover:underline"
                            >
                              View Details
                            </Link>
                          </div>
                        )}
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
