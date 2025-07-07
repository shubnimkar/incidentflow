import React from "react";

const priorityColors = {
  P1: "bg-red-600 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-amber-400 text-black",
  P4: "bg-green-500 text-white",
  P5: "bg-blue-500 text-white",
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