// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { DarkModeProvider, DarkModeContext } from "./context/DarkModeContext";
import { AuthProvider } from "./context/AuthContext"; // ✅ import AuthProvider
import { useContext } from "react";

function AppWithTheme() {
  const { darkMode } = useContext(DarkModeContext);
  return (
    <div className={darkMode ? "dark" : ""}>
      <App />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider> {/* ✅ Wrap AuthProvider outside */}
    <DarkModeProvider>
      <AppWithTheme />
    </DarkModeProvider>
  </AuthProvider>
);
