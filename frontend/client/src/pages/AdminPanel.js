import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { X, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { userApi, onCallApi } from "../services/api";
import { incidentApi } from "../services/api";

// Utility Functions
const getInitials = (nameOrEmail) => {
  const name = nameOrEmail.split("@")[0];
  return name
    .split(".")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

const getAvatarColor = (seed) => {
  const colors = [
    "bg-pink-500", "bg-yellow-500", "bg-blue-500",
    "bg-green-500", "bg-indigo-500", "bg-red-500", "bg-purple-500",
  ];
  const index = seed.charCodeAt(0) % colors.length;
  return colors[index];
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(""); // "delete" or "role"
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamError, setTeamError] = useState("");
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [editTeam, setEditTeam] = useState(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamLoading, setEditTeamLoading] = useState(false);
  const [editTeamError, setEditTeamError] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [addMembers, setAddMembers] = useState([]);
  const [removeMemberId, setRemoveMemberId] = useState(null);
  const [overdueWindow, setOverdueWindow] = useState(24);
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueEdit, setOverdueEdit] = useState(false);
  const [overdueInput, setOverdueInput] = useState(24);
  const [overduePerSeverity, setOverduePerSeverity] = useState({ critical: 4, high: 24, moderate: 48, low: 72 });
  const [overduePerSeverityInput, setOverduePerSeverityInput] = useState({ critical: 4, high: 24, moderate: 48, low: 72 });

  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = decodedToken?.role;
  const currentUserEmail = decodedToken?.email;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5002/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTeams = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await userApi.get("/teams");
      setTeams(res.data);
    } catch (err) {
      // ignore
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const fetchOverdueWindow = useCallback(async () => {
    setOverdueLoading(true);
    try {
      const res = await incidentApi.get('/incidents/settings/overdue-window');
      setOverdueWindow(res.data.overdueWindowHours);
      setOverdueInput(res.data.overdueWindowHours);
      setOverduePerSeverity({ ...{ critical: 4, high: 24, moderate: 48, low: 72 }, ...res.data.overdueWindowPerSeverity });
      setOverduePerSeverityInput({ ...{ critical: 4, high: 24, moderate: 48, low: 72 }, ...res.data.overdueWindowPerSeverity });
    } catch (err) {
      toast.error('Failed to load overdue window setting');
    } finally {
      setOverdueLoading(false);
    }
  }, []);

  const changeRole = async () => {
    if (!selectedUser) return;
    const newRole = selectedUser.role === "admin" ? "responder" : "admin";

    try {
      await axios.patch(
        `http://localhost:5002/api/users/${selectedUser._id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Role changed to ${newRole}`);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Failed to change role");
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    if (selectedUser.role === "admin") {
      toast.error("Cannot delete an admin user");
      setSelectedUser(null);
      return;
    }

    try {
      await axios.delete(`http://localhost:5002/api/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully");
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleOverdueUpdate = async () => {
    if (overdueInput < 1 || overdueInput > 168) {
      toast.error('Value must be between 1 and 168');
      return;
    }
    for (const key of Object.keys(overduePerSeverityInput)) {
      const val = overduePerSeverityInput[key];
      if (val < 1 || val > 168) {
        toast.error(`Value for ${key} must be between 1 and 168`);
        return;
      }
    }
    setOverdueLoading(true);
    try {
      const res = await incidentApi.patch('/incidents/settings/overdue-window', {
        overdueWindowHours: overdueInput,
        overdueWindowPerSeverity: overduePerSeverityInput
      });
      setOverdueWindow(res.data.overdueWindowHours);
      setOverduePerSeverity({ ...{ critical: 4, high: 24, moderate: 48, low: 72 }, ...res.data.overdueWindowPerSeverity });
      setOverdueEdit(false);
      toast.success('Overdue window updated');
    } catch (err) {
      toast.error('Failed to update overdue window');
    } finally {
      setOverdueLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    fetchOverdueWindow();
  }, [fetchUsers, fetchTeams, fetchOverdueWindow]);

  if (userRole !== "admin") {
    return (
      <div className="p-8 text-red-600 dark:text-red-400 text-center text-lg">
        ❌ Access Denied: Admins only
      </div>
    );
  }

  // Filter users by search
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Add this after fetching teams:
  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      {/* Hero Heading */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
        </div>
        <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-4 max-w-md">
        <div className="relative w-full">
          <span className="absolute left-3 top-2.5 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Overdue Window Setting */}
      <div className="mb-8 max-w-md bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800 dark:text-white">Overdue Window (hours)</span>
          {!overdueEdit ? (
            <span className="text-lg font-bold text-blue-600 dark:text-blue-300">{overdueLoading ? '...' : overdueWindow}</span>
          ) : (
            <input
              type="number"
              min={1}
              max={168}
              value={overdueInput}
              onChange={e => setOverdueInput(Number(e.target.value))}
              className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={overdueLoading}
            />
          )}
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {['critical', 'high', 'moderate', 'low'].map(sev => (
            <div key={sev} className="flex items-center justify-between">
              <span className="capitalize text-gray-700 dark:text-gray-300">{sev}</span>
              {!overdueEdit ? (
                <span className="text-base font-semibold text-blue-500 dark:text-blue-300">{overdueLoading ? '...' : overduePerSeverity[sev]}</span>
              ) : (
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={overduePerSeverityInput[sev]}
                  onChange={e => setOverduePerSeverityInput(prev => ({ ...prev, [sev]: Number(e.target.value) }))}
                  className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={overdueLoading}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          {!overdueEdit ? (
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              onClick={() => setOverdueEdit(true)}
              disabled={overdueLoading}
            >Edit</button>
          ) : (
            <>
              <button
                className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                onClick={handleOverdueUpdate}
                disabled={overdueLoading}
              >Save</button>
              <button
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm font-medium hover:bg-gray-400"
                onClick={() => { setOverdueEdit(false); setOverdueInput(overdueWindow); setOverduePerSeverityInput(overduePerSeverity); }}
                disabled={overdueLoading}
              >Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* User Table Card */}
      <div className="overflow-x-auto rounded-2xl shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full table-auto rounded-2xl overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">User</th>
              <th className="px-6 py-4 text-left">Role</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const isCurrentUser = u.email === currentUserEmail;
                const avatarColor = getAvatarColor(u.email);
                const initials = getInitials(u.name || u.email);
                return (
                  <tr
                    key={u._id}
                    className={`border-t border-gray-200 dark:border-gray-700 transition-all ${
                      idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
                    } hover:bg-blue-50 dark:hover:bg-gray-700`}
                  >
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-full ${avatarColor} text-white font-bold shadow border-2 border-white dark:border-gray-800`}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.name || u.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        {isCurrentUser && (
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                        u.role === "admin"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-blue-100 text-blue-700 border border-blue-300"
                      }`}>
                        {u.role}
                        {u.role === "admin" && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-green-600 text-white rounded-full">
                            ADMIN
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => {
                          if (!isCurrentUser) {
                            setSelectedUser(u);
                            setModalType("role");
                          }
                        }}
                        disabled={isCurrentUser}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shadow-sm border ${
                          isCurrentUser
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                            : u.role === "admin"
                            ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                        }`}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      {!isCurrentUser && (
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setModalType("delete");
                          }}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 shadow-sm"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Modal */}
      <Dialog.Root open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-xs sm:max-w-sm z-50 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className={`w-14 h-14 flex items-center justify-center rounded-full ${getAvatarColor(selectedUser?.email || "A")} text-white font-bold shadow border-2 border-white dark:border-gray-800 mb-4`}>
              {getInitials(selectedUser?.name || selectedUser?.email || "A")}
            </div>
            <h3 className="text-lg font-bold mb-1 text-center">{selectedUser?.name || selectedUser?.email}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">{selectedUser?.email}</p>
            {modalType === "role" ? (
              <>
                <p className="mb-4 text-center">
                  Are you sure you want to <span className="font-semibold">{selectedUser?.role === "admin" ? "demote" : "promote"}</span> this user?
                </p>
                <button
                  onClick={changeRole}
                  className="w-full px-4 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition mb-2"
                >
                  Yes, {selectedUser?.role === "admin" ? "Demote" : "Promote"}
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-center text-red-600 dark:text-red-400">
                  Are you sure you want to <span className="font-semibold">delete</span> this user?
                </p>
                <button
                  onClick={deleteUser}
                  className="w-full px-4 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition mb-2"
                >
                  Yes, Delete
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedUser(null)}
              className="w-full px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default AdminPanel;
