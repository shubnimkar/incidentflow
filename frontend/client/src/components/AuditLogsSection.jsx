import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { incidentApi } from "../services/api";
import axios from "axios";
import { FaUserCircle, FaSearch, FaDownload, FaCheckCircle, FaEdit, FaTrash, FaPlus, FaInfoCircle } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useRef } from "react";
import { io } from "socket.io-client";

function getActionIcon(action) {
  if (!action) return <FaInfoCircle className="text-gray-400" />;
  if (action.toLowerCase().includes("delete")) return <FaTrash className="text-red-500" />;
  if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) return <FaEdit className="text-yellow-500" />;
  if (action.toLowerCase().includes("add") || action.toLowerCase().includes("create")) return <FaPlus className="text-green-500" />;
  if (action.toLowerCase().includes("assign")) return <FaCheckCircle className="text-blue-500" />;
  return <FaInfoCircle className="text-gray-400" />;
}

function getBadgeColor(action) {
  if (!action) return "bg-gray-200 text-gray-700";
  if (action.toLowerCase().includes("delete")) return "bg-red-100 text-red-700";
  if (action.toLowerCase().includes("edit") || action.toLowerCase().includes("update")) return "bg-yellow-100 text-yellow-700";
  if (action.toLowerCase().includes("add") || action.toLowerCase().includes("create")) return "bg-green-100 text-green-700";
  if (action.toLowerCase().includes("assign")) return "bg-blue-100 text-blue-700";
  return "bg-gray-200 text-gray-700";
}

