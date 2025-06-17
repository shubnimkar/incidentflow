// src/utils/auth.js

export const getCurrentUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { id, email, role, iat, exp }
  } catch (err) {
    console.error("Invalid token");
    return null;
  }
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};
