import React from "react";

const TableRow = ({ schedule, columns, onAction, index }) => {
  return (
    <tr className={index % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
      {columns.map(col => (
        <td key={col.key} className="px-4 py-3 text-sm text-[#111418] align-middle">
          {col.render ? col.render(schedule) : schedule[col.key]}
        </td>
      ))}
    </tr>
  );
};

export default TableRow; 