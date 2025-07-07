import React from "react";

const priorityColors = {
  P1: "bg-red-600 text-white",
  P2: "bg-orange-400 text-black",
  P3: "bg-yellow-400 text-black",
  P4: "bg-green-400 text-black",
  None: "bg-gray-300 text-black",
};

export default function PriorityBadge({ priority }) {
  const color = priorityColors[priority] || "bg-gray-300 text-black";
  return (
    <span
      className={`inline-block px-3 py-1 rounded font-bold text-lg ${color}`}
      style={{ minWidth: 48, textAlign: "center" }}
      title={`Priority: ${priority}`}
    >
      {priority}
    </span>
  );
} 