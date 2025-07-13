// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// Requires Line Awesome CDN in public/index.html
import { useAuth } from "../context/AuthContext";
import { DarkModeContext } from "../context/DarkModeContext";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { darkMode, toggleDarkMode } = React.useContext(DarkModeContext);

  const navLinks = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <i className="la la-tachometer-alt"></i>,
    },
    {
      label: "Create Incident",
      path: "/create",
      icon: <i className="la la-plus-circle"></i>,
    },
    {
      label: "Closed Cases",
      path: "/closed-cases",
      icon: <i className="la la-clock"></i>,
      adminOnly: true,
    },
    {
      label: "Admin Panel",
      path: "/admin",
      icon: <i className="la la-users-cog"></i>,
      adminOnly: true,
    },
    {
      label: "On-Call Status",
      path: "/oncall-status",
      icon: <i className="la la-clock"></i>,
    },
    {
      label: "On-Call Rotations",
      path: "/oncall-rotations",
      icon: <i className="la la-calendar-alt"></i>,
      adminOnly: true,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: <i className="la la-user-friends"></i>,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay (for mobile logic, just add the class for now) */}
      <div className={`fixed inset-0 z-20 bg-black/30 transition-opacity duration-300 ${collapsed ? 'hidden' : 'block'} md:hidden`} />
      <aside
        className={`
          ${collapsed ? 'w-16' : 'w-52'}
          h-screen flex-shrink-0 sticky top-0
          bg-white dark:bg-gray-900
          text-gray-800 dark:text-white
          border-r border-gray-200 dark:border-gray-800
          flex flex-col
          shadow-xl
          transition-all duration-300
          overflow-y-auto
        `}
      >
        {/* Logo */}
        {/* Collapse/Expand Button */}
        <div className="flex items-center justify-end px-2 pb-3">
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 text-xl p-2 rounded-full transition shadow-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="sidebar-icon"><i className="la la-bars"></i></span>
          </button>
        </div>
        {/* Nav Links */}
        <nav className={`flex-1 ${collapsed ? 'px-1 py-2' : 'px-2 py-4'} space-y-2 mt-2`}> 
          {navLinks.map((link) =>
            (!link.adminOnly || user?.role === "admin") && (
              <Link
                key={link.path}
                to={link.path}
                className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-0' : 'px-4'} py-2 rounded-lg transition-all duration-200 font-medium text-base relative overflow-hidden
                  ${location.pathname === link.path
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 shadow font-bold border-l-4 border-blue-500"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.03] text-gray-700 dark:text-gray-200"}
                `}
                title={link.label}
              >
                <span className={`text-lg sidebar-icon${location.pathname === link.path ? ' active' : ''}`}>{link.icon}</span>
                {!collapsed && <span className="transition-opacity duration-200">{link.label}</span>}
                {collapsed && <span className="absolute left-full ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">{link.label}</span>}
              </Link>
            )
          )}
        </nav>
        {/* Bottom controls */}
        <div className={`p-4 border-t border-gray-200 dark:border-gray-800 space-y-4 mt-auto ${collapsed ? 'items-center' : ''} bg-white dark:bg-gray-900`}> 
          {/* Dark Mode Toggle as pill switch */}
          <button
            onClick={toggleDarkMode}
            className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'} py-2 ${collapsed ? 'px-0' : 'px-3'} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-base font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700`}
          >
            <span className={`text-lg sidebar-icon${darkMode ? ' active' : ''}`}>{darkMode ? <i className="la la-sun"></i> : <i className="la la-moon"></i>}</span>
            {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'} py-2 ${collapsed ? 'px-0' : 'px-3'} hover:bg-red-50 dark:hover:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-base font-medium transition-all duration-200 border border-gray-200 dark:border-gray-700`}
          >
            <span className="text-lg sidebar-icon"><i className="la la-sign-out-alt"></i></span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
