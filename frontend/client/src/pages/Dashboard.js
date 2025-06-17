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

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 mb-6 flex justify-between items-center rounded">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">🚨 Incident Management</h2>
        </div>

      <div className="mb-4">
        <Link to="/create">
          <button className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600">+ Create New Incident</button>
        </Link>
      </div>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(groupedIncidents).map(([status, list]) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="w-full max-w-md bg-gray-50 dark:bg-gray-800 rounded shadow-md p-4"
                >
                  <h3 className="text-lg font-bold text-center capitalize mb-4 text-gray-800 dark:text-white">
                    {status.replace("_", " ")}
                  </h3>
                  {list.map((incident, index) => (
                    <Draggable key={incident._id} draggableId={incident._id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white dark:bg-gray-700 rounded shadow p-3 mb-3"
                        >
                          <div className="flex justify-between items-center">
                            <strong>{incident.title}</strong>
                            <span className={`text-white text-xs px-2 py-1 rounded ${getSeverityBadgeColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
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

                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const commentText = e.target.elements.comment.value;
                              try {
                                await incidentApi.post(`/incidents/${incident._id}/comments`, {
                                  message: commentText,
                                });
                                e.target.reset();
                                const res = await incidentApi.get("/incidents");
                                setIncidents(res.data);
                              } catch (err) {
                                alert("Failed to add comment");
                              }
                            }}
                          >
                            <input
                              type="text"
                              name="comment"
                              placeholder="Add a comment"
                              required
                              className="w-full border px-2 py-1 mt-1 mb-2 rounded dark:bg-gray-800 dark:text-white"
                            />
                            <button type="submit" className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600">
                              Post
                            </button>
                          </form>

                          <Link to={`/incidents/${incident._id}`} className="text-blue-600 dark:text-blue-300 text-sm hover:underline">
                            View Details
                          </Link>

                          <ul className="mt-2 text-xs">
                            {incident.comments?.map((c, idx) => (
                              <li key={idx}>
                                <strong>{c.user?.email || "User"}:</strong> {c.comment}
                              </li>
                            ))}
                          </ul>
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
  );
}

export default Dashboard;
