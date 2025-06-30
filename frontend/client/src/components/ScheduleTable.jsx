import React from "react";

const ScheduleTable = ({ columns, data, loading, renderRow, emptyState, page, pageSize, setPage, total }) => {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="overflow-x-auto rounded-xl border border-[#dbe0e6] bg-white shadow">
      <table className="min-w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-white">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-[#111418] text-sm font-medium" style={col.width ? {width: col.width} : {}}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}><div className="py-8 text-center text-gray-400">Loading...</div></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length}>{emptyState}</td></tr>
          ) : (
            data.map(renderRow)
          )}
        </tbody>
      </table>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 px-4 py-2 border-t border-[#dbe0e6] bg-white">
          <button
            className="px-3 py-1 rounded bg-[#f0f2f5] text-[#111418] text-sm font-medium"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="text-sm text-[#60758a]">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-[#f0f2f5] text-[#111418] text-sm font-medium"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleTable; 