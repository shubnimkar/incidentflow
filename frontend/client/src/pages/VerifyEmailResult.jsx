import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const VerifyEmailResult = () => {
  const query = useQuery();
  const status = query.get('status');
  const reason = query.get('reason');
  const navigate = useNavigate();

  let message, subMessage, icon, color;
  if (status === 'success') {
    message = 'Email Verified!';
    subMessage = 'Your email has been successfully verified. You can now log in.';
    icon = '✅';
    color = 'text-green-600';
  } else {
    message = 'Verification Failed';
    if (reason === 'user_not_found') subMessage = 'User not found.';
    else if (reason === 'invalid_or_expired') subMessage = 'Invalid or expired verification link.';
    else if (reason === 'server_error') subMessage = 'Server error. Please try again later.';
    else subMessage = 'Verification could not be completed.';
    icon = '❌';
    color = 'text-red-600';
  }

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
        <div className={`text-5xl mb-4 ${color}`}>{icon}</div>
        <h2 className={`text-2xl font-bold mb-2 ${color}`}>{message}</h2>
        <div className="mb-6 text-gray-700 dark:text-gray-300 text-center">{subMessage}</div>
        {status === 'success' ? (
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailResult; 