import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      toast.error('Authentication failed');
      return;
    }

    if (token) {
      handleAuthSuccess(token);
    } else {
      setStatus('error');
      toast.error('No authentication token received');
    }
  }, [searchParams]);

  const handleAuthSuccess = async (token) => {
    try {
      // Store the token and user info
      await login(token);
      setStatus('success');
      toast.success('Successfully signed in!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setStatus('error');
      toast.error('Failed to complete authentication');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <FaSpinner className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing Sign In</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we complete your authentication...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <FaCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-600">Successfully Signed In!</h2>
            <p className="text-gray-600 dark:text-gray-400">Redirecting you to the dashboard...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <FaExclamationTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Authentication Failed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an issue completing your sign in. Please try again.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Login
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <FaSpinner className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Authentication
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Completing your sign in process
            </p>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 