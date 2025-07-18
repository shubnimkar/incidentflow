// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { userApi } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Decode token on initial load if token exists
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = JSON.parse(atob(storedToken.split(".")[1]));
        setUser(decoded);
        setToken(storedToken);
      } catch (err) {
        console.error("Invalid token in localStorage:", err);
        logout(); // clean up
      }
    }
  }, []);

  const login = async (newToken, userData) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    // Fetch latest user profile from /me
    try {
      const res = await userApi.get("/me");
      setUser(res.data);
      return res.data;
    } catch (err) {
      setUser(userData || null);
      return userData || null;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
