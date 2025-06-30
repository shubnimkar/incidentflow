import React from "react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

const UserAvatar = ({ name, email, size = 28 }) => {
  const initials = getInitials(name || email);
  const bg = stringToColor(name || email);
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold border shadow-sm"
      style={{ width: size, height: size, background: bg, color: "#fff", fontSize: size * 0.45 }}
      title={name ? `${name} (${email})` : email}
      aria-label={name ? `${name} (${email})` : email}
    >
      {initials}
    </span>
  );
};

export default UserAvatar; 