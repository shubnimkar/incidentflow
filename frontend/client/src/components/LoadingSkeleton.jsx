import React from "react";

const LoadingSkeleton = ({ columns, rows = 5 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
        {columns.map((col, colIdx) => (
          <td key={col.key || colIdx} className="px-4 py-3">
            <div className="h-4 bg-[#e2e8f0] rounded animate-pulse w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export default LoadingSkeleton; 