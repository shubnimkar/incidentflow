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
    <div className="flex">
      <Sidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)} />
      <main
        className={`transition-all duration-300 min-h-screen w-full ${
          collapsed ? "ml-16" : "ml-64"
        } bg-gray-50 dark:bg-gray-900 p-6`}
      >
        <Outlet /> {/* 👈 This renders the nested route component */}
      </main>
    </div>
  );
};

export default Layout;
