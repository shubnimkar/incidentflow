import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { userApi } from '../services/api';

const errorMessages = {
  oauth_failed: 'There was a problem signing in with the provider. Please try again or use another method.',
  no_user: 'No user account was returned from the provider. Please try again or contact support.',
  no_email: 'Your provider did not return an email address. Please use another sign-in method or contact support.',
  account_exists: 'An account with this email already exists. Please sign in with your email and password, or link your account in profile settings.',
};

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorKey, setErrorKey] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (error) {
      setStatus('error');
      setErrorKey(error);
      toast.error(errorMessages[error] || 'Authentication failed. Please try again.');
      return;
    }

    if (token) {
      handleAuthSuccess(token, provider);
    } else {
      setStatus('error');
      setErrorKey('unknown');
      toast.error('No authentication token received. Please try again.');
    }
  }, [searchParams]);

  const handleAuthSuccess = async (token, provider) => {
    try {
      const user = await login(token);
      setStatus('success');
      // Show provider-specific welcome toast
      if (provider) {
        let icon = '';
        let name = '';
        if (provider === 'google') { icon = '🌐'; name = 'Google'; }
        if (provider === 'github') { icon = '🐙'; name = 'GitHub'; }
        if (provider === 'microsoft') { icon = '🪟'; name = 'Microsoft'; }
        toast.success(`Welcome, you're signed in with ${name}!`, { icon });
      } else {
        toast.success('Successfully signed in!');
      }
      // Remove profile completion check
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (error) {
      setStatus('error');
      setErrorKey('unknown');
      toast.error('Failed to complete authentication. Please try again.');
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
              {errorMessages[errorKey] || 'There was an issue completing your sign in. Please try again.'}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors mb-2"
            >
              Back to Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
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