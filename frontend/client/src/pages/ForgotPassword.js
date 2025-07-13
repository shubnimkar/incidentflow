import React, { useState } from "react";
import { authApi } from "../services/api";
import { Link } from "react-router-dom";
import { FaSpinner } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      setLoading(true);
      const res = await authApi.post("/forgot-password", { email });
      setMessage(res.data.message || "Password reset email sent successfully");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-100 via-white to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* SVG Mesh/Wave Background */}
      <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mesh1" cx="50%" cy="50%" r="80%" fx="50%" fy="50%" gradientTransform="rotate(45)">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="400" cy="400" rx="400" ry="320" fill="url(#mesh1)" />
        <ellipse cx="600" cy="200" rx="200" ry="120" fill="#38bdf8" fillOpacity="0.08" />
        <ellipse cx="200" cy="600" rx="180" ry="100" fill="#6366f1" fillOpacity="0.07" />
      </svg>
      <div className="flex flex-1 items-center justify-center relative z-20 px-4 py-12">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 flex flex-col items-center relative z-10">
          <img src={process.env.PUBLIC_URL + '/logo2.png'} alt="IncidentFlow Logo" className="w-40 h-auto mb-2 drop-shadow-xl" />
          <div className="w-12 border-b-2 border-blue-100 mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Forgot Password</h2>
          <p className="text-gray-600 text-center mb-6">We'll send you a link to reset your password.</p>
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            {message && <p className="text-green-600 text-center font-medium">{message}</p>}
            {error && <p className="text-red-600 text-center font-medium">{error}</p>}
          </form>
          <div className="mt-6 text-center w-full">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
      {/* Footer (diffused) */}
      <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none relative z-10">
        <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
      </footer>
      {/* Animations */}
      <style>{`
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 40px #60a5fa88); }
          50% { filter: drop-shadow(0 0 80px #60a5fa); }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
