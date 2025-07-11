import React, { useEffect, useState } from "react";
import axios from "axios";

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

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5002/api/users/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data);
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
      fetchTeams();
      // If editing the team currently shown in details modal, refresh audit logs
      if (detailsTeam && detailsTeam._id === editTeam._id) {
        refreshAuditLogs(editTeam._id);
      }
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
      setDetailsTeam(
        teams.find(t => t._id === detailsTeam._id)
      );
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
      setDetailsTeam(
        teams.find(t => t._id === detailsTeam._id)
      );
      // Refresh audit logs after removing member
      refreshAuditLogs(detailsTeam._id);
    } catch (err) {
      // Optionally show error
    } finally {
      setRemoveMemberLoading("");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Teams</h2>
        <button
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-base font-semibold"
          onClick={() => setShowAddModal(true)}
        >
          <span className="text-xl">+</span> Add Team
        </button>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : teams.length === 0 ? (
        <div className="py-8 text-center text-gray-400">No teams found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">Members</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-900 transition group">
                  <td className="px-4 py-3 font-medium flex items-center gap-3">
                    <span className="inline-block w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow">
                      {team.name?.[0]?.toUpperCase()}
                    </span>
                    <button className="text-blue-700 underline hover:text-blue-900 text-base font-semibold" onClick={() => handleShowDetails(team)}>{team.name}</button>
                  </td>
                  <td className="px-4 py-3 text-base">{team.members ? team.members.length : 0}</td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    <button
                      className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600"
                      onClick={() => handleEditTeam(team)}
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" /></svg>
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                      onClick={() => handleDeleteTeam(team)}
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New Team</h3>
            <form onSubmit={handleAddTeam} className="flex flex-col gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Team Name"
                value={newTeam.name}
                onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))}
                required
              />
              <textarea
                className="border rounded px-3 py-2"
                placeholder="Description (optional)"
                value={newTeam.description}
                onChange={e => setNewTeam(t => ({ ...t, description: e.target.value }))}
              />
              {addError && <div className="text-red-500 text-sm">{addError}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={addLoading}
                >
                  {addLoading ? "Adding..." : "Add Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {detailsTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl p-0 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {detailsTeam.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-xl font-bold">{detailsTeam.name}</div>
                  <div className="text-gray-500 text-sm">{detailsTeam.description || <span className="text-gray-400">No description</span>}</div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-700 text-3xl" onClick={() => setDetailsTeam(null)}>&times;</button>
            </div>
            {/* Content */}
            <div className="flex flex-col md:flex-row gap-0 md:gap-8 px-8 py-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
              {/* Left: Members & Add Member */}
              <div className="w-full md:w-1/2 pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-6 md:pb-0">
                <div className="mb-6">
                  <div className="font-semibold mb-2 text-lg flex items-center gap-2">
                    Members <span className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-0.5 rounded-full">{detailsTeam.members?.length || 0}</span>
                  </div>
                  {memberLoading ? (
                    <div className="text-gray-400">Loading users...</div>
                  ) : memberError ? (
                    <div className="text-red-500">{memberError}</div>
                  ) : (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {(detailsTeam.members || []).map(m => (
                        <div key={m._id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1">
                          <span className="inline-block w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-base" title={m.email}>
                            {m.name ? m.name[0].toUpperCase() : m.email[0].toUpperCase()}
                          </span>
                          <span className="text-sm font-medium" title={m.email}>{m.name || m.email}</span>
                          <button
                            className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                            onClick={() => handleRemoveMember(m._id)}
                            disabled={removeMemberLoading === m._id}
                          >
                            {removeMemberLoading === m._id ? "..." : <span>&times;</span>}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleAddMember} className="flex gap-2 items-center mt-2">
                    <select
                      className="border rounded px-2 py-1 w-full max-w-xs"
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
                      className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={addMemberLoading || !addMemberId}
                    >
                      {addMemberLoading ? "Adding..." : "Add"}
                    </button>
                    {addMemberError && <span className="text-red-500 text-xs ml-2">{addMemberError}</span>}
                  </form>
                </div>
              </div>
              {/* Right: Activity Log Timeline */}
              <div className="w-full md:w-1/2 pl-0 md:pl-4">
                <div className="font-semibold mb-3 text-lg">Activity Log</div>
                {auditLoading ? (
                  <div className="text-gray-400">Loading activity...</div>
                ) : auditError ? (
                  <div className="text-red-500">{auditError}</div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-gray-400">No activity yet.</div>
                ) : (
                  <ol className="relative border-l-2 border-blue-200 dark:border-blue-900 ml-2">
                    {auditLogs.map(log => {
                      let icon, color;
                      switch (log.action) {
                        case 'added_member':
                          icon = '➕'; color = 'bg-green-100 text-green-700'; break;
                        case 'removed_member':
                          icon = '➖'; color = 'bg-red-100 text-red-700'; break;
                        case 'created_team':
                          icon = '🆕'; color = 'bg-blue-100 text-blue-700'; break;
                        case 'updated_team':
                          icon = '✏️'; color = 'bg-yellow-100 text-yellow-700'; break;
                        case 'deleted_team':
                          icon = '🗑️'; color = 'bg-gray-200 text-gray-700'; break;
                        default:
                          icon = '🔔'; color = 'bg-gray-100 text-gray-700';
                      }
                      return (
                        <li key={log._id} className="mb-8 ml-4">
                          <div className="absolute -left-6 flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg z-10 text-xl font-bold bg-white dark:bg-gray-900">
                            <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center ${color}`}>{icon}</span>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3 ml-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-block w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                {log.performedBy?.name ? log.performedBy.name[0].toUpperCase() : (log.performedBy?.email ? log.performedBy.email[0].toUpperCase() : '?')}
                              </span>
                              <span className="font-semibold">{log.performedBy?.name || log.performedBy?.email || 'Unknown'}</span>
                              <span className="text-xs text-gray-400 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-sm mb-1">
                              <span className="font-semibold capitalize">{log.action.replace(/_/g, ' ')}</span>
                            </div>
                            {log.details && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {typeof log.details === 'object' ? (
                                  <ul className="list-disc ml-4">
                                    {Object.entries(log.details).map(([k, v]) => (
                                      <li key={k}><span className="font-medium">{k}:</span> {String(v)}</li>
                                    ))}
                                  </ul>
                                ) : log.details}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Team</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Team Name"
                value={editTeam.name}
                onChange={e => setEditTeam(t => ({ ...t, name: e.target.value }))}
                required
              />
              <textarea
                className="border rounded px-3 py-2"
                placeholder="Description (optional)"
                value={editTeam.description}
                onChange={e => setEditTeam(t => ({ ...t, description: e.target.value }))}
              />
              {editError && <div className="text-red-500 text-sm">{editError}</div>}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setEditTeam(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Team</h3>
            <p>Are you sure you want to delete the team <span className="font-semibold">{deleteTeam.name}</span>?</p>
            {deleteError && <div className="text-red-500 text-sm mt-2">{deleteError}</div>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setDeleteTeam(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 