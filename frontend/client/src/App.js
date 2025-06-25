import React from "react";
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
import { Toaster } from "react-hot-toast";


function App() {
  const user = getCurrentUser();

  return (
    <DarkModeProvider>
      <Router>
          <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />



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
