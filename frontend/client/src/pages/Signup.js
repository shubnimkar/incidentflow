import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { authApi } from "../services/api";

// Password strength checker
const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "text-red-500" };
  if (score === 2 || score === 3) return { label: "Moderate", color: "text-yellow-500" };
  return { label: "Strong", color: "text-green-500" };
};

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Typewriter effect for tagline (single string, highlight 'reimagined')
  const taglineFull = 'Incident management, reimagined for modern teams';
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let interval = setInterval(() => {
      setTyped(taglineFull.slice(0, i + 1));
      i++;
      if (i === taglineFull.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 35);
    return () => clearInterval(interval);
  }, []);

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await authApi.post("/register", { name, email, password });
      setSuccess("Signup successful! Redirecting...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-100 via-white to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-1 flex-col md:flex-row justify-between">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 px-12 relative overflow-hidden">
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
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-[400px] h-[400px] flex items-center justify-center mb-0 -mt-32">
              <img src={process.env.PUBLIC_URL + '/logo2.png'} alt="IncidentFlow Logo" className="max-w-full object-contain drop-shadow-xl animate-glow" style={{filter: 'drop-shadow(0 0 40px #60a5fa88)'}} />
            </div>
            <p
              className={`text-2xl -mt-12 mb-2 text-center max-w-xs transition-all duration-1000 ${done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {(() => {
                const before = 'Incident management, ';
                const highlight = 'reimagined';
                const after = ' for modern teams';
                if (!typed.includes(highlight)) {
                  return <span className="text-[#f97316] dark:text-[#fbbf24]">{typed}</span>;
                }
                const beforeText = typed.slice(0, before.length);
                const highlightText = typed.slice(before.length, before.length + highlight.length);
                const afterText = typed.slice(before.length + highlight.length);
                return <>
                  <span className="text-[#f97316] dark:text-[#fbbf24]">{beforeText}</span>
                  <span className="font-bold bg-gradient-to-r from-[#f97316] to-[#2563eb] text-transparent bg-clip-text animate-gradient-slow">{highlightText}</span>
                  <span className="text-[#f97316] dark:text-[#fbbf24]">{afterText}</span>
                </>;
              })()}
            </p>
            <p className="text-base text-blue-900 dark:text-blue-200 mt-2 mb-8 text-center max-w-md mx-auto font-medium opacity-80">
              Join the platform reimagining incident management for modern teams.
            </p>
          </div>
          {/* Floating shapes */}
          <div className="absolute top-20 left-10 w-6 h-6 bg-blue-400 rounded-full opacity-20 animate-float-slow z-0" />
          <div className="absolute bottom-24 right-24 w-8 h-8 bg-indigo-400 rounded-full opacity-10 animate-float-fast z-0" />
        </div>
        {/* Right Side (Signup Card) */}
        <div className="flex flex-1 items-stretch justify-center px-2">
          <div className="w-full max-w-md min-h-[600px] flex flex-col justify-between mt-12 py-8 px-6 rounded-2xl bg-white/70 dark:bg-gray-900/80 backdrop-blur shadow-xl border border-blue-100 dark:border-gray-700">
            <div className="flex flex-col items-center mb-4">
              <img src={process.env.PUBLIC_URL + '/logo2.png'} alt="IncidentFlow Logo" className="w-20 h-auto mb-2 drop-shadow-xl" />
              <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">Create an Account</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center text-red-600 bg-red-100 dark:bg-red-900 p-2 rounded mb-1 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center text-green-600 bg-green-100 dark:bg-green-900 p-2 rounded mb-1 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {success}
                </div>
              )}
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={0}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.password && (
                <p className={`text-sm mb-1 font-medium ${strength.color}`}>
                  Password strength: {strength.label}
                </p>
              )}
              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={0}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mr-2 rounded border-gray-300 focus:ring-blue-500"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                  I agree to the
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline mx-1">Terms of Service</a>
                  and
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline mx-1">Privacy Policy</a>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Footer (diffused) */}
      <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
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
        @keyframes gradient-slow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradient-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Signup;
