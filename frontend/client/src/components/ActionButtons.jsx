import React from "react";

const ActionButtons = ({ onEdit, onRotate, onDelete, loading, disabled }) => (
  <div className="flex gap-2">
    <button
      aria-label="Edit schedule"
      className="px-2 py-1 rounded bg-[#e0e7ef] hover:bg-[#cbd5e1] text-[#1d3557] text-xs font-medium"
      onClick={onEdit}
      disabled={disabled || loading}
      type="button"
    >
      Edit
    </button>
    <button
      aria-label="Rotate schedule"
      className="px-2 py-1 rounded bg-[#f1faee] hover:bg-[#e0f2e9] text-[#457b9d] text-xs font-medium"
      onClick={onRotate}
      disabled={disabled || loading}
      type="button"
    >
      {loading === 'rotate' ? 'Rotating...' : 'Rotate'}
    </button>
    <button
      aria-label="Delete schedule"
      className="px-2 py-1 rounded bg-[#ffe5e5] hover:bg-[#ffcccc] text-[#e63946] text-xs font-medium"
      onClick={onDelete}
      disabled={disabled || loading}
      type="button"
    >
      {loading === 'delete' ? 'Deleting...' : 'Delete'}
    </button>
  </div>
);

export default ActionButtons; 