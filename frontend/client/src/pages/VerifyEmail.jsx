import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await authApi.get(`/verify-email/${token}`);
      setStatus('success');
      setMessage(response.data.message);
      toast.success('Email verified successfully!');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed');
      toast.error('Email verification failed');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      await authApi.post('/resend-verification', { email });
      toast.success('Verification email sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="text-center">
            <FaSpinner className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <FaCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">Email Verified!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Continue to Login
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <FaExclamationTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">Need a new verification email?</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
                >
                  {isResending ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
                  {isResending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Back to Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create New Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
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
          {/* Glowing Logo */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-[400px] h-[400px] flex items-center justify-center mb-0 -mt-32">
              <img src={process.env.PUBLIC_URL + '/logo2.png'} alt="IncidentFlow Logo" className="max-w-full object-contain drop-shadow-xl animate-glow" style={{filter: 'drop-shadow(0 0 40px #60a5fa88)'}} />
            </div>
            {/* Animated Tagline */}
            <AnimatedTagline />
            <p className="text-base text-blue-900 dark:text-blue-200 mt-2 mb-8 text-center max-w-md mx-auto font-medium opacity-80">
              Verify your email to unlock the full power of IncidentFlow.
            </p>
          </div>
          {/* Floating shapes */}
          <div className="absolute top-20 left-10 w-6 h-6 bg-blue-400 rounded-full opacity-20 animate-float-slow z-0" />
          <div className="absolute bottom-24 right-24 w-8 h-8 bg-indigo-400 rounded-full opacity-10 animate-float-fast z-0" />
        </div>
        {/* Right Side (Verification Card) */}
        <div className="flex flex-1 items-stretch justify-center px-2">
          <div className="w-full max-w-md min-h-[600px] flex flex-col justify-center mt-12 py-8 px-6 rounded-2xl bg-white/70 dark:bg-gray-900/80 backdrop-blur shadow-xl border border-blue-100 dark:border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <FaEnvelope className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verification
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Verify your email to complete your registration
              </p>
            </div>
            {renderContent()}
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
};

export default VerifyEmail; 

// AnimatedTagline component for consistency
function AnimatedTagline() {
  const taglineFull = 'Incident management, reimagined for modern teams';
  const [typed, setTyped] = React.useState('');
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
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
  const before = 'Incident management, ';
  const highlight = 'reimagined';
  const after = ' for modern teams';
  if (!typed.includes(highlight)) {
    return <p className={`text-2xl -mt-12 mb-8 text-center max-w-xs transition-all duration-1000 ${done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}><span className="text-[#f97316] dark:text-[#fbbf24]">{typed}</span></p>;
  }
  const beforeText = typed.slice(0, before.length);
  const highlightText = typed.slice(before.length, before.length + highlight.length);
  const afterText = typed.slice(before.length + highlight.length);
  return (
    <p className={`text-2xl -mt-12 mb-8 text-center max-w-xs transition-all duration-1000 ${done ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <span className="text-[#f97316] dark:text-[#fbbf24]">{beforeText}</span>
      <span className="font-bold bg-gradient-to-r from-[#f97316] to-[#2563eb] text-transparent bg-clip-text animate-gradient-slow">{highlightText}</span>
      <span className="text-[#f97316] dark:text-[#fbbf24]">{afterText}</span>
    </p>
  );
} 