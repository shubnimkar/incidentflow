import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { userApi } from "../services/api";
import { FaUser, FaEnvelope, FaGlobe, FaShareAlt, FaDownload, FaCalendarPlus, FaMapMarkerAlt, FaUserShield } from "react-icons/fa";
import { allCountries } from 'country-region-data';

// Helper to get flag emoji from country code
function getFlagEmoji(countryCode) {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt())
    );
}

const PublicProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await userApi.get(`/users/${id}`);
        setUser(res.data);
      } catch (err) {
        setError("User not found");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadVCard = () => {
    if (!user) return;
    let vcard = 'BEGIN:VCARD\nVERSION:3.0';
    vcard += `\nFN:${user.name || ''}`;
    vcard += `\nEMAIL:${user.email || ''}`;
    if (user.country) vcard += `\nADR:${user.country}`;
    if (user.timezone) vcard += `\nTZ:${user.timezone}`;
    if (user.title) vcard += `\nTITLE:${user.title}`;
    if (user.city) vcard += `\nLOCALITY:${user.city}`;
    vcard += '\nEND:VCARD';
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user?.name || 'contact'}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get country label and flag
  let countryLabel = user?.country || '';
  let countryFlag = '';
  if (user?.country) {
    const match = allCountries.find(c => c[0] === user.country || c[1] === user.country);
    if (match) {
      countryLabel = match[0];
      countryFlag = getFlagEmoji(match[1]);
    }
  }

  // Member since (joined date)
  let joined = null;
  if (user?.createdAt) {
    joined = new Date(user.createdAt).toLocaleDateString();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"><div className="text-red-600 text-lg">{error}</div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* White logo area at the top of the card (no gradient) */}
      <main className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-xl h-36 bg-white rounded-t-3xl mb-[-72px] shadow-lg flex items-start justify-center relative border-b border-gray-200 dark:border-gray-700">
          <img src="/logo.png" alt="Incident Flow Logo" className="h-10 w-auto mt-4 z-10" />
        </div>
        <div className="w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-800 p-6 flex flex-col items-center gap-4 relative z-10 backdrop-blur-md bg-gradient-to-br from-white via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300 hover:scale-[1.015] hover:shadow-3xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Avatar with ring */}
          <div className="relative -mt-4 mb-2">
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400 via-indigo-400 to-blue-600 blur-sm opacity-60 scale-110" />
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0D8ABC&color=fff&size=128`}
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover relative z-10"
              alt="Avatar"
            />
          </div>
          {/* Name with flag */}
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2 tracking-tight mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            <FaUser className="text-cyan-600 text-2xl" /> {user.name || 'User'} {countryFlag && <span className="text-2xl ml-1">{countryFlag}</span>}
          </h2>
          {/* Bio */}
          {user.bio && (
            <div className="text-slate-500 dark:text-gray-300 max-w-md text-base mb-2 text-center w-full" style={{ fontFamily: 'Inter, sans-serif' }}>{user.bio}</div>
          )}
          {/* Role */}
          {user.role && (
            <div className="flex items-center gap-2 text-lg text-cyan-600 dark:text-cyan-300 font-semibold mb-2 w-full pl-2">
              <FaUserShield className="text-cyan-600 text-xl" /> <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
            </div>
          )}
          {/* Info fields group */}
          <div className="flex flex-col items-start gap-3 w-full mb-4 pl-2">
            {/* Email */}
            {user.email && (
              <div className="flex items-center gap-2 text-lg text-slate-700 dark:text-gray-200">
                <FaEnvelope className="text-cyan-600 text-xl" /> <span>{user.email}</span>
              </div>
            )}
            {/* Location: city and country side by side */}
            {(user.city || countryLabel) && (
              <div className="flex items-center gap-2 text-lg text-slate-700 dark:text-gray-200">
                <FaMapMarkerAlt className="text-cyan-600 text-xl" />
                {user.city && <span>{user.city}</span>}
                {user.city && countryLabel && <span className="mx-1">|</span>}
                {countryLabel && <span>{countryLabel}</span>}
              </div>
            )}
            {/* Timezone */}
            {user.timezone && (
              <div className="flex items-center gap-2 text-lg text-slate-700 dark:text-gray-200">
                <FaGlobe className="text-cyan-600 text-xl" /> <span>{user.timezone}</span>
              </div>
            )}
            {/* Member since */}
            {joined && (
              <div className="flex items-center gap-2 text-lg text-slate-700 dark:text-gray-200 font-normal font-sans justify-start">
                <FaCalendarPlus className="text-cyan-600 text-xl" /> <span>Member since {joined}</span>
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
            <button
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-cyan-600 text-white font-semibold text-base shadow hover:bg-cyan-700 transition-all duration-200 w-full sm:w-auto font-sans"
              onClick={handleCopy}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <FaShareAlt /> {copied ? "Copied!" : "Share Profile"}
            </button>
            <button
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-teal-600 text-white font-semibold text-base shadow hover:bg-teal-700 transition-all duration-200 w-full sm:w-auto font-sans"
              onClick={handleDownloadVCard}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <FaDownload /> Download vCard
            </button>
          </div>
          {/* Card Footer */}
          <div className="w-full flex justify-center items-center pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-slate-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>&copy; {new Date().getFullYear()} Incident Flow. All rights reserved.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicProfile; 