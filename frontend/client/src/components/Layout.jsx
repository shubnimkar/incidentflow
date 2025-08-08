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
    try {
      navigate("/dashboard");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to window.location if navigate fails
      window.location.href = "/dashboard";
    }
  };

  const handleLogoKeyPress = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLogoClick();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header with logo */}
      <header className="flex items-center px-8 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm z-40 transition-colors duration-300">
        <img 
          src="/logo.png" 
          alt="Incident Flow Logo - Click to go to Dashboard" 
          className="h-12 cursor-pointer hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" 
          style={{maxHeight: '48px', width: 'auto'}}
          onClick={handleLogoClick}
          onKeyPress={handleLogoKeyPress}
          tabIndex={0}
          role="button"
          aria-label="Go to Dashboard"
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
