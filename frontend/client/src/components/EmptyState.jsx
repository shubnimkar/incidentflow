import React from "react";

const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <svg width="80" height="80" fill="none" viewBox="0 0 80 80" aria-hidden="true">
      <rect width="80" height="80" rx="16" fill="#f1f5f9" />
      <path d="M24 48h32M24 40h32M24 32h32" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="24" r="4" fill="#cbd5e1" />
    </svg>
    <h3 className="mt-6 text-lg font-semibold text-[#111418]">{title}</h3>
    <p className="mt-2 text-sm text-[#60758a] text-center max-w-xs">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState; 