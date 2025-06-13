import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateIncident from './pages/CreateIncident';
import Signup from "./pages/Signup";
import IncidentDetails from './pages/IncidentDetails';
import AdminPanel from "./pages/AdminPanel";
import { getCurrentUser } from './utils/auth';
import NotAuthorized from './pages/NotAuthorized';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateIncident />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/incidents/:id" element={<IncidentDetails />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route
                path="/admin"
                element={
                  getCurrentUser()?.role === "admin" ? (
                    <AdminPanel />
                  ) : (
                    <NotAuthorized />
                  )
                }
              />
      </Routes>
    </Router>
  );
}

export default App;
