import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { incidentApi } from "../services/api";
import axios from "axios";

export default function AuditLogsSection() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(10);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditUserFilter, setAuditUserFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditActions, setAuditActions] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch users for filter dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5002/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      // ignore
    }
  }, []);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = {
        page: auditPage,
        limit: auditLimit,
        ...(auditUserFilter && { user: auditUserFilter }),
        ...(auditActionFilter && { action: auditActionFilter }),
        ...(auditStartDate && { startDate: auditStartDate }),
        ...(auditEndDate && { endDate: auditEndDate }),
      };
      const res = await incidentApi.get('/incidents/audit-logs', { params });
      setAuditLogs(res.data.logs);
      setAuditTotal(res.data.total);
      setAuditTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditLimit, auditUserFilter, auditActionFilter, auditStartDate, auditEndDate]);

  // Collect unique actions for filter dropdown
  useEffect(() => {
    if (auditLogs.length > 0) {
      const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
      setAuditActions(uniqueActions);
    }
  }, [auditLogs]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="mb-8 max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-800 dark:text-white text-lg">Audit Logs</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <select value={auditUserFilter} onChange={e => setAuditUserFilter(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm">
          <option value="">All Users</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.name || u.email}</option>
          ))}
        </select>
        <select value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm">
          <option value="">All Actions</option>
          {auditActions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="date" value={auditStartDate} onChange={e => setAuditStartDate(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
        <input type="date" value={auditEndDate} onChange={e => setAuditEndDate(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
        <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm" onClick={() => { setAuditUserFilter(""); setAuditActionFilter(""); setAuditStartDate(""); setAuditEndDate(""); setAuditPage(1); }}>Clear Filters</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Incident</th>
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="px-4 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLoading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : auditLogs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">No logs found.</td></tr>
            ) : (
              auditLogs.map(log => (
                <tr key={log._id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{log.action}</td>
                  <td className="px-4 py-2">{log.performedBy?.name || log.performedBy?.email || 'N/A'}</td>
                  <td className="px-4 py-2">{log.incident?.title || log.incident || 'N/A'}</td>
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
        <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" disabled={auditPage === 1} onClick={() => setAuditPage(auditPage - 1)}>Prev</button>
        <span>Page {auditPage} of {auditTotalPages}</span>
        <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" disabled={auditPage === auditTotalPages} onClick={() => setAuditPage(auditPage + 1)}>Next</button>
        <span className="ml-4">Total: {auditTotal}</span>
      </div>
    </div>
  );
} 