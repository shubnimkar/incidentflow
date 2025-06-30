import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateIncident from "./pages/CreateIncident";
import Signup from "./pages/Signup";
import IncidentDetails from "./pages/IncidentDetails";
import AdminPanel from "./pages/AdminPanel";
import NotAuthorized from "./pages/NotAuthorized";
import Layout from "./components/Layout";
import { DarkModeProvider } from "./context/DarkModeContext";
import { getCurrentUser } from "./utils/auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import { Toaster, toast } from "react-hot-toast";


function App() {
  const user = getCurrentUser();
  const [ariaToast, setAriaToast] = useState("");

  // Helper to show toast and update ARIA live region
  window.showToast = function(message, type = "success") {
    setAriaToast(message);
    toast[type](message);
  };

  return (
    <DarkModeProvider>
      {/* ARIA live region for toast/feedback */}
      <div
        aria-live="polite"
        role="status"
        style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", border: 0 }}
      >
        {ariaToast}
      </div>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          

          {/* Protected Layout Wrapper */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateIncident />} />
            <Route path="/incidents/:id" element={<IncidentDetails />} />
            <Route
              path="/admin"
              element={
                user?.role === "admin" ? <AdminPanel /> : <NotAuthorized />
              }
            />
          </Route>
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
