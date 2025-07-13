// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with logo */}
      <header className="flex items-center px-8 py-4 border-b border-gray-200 bg-white shadow-sm z-40">
        <img src="/logo.png" alt="Incident Flow Logo" className="h-12" style={{maxHeight: '48px', width: 'auto'}} />
      </header>
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)} />
        <main
          className="flex-1 transition-all duration-300 bg-gray-50 dark:bg-gray-900 pt-0 px-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
