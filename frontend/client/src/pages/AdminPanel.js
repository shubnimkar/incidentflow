import React, { useState } from "react";
import UsersSection from "../components/UsersSection";
import TeamsSection from "../components/TeamsSection";
import OverdueWindowSection from "../components/OverdueWindowSection";
import AuditLogsSection from "../components/AuditLogsSection";
import UserAuditLogsSection from "../components/UserAuditLogsSection";

const TABS = [
  { key: "users", label: "Users" },
  { key: "teams", label: "Teams" },
  { key: "overdue", label: "Overdue Windows" },
  { key: "audit", label: "Audit Logs" },
  { key: "userAudit", label: "User Audit Logs" },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-2 sm:px-6 md:px-12 py-6">
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
      {activeTab === "userAudit" && <UserAuditLogsSection />}
    </div>
  );
}
