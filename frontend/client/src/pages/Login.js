import React, { useState, useEffect, useRef } from "react";
import { authApi } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaGithub, FaMicrosoft, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // Tagline animation
  const taglineRef = useRef(null);
  useEffect(() => {
    if (taglineRef.current) {
      taglineRef.current.classList.add("opacity-100", "translate-y-0");
    }
  }, []);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.post("/login", { email, password });
      const { token, user } = res.data;
      
      if (res.data.requiresVerification) {
        toast.error("Please verify your email before logging in");
        setError("Please check your email for a verification link");
        return;
      }

      login(token, user);
      toast.success("Successfully logged in!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Invalid email or password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = (provider) => {
    setSsoLoading(provider);
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${baseUrl}/api/auth/${provider}`;
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
          {/* Glowing Logo */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-[400px] h-[400px] flex items-center justify-center mb-0 -mt-32">
              <img src={process.env.PUBLIC_URL + '/logo2.png'} alt="IncidentFlow Logo" className="max-w-full object-contain drop-shadow-xl animate-glow" style={{filter: 'drop-shadow(0 0 40px #60a5fa88)'}} />
            </div>
            <p
              ref={taglineRef}
              className={`text-2xl -mt-12 mb-8 text-center max-w-xs transition-all duration-1000 ${done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {(() => {
                // Find the word 'reimagined' and style it if present in the typed text
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
                  {/* Emoji removed as requested */}
                </>;
              })()}
            </p>
            <p className="text-base text-blue-900 dark:text-blue-200 mt-2 mb-8 text-center max-w-md mx-auto font-medium opacity-80">Stay ahead of every incident with a platform built for speed, collaboration, and control.</p>
          </div>
          {/* Floating shapes */}
          <div className="absolute top-20 left-10 w-6 h-6 bg-blue-400 rounded-full opacity-20 animate-float-slow z-0" />
          <div className="absolute bottom-24 right-24 w-8 h-8 bg-indigo-400 rounded-full opacity-10 animate-float-fast z-0" />
        </div>
        {/* Right Side (Login Card) */}
        <div className="flex flex-1 items-stretch justify-center px-2">
          <div className="w-full max-w-md min-h-[600px] flex flex-col justify-between mt-12 py-8 px-6 rounded-2xl bg-white/70 dark:bg-gray-900/80 backdrop-blur shadow-xl border border-blue-100 dark:border-gray-700">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400">Sign in to your IncidentFlow account</p>
            </div>
            {/* SSO Buttons */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleSSO('google')}
                disabled={!!ssoLoading}
                aria-label="Sign in with Google"
                className={`w-full flex items-center justify-center gap-3 border py-3 px-4 rounded-full font-medium transition-all duration-200 shadow-sm hover:scale-[1.03] hover:shadow-lg
                  ${ssoLoading === 'google' ? 'opacity-70 cursor-not-allowed' : 'bg-white hover:bg-[#f7fafc] text-gray-700 border-gray-300'}
                  focus:outline-none focus:ring-2 focus:ring-[#4285F4]`}
              >
                <span className="flex items-center justify-center shrink-0"><FaGoogle className="text-[#EA4335] w-5 h-5" /></span>
                <span className="flex-1 text-center">{ssoLoading === 'google' ? <FaSpinner className="animate-spin" /> : 'Continue with Google'}</span>
              </button>
              <button
                onClick={() => handleSSO('github')}
                disabled={!!ssoLoading}
                aria-label="Sign in with GitHub"
                className={`w-full flex items-center justify-center gap-3 border py-3 px-4 rounded-full font-medium transition-all duration-200 shadow-sm hover:scale-[1.03] hover:shadow-lg
                  ${ssoLoading === 'github' ? 'opacity-70 cursor-not-allowed' : 'bg-[#24292F] hover:bg-[#1b1f23] text-white border-gray-800'}
                  focus:outline-none focus:ring-2 focus:ring-[#24292F]`}
              >
                <span className="flex items-center justify-center shrink-0"><FaGithub className="w-5 h-5" /></span>
                <span className="flex-1 text-center">{ssoLoading === 'github' ? <FaSpinner className="animate-spin" /> : 'Continue with GitHub'}</span>
              </button>
              <button
                onClick={() => handleSSO('microsoft')}
                disabled={!!ssoLoading}
                aria-label="Sign in with Microsoft"
                className={`w-full flex items-center justify-center gap-3 border py-3 px-4 rounded-full font-medium transition-all duration-200 shadow-sm hover:scale-[1.03] hover:shadow-lg
                  ${ssoLoading === 'microsoft' ? 'opacity-70 cursor-not-allowed' : 'bg-[#2F2F2F] hover:bg-[#0078D4] text-white border-gray-800'}
                  focus:outline-none focus:ring-2 focus:ring-[#0078D4]`}
              >
                <span className="flex items-center justify-center shrink-0"><FaMicrosoft className="text-[#F25022] w-5 h-5" /></span>
                <span className="flex-1 text-center">{ssoLoading === 'microsoft' ? <FaSpinner className="animate-spin" /> : 'Continue with Microsoft'}</span>
              </button>
            </div>
            {/* Modern Divider */}
            <div className="relative mb-4 flex items-center">
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-100 dark:from-gray-700 dark:via-blue-800 dark:to-gray-700" />
              <span className="mx-3 text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1"><svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#60a5fa" strokeWidth="2" fill="none" /></svg>or sign in with email</span>
              <div className="flex-1 h-px bg-gradient-to-l from-blue-200 via-blue-400 to-blue-100 dark:from-gray-700 dark:via-blue-800 dark:to-gray-700" />
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 focus:shadow-[0_0_0_2px_#60a5fa55]"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 focus:shadow-[0_0_0_2px_#60a5fa55]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400"
                    tabIndex={0}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Global Footer */}
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
}

export default Login;
