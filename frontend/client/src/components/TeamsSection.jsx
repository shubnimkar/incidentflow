import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useRef } from "react";

export default function TeamsSection() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [editTeam, setEditTeam] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteTeam, setDeleteTeam] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [detailsTeam, setDetailsTeam] = useState(null); // team object for details modal
  const [users, setUsers] = useState([]); // all users for add-member
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [addMemberId, setAddMemberId] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [removeMemberLoading, setRemoveMemberLoading] = useState(""); // userId being removed
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const socketRef = useRef(null);
  // Add a state to control showing the add member form
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  // Helper to update detailsTeam after teams are fetched
  const updateDetailsTeam = (teamsArr, currentDetailsTeam) => {
    if (currentDetailsTeam) {
      const updated = teamsArr.find(t => t._id === currentDetailsTeam._id);
      if (updated) setDetailsTeam({ ...updated });
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5002/api/users/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data);
      updateDetailsTeam(res.data, detailsTeam);
    } catch (err) {
      setError("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setMemberLoading(true);
    setMemberError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5002/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      setMemberError("Failed to load users");
    } finally {
      setMemberLoading(false);
    }
  };

  // Helper to refresh audit logs for the currently open team details modal
  const refreshAuditLogs = async (teamId) => {
    setAuditLoading(true);
    setAuditError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5002/api/users/teams/${teamId}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditLogs(res.data);
    } catch (err) {
      setAuditError("Failed to load activity log");
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Automatically select the first team when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && !detailsTeam) {
      setDetailsTeam(teams[0]);
    }
  }, [teams]);

  // Real-time updates for teams and team audit logs
  useEffect(() => {
    socketRef.current = io("http://localhost:5001");
    socketRef.current.on("teamUpdated", () => {
      fetchTeams();
    });
    socketRef.current.on("teamAuditLogCreated", (log) => {
      if (detailsTeam && (log.team === detailsTeam._id || (log.team?._id && log.team._id === detailsTeam._id))) {
        refreshAuditLogs(detailsTeam._id);
      }
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [detailsTeam]);

  const handleAddTeam = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5002/api/users/teams",
        newTeam,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setNewTeam({ name: "", description: "" });
      fetchTeams();
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add team");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditTeam = (team) => {
    setEditTeam({ ...team });
    setEditError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5002/api/users/teams/${editTeam._id}`,
        { name: editTeam.name, description: editTeam.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditTeam(null);
      await fetchTeams();
      // If editing the team currently shown in details modal, update detailsTeam with the latest data
      if (detailsTeam && detailsTeam._id === editTeam._id) {
        const updated = teams.find(t => t._id === editTeam._id);
        if (updated) setDetailsTeam({ ...updated });
      }
      // Optionally, close add member form if open
      setShowAddMemberForm(false);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update team");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeam = (team) => {
    setDeleteTeam(team);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5002/api/users/teams/${deleteTeam._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeleteTeam(null);
      fetchTeams();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete team");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShowDetails = async (team) => {
    setDetailsTeam(team);
    fetchUsers();
    refreshAuditLogs(team._id);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberId) return;
    setAddMemberLoading(true);
    setAddMemberError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5002/api/users/teams/${detailsTeam._id}/add-member`,
        { userId: addMemberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddMemberId("");
      fetchTeams();
      // setDetailsTeam(
      //   teams.find(t => t._id === detailsTeam._id)
      // ); // This line is removed as per the edit hint
      // Refresh audit logs after adding member
      refreshAuditLogs(detailsTeam._id);
    } catch (err) {
      setAddMemberError(err.response?.data?.message || "Failed to add member");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setRemoveMemberLoading(userId);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5002/api/users/teams/${detailsTeam._id}/remove-member`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTeams();
      // setDetailsTeam(
      //   teams.find(t => t._id === detailsTeam._id)
      // ); // This line is removed as per the edit hint
      // Refresh audit logs after removing member
      refreshAuditLogs(detailsTeam._id);
    } catch (err) {
      // Optionally show error
    } finally {
      setRemoveMemberLoading("");
    }
  };

  function stringToColor(str) {
    // Simple hash to color mapping for consistent avatar backgrounds
    const colors = [
      'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-yellow-400', 'bg-red-400', 'bg-indigo-400', 'bg-teal-400', 'bg-orange-400', 'bg-cyan-400'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <>
      <div className="flex gap-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 font-sans">
        {/* Sidebar: Team List */}
        <div className="w-64 flex-shrink-0">
          <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white tracking-tight font-sans">Teams</h2>
          <div className="flex flex-col gap-2 mb-4">
            {teams.map(team => (
              <button
                key={team._id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-semibold font-sans transition border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 ${detailsTeam && detailsTeam._id === team._id ? 'bg-gray-100 dark:bg-gray-700 border-blue-400 dark:border-blue-500' : ''}`}
                onClick={() => handleShowDetails(team)}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 6.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM4.75 6.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM12 17.25c2.485 0 4.5-1.12 4.5-2.5v-1.25a2.25 2.25 0 00-2.25-2.25h-4.5A2.25 2.25 0 006 13.5v1.25c0 1.38 2.015 2.5 4.5 2.5z" />
                  </svg>
                </span>
                <span>{team.name}</span>
              </button>
            ))}
          </div>
          <button
            className="w-full mt-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-lg font-sans hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => setShowAddModal(true)}
          >
            New Team
          </button>
        </div>
        {/* Main Panel: Team Details */}
        <div className="flex-1">
          {detailsTeam ? (
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-sans">{detailsTeam.name}</h2>
                <button className="text-blue-600 hover:underline text-base font-semibold font-sans" onClick={() => handleEditTeam(detailsTeam)}>Edit</button>
              </div>
              <div className="text-gray-500 dark:text-gray-400 mb-6 font-sans">{detailsTeam.description || 'No description'}</div>
              <h3 className="text-xl font-bold mb-2 font-sans">Team Members</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-base rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-sans">
                  <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold font-sans">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Contact</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsTeam.members && detailsTeam.members.length > 0 ? detailsTeam.members.map(member => (
                      <tr key={member._id || member.email} className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition group">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-4">
                            {/* Avatar/Initial */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${stringToColor(member.name || member.email)}`}> {/* Color helper below */}
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.name || member.email} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                (member.name || member.email)?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-lg text-gray-900 dark:text-white">{member.name || member.email}</div>
                              <div className="text-gray-500 text-sm">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${member.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{member.role?.toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 dark:text-gray-300">{member.email}</td>
                        <td className="px-6 py-3">
                          <button
                            className="text-red-600 hover:underline font-semibold font-sans"
                            onClick={() => handleRemoveMember(member._id || member.email)}
                            disabled={removeMemberLoading === (member._id || member.email)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="text-center text-gray-400 py-6 font-sans">No members</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Add Member Button and Form */}
              {showAddMemberForm ? (
                <form onSubmit={handleAddMember} className="flex gap-2 items-center mt-6 font-sans">
                  <select
                    className="border rounded px-2 py-2 w-full max-w-xs font-sans"
                    value={addMemberId}
                    onChange={e => setAddMemberId(e.target.value)}
                    disabled={addMemberLoading || memberLoading}
                  >
                    <option value="">Add member...</option>
                    {users.filter(u => !detailsTeam.members.some(m => m._id === u._id)).map(u => (
                      <option key={u._id} value={u._id}>{u.name || u.email} ({u.email})</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold font-sans"
                    disabled={addMemberLoading || !addMemberId}
                  >
                    {addMemberLoading ? "Adding..." : "Add"}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold font-sans"
                    onClick={() => setShowAddMemberForm(false)}
                  >
                    Cancel
                  </button>
                  {addMemberError && <span className="text-red-500 text-xs ml-2 font-sans">{addMemberError}</span>}
                </form>
              ) : (
                <button
                  className="mt-6 px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-lg font-sans hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  onClick={() => { setShowAddMemberForm(true); fetchUsers(); }}
                >
                  Add Member
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-xl font-sans">Select a team to view details</div>
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 font-sans">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Team</h3>
            <form onSubmit={handleAddTeam} className="flex flex-col gap-3">
              <input
                className="border rounded px-3 py-2 font-sans"
                placeholder="Team Name"
                value={newTeam.name}
                onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))}
                required
              />
              <textarea
                className="border rounded px-3 py-2 font-sans"
                placeholder="Description (optional)"
                value={newTeam.description}
                onChange={e => setNewTeam(t => ({ ...t, description: e.target.value }))}
              />
              {addError && <div className="text-red-500 text-sm font-sans">{addError}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold font-sans"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold font-sans"
                  disabled={addLoading}
                >
                  {addLoading ? "Adding..." : "Add Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 font-sans">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Team</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <input
                className="border rounded px-3 py-2 font-sans"
                placeholder="Team Name"
                value={editTeam.name}
                onChange={e => setEditTeam(t => ({ ...t, name: e.target.value }))}
                required
              />
              <textarea
                className="border rounded px-3 py-2 font-sans"
                placeholder="Description (optional)"
                value={editTeam.description}
                onChange={e => setEditTeam(t => ({ ...t, description: e.target.value }))}
              />
              {editError && <div className="text-red-500 text-sm font-sans">{editError}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold font-sans"
                  onClick={() => setEditTeam(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold font-sans"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {deleteTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 font-sans">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Team</h3>
            <p>Are you sure you want to delete the team <span className="font-semibold">{deleteTeam.name}</span>?</p>
            {deleteError && <div className="text-red-500 text-sm mt-2 font-sans">{deleteError}</div>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold font-sans"
                onClick={() => setDeleteTeam(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold font-sans"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 