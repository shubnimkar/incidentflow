import React, { useEffect, useState } from "react";
import { incidentApi, userApi } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Token and role extraction
const token = localStorage.getItem("token");
const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
const isAdmin = decodedToken?.role === "admin";



function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");


  // Fetch incidents
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

  // Fetch users
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

  // Assign incident to a user
  const handleAssign = async (incidentId, userId) => {
    try {
      await incidentApi.patch(`/incidents/${incidentId}/assign`, {
        assignedTo: userId,
      });
      alert("Incident assigned successfully!");
      const res = await incidentApi.get("/incidents");
      setIncidents(res.data);
    } catch (err) {
      console.error("Failed to assign incident", err);
      alert("Failed to assign incident");
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Group incidents by status
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

const groupedIncidents = {
  open: [],
  in_progress: [],
  resolved: [],
};

filteredIncidents.forEach((i) => {
  groupedIncidents[i.status]?.push(i);
});


  // Handle drag and drop
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
      alert("Error updating status. Reverting change.");
      setIncidents(incidents); // revert
    }
  };

  // Get severity badge color
  const getSeverityBadgeColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical": return "#d32f2f";
      case "high": return "#f57c00";
      case "moderate": return "#fbc02d";
      case "low": return "#388e3c";
      default: return "#9e9e9e";
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Incident Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Link to="/create">
          <button>+ Create New Incident</button>
        </Link>
      </div>

      {isAdmin && (
        <div style={{ marginBottom: "1rem" }}>
          <Link to="/admin">
            <button style={{ backgroundColor: "#e0e0e0", color: "black" }}>
              🔧 Admin Panel
            </button>
          </Link>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}


      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
  <input
    type="text"
    placeholder="Search by title"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
    <option value="">All Statuses</option>
    <option value="open">Open</option>
    <option value="in_progress">In Progress</option>
    <option value="resolved">Resolved</option>
  </select>
  <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
    <option value="">All Severities</option>
    <option value="critical">Critical</option>
    <option value="high">High</option>
    <option value="moderate">Moderate</option>
    <option value="low">Low</option>
  </select>
  <select
    value={assignedUserFilter}
    onChange={(e) => setAssignedUserFilter(e.target.value)}
  >
    <option value="">All Assignees</option>
    {users.map((user) => (
      <option key={user._id} value={user._id}>
        {user.email}
      </option>
    ))}
  </select>
</div>


      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          {Object.entries(groupedIncidents).map(([status, list]) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    flex: 1,
                    border: "1px solid #ccc",
                    padding: "1rem",
                    borderRadius: "5px",
                    background: "#f9f9f9",
                    minHeight: "500px",
                    overflowY: "auto",
                  }}
                >
                  <h3 style={{ textTransform: "capitalize", textAlign: "center" }}>
                    {status.replace("_", " ")}
                  </h3>

                  {list.map((incident, index) => (
                    <Draggable
                      key={incident._id}
                      draggableId={incident._id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            background: "white",
                            padding: "1rem",
                            marginBottom: "1rem",
                            borderRadius: "5px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <strong>{incident.title}</strong>
                            <span
                              style={{
                                backgroundColor: getSeverityBadgeColor(incident.severity),
                                color: "white",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                              }}
                            >
                              {incident.severity}
                            </span>
                          </div>

                          <small>Created by: {incident.createdBy?.email || "N/A"}</small>
                          <br />
                          <small>Assigned to: {incident.assignedTo?.email || "Unassigned"}</small>
                          <br />

                          <select
                            value={incident.assignedTo?._id || ""}
                            onChange={(e) => handleAssign(incident._id, e.target.value)}
                          >
                            <option value="">Assign to...</option>
                            {users.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.email}
                              </option>
                            ))}
                          </select>

                          <div style={{ marginTop: "1rem" }}>
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
                              />
                              <button type="submit">Post</button>
                            </form>

                            <Link to={`/incidents/${incident._id}`}>
                              View Details
                            </Link>

                            <ul>
                              {incident.comments?.map((c, idx) => (
                                <li key={idx}>
                                  <strong>{c.user?.email || "User"}:</strong> {c.comment}
                                </li>
                              ))}
                            </ul>
                          </div>
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
