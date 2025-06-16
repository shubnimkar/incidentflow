import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = decodedToken?.role;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5002/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, [token]);

  const changeRole = async (userId, newRole) => {
    try {
      await axios.patch(
        `http://localhost:5002/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
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
    <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h2 className="text-2xl font-semibold mb-6">Admin Panel</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-700 shadow-md rounded">
          <thead className="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-left">Email</th>
              <th className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-left">Role</th>
              <th className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="even:bg-white odd:bg-gray-50 dark:even:bg-gray-800 dark:odd:bg-gray-700">
                <td className="px-6 py-3 border border-gray-300 dark:border-gray-700">{u.email}</td>
                <td className="px-6 py-3 border border-gray-300 dark:border-gray-700 flex items-center gap-2">
                  {u.role}
                  {u.role === "admin" && (
                    <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                      ADMIN
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 border border-gray-300 dark:border-gray-700">
                  {u.role === "admin" ? (
                    <button
                      onClick={() => changeRole(u._id, "responder")}
                      disabled={u.email === decodedToken?.email}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Demote to Responder
                    </button>
                  ) : (
                    <button
                      onClick={() => changeRole(u._id, "admin")}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Promote to Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
