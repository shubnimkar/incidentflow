import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";

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
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

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
  <div className="p-6 md:p-10 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
    <h2 className="text-4xl font-bold mb-8 tracking-tight">👥 Admin Panel</h2>

    {loading ? (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    ) : (
      <div className="overflow-x-auto rounded-lg shadow-sm border dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">User</th>
              <th className="px-6 py-4 text-left">Role</th>
              <th className="px-6 py-4 text-left">Actions</th>
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
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${avatarColor} text-white font-bold`}>
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
                    <span className="inline-flex items-center gap-2 text-sm">
                      {u.role}
                      {u.role === "admin" && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-green-600 text-white rounded-md">
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
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                        isCurrentUser
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : u.role === "admin"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
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
                        className="px-4 py-1.5 rounded-md text-sm font-medium bg-gray-700 hover:bg-black text-white"
                      >
                        Delete
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


      {/* Confirm Modal */}
      <Dialog.Root open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalType === "delete" ? "Confirm Delete" : "Confirm Role Change"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {modalType === "delete"
                ? `Are you sure you want to delete user "${selectedUser?.email}"? This cannot be undone.`
                : `Are you sure you want to change the role of "${selectedUser?.email}"?`}
            </p>
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm rounded bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={() => {
                  modalType === "delete" ? deleteUser() : changeRole();
                }}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default AdminPanel;
