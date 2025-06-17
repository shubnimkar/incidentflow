import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"; // optional icons

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validations
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password/${token}`, {
        password,
      });

      setSuccess("Password reset successful! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleReset}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          Reset Your Password
        </h2>

        {error && (
          <div className="flex items-center text-red-600 bg-red-100 dark:bg-red-900 p-2 rounded mb-3 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center text-green-600 bg-green-100 dark:bg-green-900 p-2 rounded mb-3 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 mb-3 rounded border dark:bg-gray-700 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-2 mb-4 rounded border dark:bg-gray-700 dark:text-white"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 rounded ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
