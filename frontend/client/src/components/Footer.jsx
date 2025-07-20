import React from "react";

const Footer = () => (
  <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
    <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
  </footer>
);

export default Footer; 