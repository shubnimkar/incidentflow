import React from "react";
import { Lock } from "lucide-react";

const PrivacyPolicy = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-100 via-white to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-xl rounded-2xl p-8 border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <Lock className="w-12 h-12 text-blue-600 mb-2" />
          <h1 className="text-3xl font-bold text-blue-900 dark:text-white mb-2 text-center">Privacy Policy</h1>
        </div>
        <ol className="space-y-6 text-gray-700 dark:text-gray-200 text-base">
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or use our services.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">2. How We Use Information</h3>
            <p>We use your information to provide, maintain, and improve our services, communicate with you, and ensure security.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">3. Sharing of Information</h3>
            <p>We do not share your personal information with third parties except as necessary to provide our services, comply with the law, or protect our rights.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">4. Data Security</h3>
            <p>We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure.</p>
          </li>
          <li>
            <h3 className="font-semibold text-blue-700 mb-1">5. Changes to This Policy</h3>
            <p>We may update this Privacy Policy from time to time. Continued use of the service after changes constitutes acceptance of the new policy.</p>
          </li>
        </ol>
      </div>
    </div>
    <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
      <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
    </footer>
  </div>
);

export default PrivacyPolicy; 