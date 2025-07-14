import React, { useState, useEffect } from "react";
import UsersSection from "../components/UsersSection";
import TeamsSection from "../components/TeamsSection";
import OverdueWindowSection from "../components/OverdueWindowSection";
import AuditLogsSection from "../components/AuditLogsSection";
import UserAuditLogsSection from "../components/UserAuditLogsSection";
import { FaShieldAlt, FaUsers, FaUserFriends, FaChartLine } from 'react-icons/fa';
import { userApi } from "../services/api";
import axios from "axios";

const TABS = [
  { key: "users", label: "Users" },
  { key: "teams", label: "Teams" },
  { key: "overdue", label: "Overdue Windows" },
  { key: "audit", label: "Audit Logs" },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [auditEvents24h, setAuditEvents24h] = useState(null); // null means loading

  useEffect(() => {
    // Fetch users
    userApi.get("/").then(res => setUsers(res.data)).catch(() => setUsers([]));
    // Fetch teams
    userApi.get("/teams").then(res => setTeams(res.data)).catch(() => setTeams([]));
    // Fetch audit log events (last 24h)
    axios.get("http://localhost:5001/api/incidents/audit-log-metrics", { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setAuditEvents24h(res.data.last24h))
      .catch(() => setAuditEvents24h(0));
  }, []);

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: <FaUsers className="text-blue-600 text-xl" />,
      bg: "bg-blue-50",
    },
    {
      label: "Total Teams",
      value: teams.length,
      icon: <FaUserFriends className="text-green-600 text-xl" />,
      bg: "bg-green-50",
    },
    {
      label: "Audit Log Events (24h)",
      value: auditEvents24h === null ? "..." : auditEvents24h,
      icon: <FaChartLine className="text-orange-500 text-xl" />,
      bg: "bg-orange-50",
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
        {/* Header with icon and breadcrumbs */}
        <div className="flex items-center gap-4 mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
            <FaShieldAlt className="text-blue-600 text-2xl" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <nav className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Home / <span className="text-gray-700 dark:text-gray-200 font-semibold">Admin Dashboard</span>
            </nav>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className={`flex items-center gap-4 p-6 rounded-2xl shadow-md border-l-4 ${stat.bg} border-blue-400 dark:border-blue-600`}>
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 shadow">
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Top Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 text-lg font-semibold focus:outline-none transition border-b-2 ${activeTab === tab.key ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600"}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        {activeTab === "users" && <UsersSection />}
        {activeTab === "teams" && <TeamsSection />}
        {activeTab === "overdue" && <OverdueWindowSection />}
        {activeTab === "audit" && <AuditLogsSection />}
      </div>
      {/* Global Footer */}
      <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
        <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
      </footer>
    </>
  );
}
