import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";

// Utility to generate initials
const getInitials = (nameOrEmail) => {
  const name = nameOrEmail.split("@")[0];
  return name
    .split(".")
    .map((n) => n.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

// Random pastel color generator for avatar
const getAvatarColor = (seed) => {
  const colors = [
    "bg-pink-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-purple-500",
  ];
  const index = seed.charCodeAt(0) % colors.length;
  return colors[index];
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const token = localStorage.getItem("token");

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
    } finally {
      setLoading(false);
    }
  }, [token]);

  const changeRole = async (userId, newRole) => {
    const confirm = window.confirm(`Are you sure you want to set role to "${newRole}"?`);
    if (!confirm) return;

    try {
      await axios.patch(
        `http://localhost:5002/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
      setMessage("Failed to update role");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (userRole !== "admin") {
    return (
      <div className="p-8 text-red-600 dark:text-red-400 text-center text-lg">
        ❌ Access Denied: Admins only
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h2 className="text-3xl font-semibold mb-6">Admin Panel</h2>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-white rounded text-sm shadow-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded shadow border dark:border-gray-700">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-200 dark:bg-gray-700 text-left text-sm uppercase font-medium text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrentUser = u.email === currentUserEmail;
                const avatarColor = getAvatarColor(u.email);
                const initials = getInitials(u.name || u.email);
                return (
                  <tr
                    key={u._id}
                    className="border-t border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${avatarColor}`}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium">{u.name || u.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        {isCurrentUser && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                            (You)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Role + Badge */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2">
                        {u.role}
                        {u.role === "admin" && (
                          <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded">
                            ADMIN
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      {u.role === "admin" ? (
                        <button
                          onClick={() => changeRole(u._id, "responder")}
                          disabled={isCurrentUser}
                          className={`px-4 py-2 rounded text-white text-sm transition ${
                            isCurrentUser
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                          title={isCurrentUser ? "You can't change your own role" : ""}
                        >
                          Demote
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(u._id, "admin")}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition"
                        >
                          Promote
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
