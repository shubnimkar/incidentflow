import React from "react";

const RotationBadge = ({ rotationType }) => {
  const isDaily = rotationType === "daily";
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${isDaily ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
      aria-label={`Rotation type: ${rotationType}`}
    >
      {rotationType.charAt(0).toUpperCase() + rotationType.slice(1)}
    </span>
  );
};

export default RotationBadge; 