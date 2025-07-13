import React from "react";
import { ShieldCheck } from "lucide-react";

const TermsOfService = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-100 via-white to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-xl rounded-2xl p-8 border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <ShieldCheck className="w-12 h-12 text-blue-600 mb-2" />
          <h1 className="text-3xl font-bold text-blue-900 dark:text-white mb-2 text-center">Terms of Service</h1>
        </div>
        <ol className="space-y-6 text-gray-700 dark:text-gray-200 text-base">
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">1. Acceptance of Terms</h3>
            <p>By accessing or using IncidentFlow, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">2. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">3. Prohibited Conduct</h3>
            <p>You agree not to misuse the service or help anyone else do so. Prohibited conduct includes, but is not limited to, violating any laws, infringing intellectual property, or distributing harmful content.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">4. Termination</h3>
            <p>We reserve the right to suspend or terminate your access to IncidentFlow at any time, without notice, for conduct that we believe violates these Terms or is harmful to other users.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">5. Changes to Terms</h3>
            <p>We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the new Terms.</p>
          </li>
        </ol>
      </div>
    </div>
    <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
      <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
    </footer>
  </div>
);

export default TermsOfService; 