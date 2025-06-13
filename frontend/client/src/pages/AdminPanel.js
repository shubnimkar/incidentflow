import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  // ✅ Decode token to get user role
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userRole = decodedToken?.role;

  // ...rest of the component logic

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

  // ❌ Block non-admins
  if (userRole !== "admin") {
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        ❌ Access Denied: Admins only
      </div>
    );
  }

  // ✅ Show Admin Panel to Admins
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Admin Panel</h2>
      <table border="1" cellPadding="10" cellSpacing="0">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.email}</td>
              <td>
                {u.role}
                {u.role === "admin" && (
  <span style={{ marginLeft: "8px", padding: "2px 6px", background: "green", color: "white", borderRadius: "4px", fontSize: "0.75rem" }}>
    ADMIN
  </span>
        )}
              </td>
              <td>
                {u.role === "admin" ? (
                  <button
                    onClick={() => changeRole(u._id, "responder")}
                    disabled={u.email === decodedToken?.email}
                  >
                    Demote to Responder
                  </button>
                ) : (
                  <button onClick={() => changeRole(u._id, "admin")}>
                    Promote to Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
