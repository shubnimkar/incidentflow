import React, { useEffect, useState, useCallback } from "react";
import { userApi } from "../services/api";
import { toast } from "react-hot-toast";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleLoading, setRoleLoading] = useState("");
  const token = localStorage.getItem("token");
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = decodedToken?.role;
  const currentUserEmail = decodedToken?.email;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.get("/");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Users</h2>
        </div>
        <div className="h-0.5 w-32 bg-blue-100 dark:bg-gray-700 rounded-full mt-2 ml-12" />
      </div>
      <div className="mb-4 max-w-xs">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
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
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400 dark:text-gray-500">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400 dark:text-gray-500">No users found.</td></tr>
            ) : (
              filteredUsers.map((u, idx) => {
                const isCurrentUser = u.email === currentUserEmail;
                return (
                  <tr
                    key={u._id}
                    className={`border-t border-gray-200 dark:border-gray-700 transition-all ${
                      idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
                    } hover:bg-blue-50 dark:hover:bg-gray-700`}
                  >
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold shadow border-2 border-white dark:border-gray-800`}>
                        {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase()}
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
                      {userRole === 'admin' && (
                        <button
                          onClick={async () => {
                            if (isCurrentUser) return;
                            setRoleLoading(u._id);
                            try {
                              const newRole = u.role === "admin" ? "responder" : "admin";
                              await userApi.patch(`/` + u._id + `/role`, { role: newRole });
                              toast.success(`Role changed to ${newRole}`);
                              fetchUsers();
                            } catch (err) {
                              toast.error("Failed to change role");
                            } finally {
                              setRoleLoading("");
                            }
                          }}
                          disabled={isCurrentUser || roleLoading === u._id}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shadow-sm border ${
                            isCurrentUser
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                              : u.role === "admin"
                              ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
                          }`}
                        >
                          {roleLoading === u._id
                            ? "Updating..."
                            : u.role === "admin"
                            ? "Demote"
                            : "Promote"}
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
    </div>
  );
};

export default Users; 