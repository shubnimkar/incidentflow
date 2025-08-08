// src/components/Layout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header with logo */}
      <header className="flex items-center px-8 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm z-40 transition-colors duration-300">
        <img 
          src="/logo.png" 
          alt="Incident Flow Logo" 
          className="h-12 cursor-pointer hover:opacity-80 transition-opacity duration-200" 
          style={{maxHeight: '48px', width: 'auto'}}
          onClick={handleLogoClick}
          title="Click to go to Dashboard"
        />
      </header>
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)} />
        <main
          className="flex-1 transition-all duration-300 bg-gray-50 dark:bg-gray-900 pt-0 px-6 min-h-screen"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
