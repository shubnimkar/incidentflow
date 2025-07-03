// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaTachometerAlt,
  FaPlusCircle,
  FaUsersCog,
  FaCalendarAlt,
  FaClock,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { DarkModeContext } from "../context/DarkModeContext";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { darkMode, toggleDarkMode } = React.useContext(DarkModeContext);
  console.log("Sidebar user:", user); // 👈 Check this

  const activeClass = "flex items-center space-x-3 px-3 py-2 rounded bg-gray-300 dark:bg-gray-700 text-sm";
  const inactiveClass = "flex items-center space-x-3 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm";

  const navLinks = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      label: "On-Call Status",
      path: "/oncall-status",
      icon: <FaClock />,
    },
    {
      label: "Create Incident",
      path: "/create",
      icon: <FaPlusCircle />,
    },
    {
      label: "Admin Panel",
      path: "/admin",
      icon: <FaUsersCog />,
      adminOnly: true,
    },
    {
      label: "On-Call Rotations",
      path: "/oncall-rotations",
      icon: <FaCalendarAlt />,
      adminOnly: true,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-64"
      } fixed inset-y-0 left-0 z-30 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border-r dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        {!collapsed && <span className="font-bold text-lg">Incident Manager</span>}
        <button
          onClick={toggleSidebar}
          className="text-gray-700 dark:text-white text-xl ml-auto"
        >
          <FaBars />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-2 space-y-2">
        {navLinks.map(
          (link) =>
            (!link.adminOnly || user?.role === "admin") && (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-sm ${
                  location.pathname === link.path
                    ? "bg-gray-300 dark:bg-gray-700"
                    : ""
                }`}
              >
                <span>{link.icon}</span>
                {!collapsed && <span>{link.label}</span>}
              </Link>
            )
        )}
        {/* Directory Group */}
        <div className="mt-4">
          {!collapsed && (
            <div className="uppercase text-xs text-gray-400 dark:text-gray-500 font-bold px-3 mb-1 flex items-center gap-2">
              <FaUsers className="inline-block" /> People
            </div>
          )}
          <ul className={`space-y-1 ${!collapsed ? 'ml-4' : ''}`}>
            <li>
              <Link
                to="/users"
                className={location.pathname.startsWith("/users") ? activeClass : inactiveClass}
                title="Users"
              >
                <span className="mr-2"><FaUserFriends /></span>
                {!collapsed && "Users"}
              </Link>
            </li>
            <li>
              <Link
                to="/teams"
                className={location.pathname.startsWith("/teams") ? activeClass : inactiveClass}
                title="Teams"
              >
                <span className="mr-2"><FaUsers /></span>
                {!collapsed && "Teams"}
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom controls */}
      <div className="p-4 border-t dark:border-gray-700 space-y-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center w-full space-x-3 py-2 px-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm"
        >
          <span>{darkMode ? <FaSun /> : <FaMoon />}</span>
          {!collapsed && (
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full space-x-3 py-2 px-2 hover:bg-red-600 dark:hover:bg-red-700 rounded text-sm"
        >
          <FaSignOutAlt />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