function UserAvatar({ user }) {
  if (!user) return <FaUserCircle className="w-8 h-8 text-gray-400" />;
  if (user.avatarUrl) return <img src={user.avatarUrl} alt={user.name || user.email} className="w-8 h-8 rounded-full object-cover" />;
  const initials = (user.name || user.email || "?").split(" ").map(w => w[0]).join("").toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
      {initials}
    </div>
  );
}

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
  const [auditRequestId, setAuditRequestId] = useState("");
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [auditActions, setAuditActions] = useState([]);
  const [users, setUsers] = useState([]);
  const socketRef = useRef(null);
  const [updatedFieldFilter, setUpdatedFieldFilter] = useState("");

  // Add a constant for all possible actions
  const ALL_ACTIONS = [
    "updated field",
    "assigned incident",
    "added comment",
    "uploaded attachment",
    "deleted incident",
    "closed incident",
    "deleted attachment"
  ];

  // Use a fixed list for updated fields
  const FIXED_UPDATED_FIELDS = [
    "title",
    "description",
    "urgency",
    "status",
    "assignedTo",
    "team",
    "incidentType",
    "impactedService",
    "priority",
    "responders"
  ];

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
        // Only send action param if not filtering for closed incident
        ...((auditActionFilter && auditActionFilter !== 'closed incident') && { action: auditActionFilter }),
        ...(auditStartDate && { startDate: auditStartDate }),
        ...(auditEndDate && { endDate: auditEndDate }),
        ...(auditRequestId && { requestId: auditRequestId }),
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
  }, [auditPage, auditLimit, auditUserFilter, auditActionFilter, auditStartDate, auditEndDate, auditRequestId]);

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

  // Fetch both logs on mount or page/limit change
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    // Connect to the incident service socket.io
    socketRef.current = io("http://localhost:5001");
    socketRef.current.on("auditLogCreated", (newLog) => {
      // Determine type and normalize
      let log = newLog;
      if (log.incident) {
        log = {
          ...log,
          type: "Incident",
          target: log.incident?.title || log.incident || "N/A",
          targetLink: log.incident?._id ? `/incidents/${log.incident._id}` : null,
          targetUser: null,
        };
      } else if (log.targetUser) {
        log = {
          ...log,
          type: "User",
          target: log.targetUser?.name || log.targetUser?.email || "N/A",
          targetLink: null,
          targetUser: log.targetUser,
        };
      }
      // Prepend to logs
      setAuditLogs((prev) => [log, ...prev]);
    });
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Normalize and merge logs
  const mergedLogs = auditLogs.map(log => ({
    ...log,
    type: "Incident",
    target: log.incident?.title || log.incident || "N/A",
    targetLink: log.incident?._id ? `/incidents/${log.incident._id}` : null,
    targetUser: null,
  }));

  // Collect unique updated fields from logs
  const updatedFields = Array.from(new Set(mergedLogs.filter(l => l.action === "updated field" && l.details && l.details.field).map(l => l.details.field)));

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Action", "User", "Incident", "Timestamp", "Request ID", "Details"];
    const rows = mergedLogs.map(log => [
      log.action,
      log.performedBy?.name || log.performedBy?.email || 'N/A',
      log.target,
      new Date(log.timestamp).toLocaleString(),
      log.requestId || '',
      typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '')
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk selection
  const toggleSelect = (id) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]);
  const selectAll = () => setSelected(mergedLogs.map(l => l._id));
  const clearSelected = () => setSelected([]);

  // Sorting (simple client-side for demo)
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const sortedLogs = [...mergedLogs].sort((a, b) => {
    let vA = a[sortBy], vB = b[sortBy];
    if (sortBy === 'timestamp') {
      vA = new Date(a.timestamp);
      vB = new Date(b.timestamp);
    }
    if (vA < vB) return sortDir === 'asc' ? -1 : 1;
    if (vA > vB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Apply action filter (and others if needed)
  const filteredLogs = sortedLogs.filter(log => {
    let action = log.action;
    // Map archived incident to closed incident for display and filtering
    if (action === 'archived incident') action = 'closed incident';
    // Fix: If filtering for closed incident, match both closed and archived
    if (auditActionFilter === 'closed incident' && !(log.action === 'closed incident' || log.action === 'archived incident')) return false;
    if (auditActionFilter && auditActionFilter !== 'closed incident' && action !== auditActionFilter) return false;
    if (auditUserFilter && log.performedBy?._id !== auditUserFilter) return false;
    if (auditActionFilter === "updated field" && updatedFieldFilter && log.details?.field !== updatedFieldFilter) return false;
    if (auditRequestId && log.requestId !== auditRequestId) return false;
    // Add more filters as needed
    return true;
  });

  return (
    <div className="mb-8 w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 dark:text-white text-lg">Audit Logs</span>
          <button onClick={exportCSV} className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 flex items-center gap-1 text-xs hover:bg-blue-200"><FaDownload /> Export</button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={selectAll} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200">Select All</button>
          <button onClick={clearSelected} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200">Clear</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <select value={auditUserFilter} onChange={e => setAuditUserFilter(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm">
          <option value="">All Users</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.name || u.email}</option>
          ))}
        </select>
        <select value={auditActionFilter} onChange={e => { setAuditActionFilter(e.target.value); setUpdatedFieldFilter(""); }} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm">
          <option value="">All Actions</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {auditActionFilter === "updated field" && (
          <select value={updatedFieldFilter} onChange={e => setUpdatedFieldFilter(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm">
            <option value="">All Fields</option>
            {FIXED_UPDATED_FIELDS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
        <input type="date" value={auditStartDate} onChange={e => setAuditStartDate(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
        <input type="date" value={auditEndDate} onChange={e => setAuditEndDate(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
        <input type="text" placeholder="Request ID" value={auditRequestId} onChange={e => setAuditRequestId(e.target.value)} className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
        <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm" onClick={() => { setAuditUserFilter(""); setAuditActionFilter(""); setAuditStartDate(""); setAuditEndDate(""); setAuditRequestId(""); setAuditPage(1); }}>Clear Filters</button>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left w-8"></th>
              <th className="px-2 py-2 text-left w-8"></th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortBy('action'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Action</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortBy('performedBy'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>User</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortBy('type'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Type</th>
              <th className="px-4 py-2 text-left">Target</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortBy('timestamp'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Time</th>
              <th className="px-4 py-2 text-left">Request ID</th>
              <th className="px-4 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLoading ? (
              <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400 dark:text-gray-500">No logs found.</td></tr>
            ) : (
              filteredLogs.map(log => (
                <React.Fragment key={log._id}>
                  <tr className={`border-t border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-900 transition ${expanded === log._id ? 'bg-blue-50 dark:bg-gray-900' : ''}`}>
                    <td className="px-2 py-2">
                      <input type="checkbox" checked={selected.includes(log._id)} onChange={() => toggleSelect(log._id)} />
                    </td>
                    <td className="px-2 py-2">{getActionIcon(log.action)}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(log.action === 'archived incident' ? 'closed incident' : log.action)}`}>{log.action === 'archived incident' ? 'closed incident' : log.action}</span>
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <UserAvatar user={log.performedBy} />
                      <span>{log.performedBy?.name || log.performedBy?.email || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${log.type === 'Incident' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{log.type}</span>
                    </td>
                    <td className="px-4 py-2">
                      {log.targetLink ? <a href={log.targetLink} className="text-blue-600 hover:underline">{log.target}</a> : log.target}
                    </td>
                    <td className="px-4 py-2">
                      <span title={new Date(log.timestamp).toLocaleString()}>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs truncate max-w-[120px]" title={log.requestId}>{log.requestId || '-'}</td>
                    <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-200">
                      {log.action === 'updated field' && log.details && log.details.field ? (
                        <span>
                          <strong>{log.details.field.charAt(0).toUpperCase() + log.details.field.slice(1)}</strong>
                          {` changed from `}
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 rounded px-1">{String(log.details.oldValue)}</span>
                          {` to `}
                          <span className="font-mono bg-gray-100 dark:bg-gray-800 rounded px-1">{String(log.details.newValue)}</span>
                        </span>
                      ) : log.action === 'assigned incident' && log.details && log.details.assignedToEmail ? (
                        <span>Assigned to <span className="font-mono">{log.details.assignedToEmail}</span>{log.details.incidentTitle ? ` for "${log.details.incidentTitle}"` : ''}</span>
                      ) : log.action === 'closed incident' ? (
                        <span>Incident closed</span>
                      ) : log.details && typeof log.details === 'string' ? (
                        <span>{log.details}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                  {expanded === log._id && (
                    <tr className="bg-blue-50 dark:bg-gray-900">
                      <td colSpan={10} className="px-6 py-4 whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200">
                        <strong>Details:</strong>
                        <pre className="mt-2 bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto">
                          {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : (log.details || '-')}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
        {selected.length > 0 && <span className="ml-4 text-blue-600 font-semibold">{selected.length} selected</span>}
      </div>
    </div>
  );
} 