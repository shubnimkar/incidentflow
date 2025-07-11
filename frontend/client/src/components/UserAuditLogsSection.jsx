import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { io } from "socket.io-client";
import { useRef } from "react";

export default function UserAuditLogsSection() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5002/api/users/audit-logs", {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to load user audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time updates for user audit logs
  useEffect(() => {
    socketRef.current = io("http://localhost:5001");
    socketRef.current.on("userAuditLogCreated", () => {
      fetchLogs();
    });
    socketRef.current.on("userUpdated", () => {
      fetchLogs();
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchLogs]);

  return (
    <div className="mb-8 max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800 dark:text-white text-lg">User Audit Logs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Performed By</th>
              <th className="px-4 py-2 text-left">Target User</th>
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="px-4 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">No logs found.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log._id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{log.action}</td>
                  <td className="px-4 py-2">{log.performedBy?.name || log.performedBy?.email || 'N/A'}</td>
                  <td className="px-4 py-2">{log.targetUser?.name || log.targetUser?.email || 'N/A'}</td>
                  <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-pre-wrap">{typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : (log.details || '')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center gap-2 mt-2">
        <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        <span className="ml-4">Total: {total}</span>
      </div>
    </div>
  );
} 