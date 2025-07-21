import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center flex-1 py-8 px-4 text-center">
        <img src="/logo2.png" alt="IncidentFlow Logo" className="w-72 h-32 mb-6 mx-auto drop-shadow-lg object-contain" />
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 dark:text-white mb-4 drop-shadow-lg">
          IncidentFlow
        </h1>
        <p className="text-xl md:text-2xl text-blue-700 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
          Streamline your incident management. Collaborate, resolve, and learn from every incident—faster than ever.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold text-lg shadow-lg hover:bg-blue-700 transition">
            Login
          </Link>
          <Link to="/signup" className="px-8 py-3 rounded-full bg-white text-blue-700 font-semibold text-lg shadow-lg border border-blue-600 hover:bg-blue-50 transition">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m4 4h1a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v7a2 2 0 002 2h1" /></svg>
          <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-white">Real-Time Collaboration</h3>
          <p className="text-gray-600 dark:text-gray-300">Work together with your team in real time to resolve incidents quickly and efficiently.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V7m0 4l-4-4m4 4l4-4" /></svg>
          <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-white">Automated Tracking</h3>
          <p className="text-gray-600 dark:text-gray-300">Track incidents, assignments, and resolutions automatically. Never miss a detail.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center">
          <svg className="w-12 h-12 text-purple-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-white">Insights & Analytics</h3>
          <p className="text-gray-600 dark:text-gray-300">Gain actionable insights from incident analytics to improve your processes and response times.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-gray-500 dark:text-gray-400 text-sm mt-auto">
        &copy; {new Date().getFullYear()} IncidentFlow. All rights reserved.
      </footer>
    </div>
  );
} 