import React, { useEffect, useState } from "react";
import { userApi } from "../services/api";
import { toast } from "react-hot-toast";
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import { FaCamera, FaTrash, FaEdit, FaCheck, FaTimes, FaLock, FaPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import timeZones from './timeZones'; // Assume a timeZones.js file exports an array of tz strings
import axios from 'axios';

const COUNTRY_CODES = [
  { code: '+1', label: '🇺🇸 US' },
  { code: '+44', label: '🇬🇧 UK' },
  { code: '+91', label: '🇮🇳 India' },
  { code: '+61', label: '🇦🇺 Australia' },
  { code: '+81', label: '🇯🇵 Japan' },
  { code: '+49', label: '🇩🇪 Germany' },
  { code: '+33', label: '🇫🇷 France' },
  { code: '+86', label: '🇨🇳 China' },
  { code: '+971', label: '🇦🇪 UAE' },
  { code: '+27', label: '🇿🇦 South Africa' },
  // ...add more as needed
];

function isValidE164(phone) {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "text-red-500" };
  if (score === 2 || score === 3) return { label: "Moderate", color: "text-yellow-500" };
  return { label: "Strong", color: "text-green-500" };
}

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [editField, setEditField] = useState(null);
  const [titleInput, setTitleInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [timezoneInput, setTimezoneInput] = useState('UTC');
  const [phones, setPhones] = useState([]);
  const [smsNumbers, setSmsNumbers] = useState([]);
  const [emails, setEmails] = useState([]);
  const [newPhone, setNewPhone] = useState('');
  const [newSms, setNewSms] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [editEmailIdx, setEditEmailIdx] = useState(null);
  const [editPhoneIdx, setEditPhoneIdx] = useState(null);
  const [addEmailMode, setAddEmailMode] = useState(false);
  const [addPhoneMode, setAddPhoneMode] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [verifyEmailIdx, setVerifyEmailIdx] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [resendingIdx, setResendingIdx] = useState(null);
  const [verifyPhoneIdx, setVerifyPhoneIdx] = useState(null);
  const [verifyPhoneCode, setVerifyPhoneCode] = useState('');
  const [resendingPhoneIdx, setResendingPhoneIdx] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0].code);
  const [localPhone, setLocalPhone] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState(null);

  const TABS = [
    { label: 'Contact Information', key: 'contact' },
    // Future: { label: 'Notification Rules', key: 'notifications' }, ...
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await userApi.get("/me");
        setUser(res.data);
        setNameInput(res.data.name || "");
        setTitleInput(res.data.title || '');
        setBioInput(res.data.bio || '');
        setTimezoneInput(res.data.timezone || 'UTC');
        setPhones(res.data.phones || []);
        setSmsNumbers(res.data.smsNumbers || []);
        setEmails(res.data.emails ? res.data.emails : [res.data.email]);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setNameInput(user.name || "");
    setTitleInput(user.title || '');
    setBioInput(user.bio || '');
    setTimezoneInput(user.timezone || 'UTC');
    setPhones(user.phones || []);
    setSmsNumbers(user.smsNumbers || []);
    setEmails(user.emails ? user.emails : [user.email]);
  };
  const handleSave = async () => {
    if (!nameInput.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      // 1. Save profile fields
      const res = await userApi.put("/me", { name: nameInput });
      let updatedUser = res.data;
      // 2. If new avatar, upload it
      if (croppedAvatarBlob) {
        const formData = new FormData();
        formData.append('avatar', croppedAvatarBlob, 'avatar.jpg');
        const avatarRes = await userApi.post('/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updatedUser = avatarRes.data.user;
        setCroppedAvatarBlob(null);
        setCacheBuster(Date.now());
      }
      setUser(updatedUser);
      setEditMode(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      await userApi.put("/me/password", { oldPassword, newPassword });
      toast.success("Password updated successfully");
      setShowPasswordForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setAvatarUploading(true);
    try {
      const res = await userApi.delete('/me/avatar');
      setUser(res.data.user);
      setCacheBuster(Date.now()); // Update cacheBuster after delete
      toast.success('Avatar deleted');
    } catch (err) {
      toast.error('Failed to delete avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveField = async (field) => {
    let update = {};
    if (field === 'title') update = { title: titleInput };
    if (field === 'bio') update = { bio: bioInput };
    if (field === 'timezone') update = { timezone: timezoneInput };
    if (field === 'phone') update = { phones };
    if (field === 'sms') update = { smsNumbers };
    if (field === 'email') update = { emails };
    try {
      const res = await userApi.put('/me', update);
      setUser(res.data);
      toast.success('Profile updated');
      setEditField(null);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow p-8 animate-pulse">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <>
      {/* Main Profile UI */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-2">
        <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col md:flex-row gap-8">
          {/* Left: Avatar */}
          <div className="flex flex-col items-center md:items-start md:justify-center md:w-1/3">
            <div className="relative group mb-4">
              <img
                src={
                  user.avatarUrl
                    ? `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}cb=${cacheBuster}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=0D8ABC&color=fff&size=128`
                }
                alt="Avatar"
                className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
              />
              {user.avatarUrl && (
                <button className="absolute top-1 right-1 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors border-2 border-white dark:border-gray-800" onClick={handleDeleteAvatar} disabled={avatarUploading} title="Delete Photo">
                  <FaTrash size={14} />
                </button>
              )}
              {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 rounded-full"><span className="text-xs text-gray-700 dark:text-gray-200">Uploading...</span></div>}
            </div>
          </div>
          {/* Right: Info stack */}
          <div className="flex-1 flex flex-col gap-4 justify-center">
            {/* Name */}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{user.name || <span className="italic text-gray-400">No name set</span>}</span>
              {editField !== 'name' && (
                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group" onClick={() => { setEditField('name'); setEditMode(true); }} title="Edit Name"><FaEdit size={18} className="opacity-60 group-hover:opacity-100" /></button>
              )}
            </div>
            {editField === 'name' && (
              <div className="flex items-center gap-2">
                <input type="text" className="border rounded px-2 py-1 text-base w-64 focus:ring-2 focus:ring-blue-400" value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus />
                <button className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" onClick={handleSave} title="Save"><FaCheck /></button>
                <button className="ml-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleCancel}><FaTimes /></button>
              </div>
            )}
            {/* Title */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">Title:</span>
              {editField === 'title' ? (
                <>
                  <input type="text" className="border rounded px-2 py-1 text-base w-64" value={titleInput} onChange={e => setTitleInput(e.target.value)} autoFocus />
                  <button className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" onClick={() => handleSaveField('title')}><FaCheck /></button>
                  <button className="ml-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setEditField(null)}><FaTimes /></button>
                </>
              ) : (
                <span className="text-blue-600 cursor-pointer">{user.title || "What's your title?"}</span>
              )}
              {editField !== 'title' && (
                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group" onClick={() => setEditField('title')} title="Edit Title"><FaEdit size={18} className="opacity-60 group-hover:opacity-100" /></button>
              )}
            </div>
            {/* Bio */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">Bio:</span>
              {editField === 'bio' ? (
                <>
                  <textarea className="border rounded px-2 py-1 text-base w-64" value={bioInput} onChange={e => setBioInput(e.target.value)} autoFocus />
                  <button className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" onClick={() => handleSaveField('bio')}><FaCheck /></button>
                  <button className="ml-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setEditField(null)}><FaTimes /></button>
                </>
              ) : (
                <span className="text-blue-600 cursor-pointer">{user.bio || ""}</span>
              )}
              {editField !== 'bio' && (
                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group" onClick={() => setEditField('bio')} title="Edit Bio"><FaEdit size={18} className="opacity-60 group-hover:opacity-100" /></button>
              )}
            </div>
            {/* Email */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">Email:</span>
              <span>{user.email}</span>
            </div>
            {/* Email Addresses */}
            <div className="mt-4">
              <div className="text-base font-bold mb-2">Email Addresses</div>
              <div className="flex flex-col gap-2">
                {emails.length === 0 && <div className="text-gray-400 italic">No email addresses added.</div>}
                {emails.map((emailObj, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span>{emailObj.value}</span>
                    {emailObj.verified ? (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Verified</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>
                    )}
                    {!emailObj.verified && (
                      <>
                        <button className="text-blue-600 underline text-xs ml-1" onClick={() => { setVerifyEmailIdx(idx); setVerifyCode(''); }}>Verify</button>
                        <button className="text-xs ml-1 text-gray-500 hover:text-blue-600" disabled={resendingIdx === idx} onClick={async () => {
                          setResendingIdx(idx);
                          try {
                            await userApi.post('/resend-email-verification', { email: emailObj.value });
                            toast.success('Verification email resent');
                          } catch {
                            toast.error('Failed to resend email');
                          }
                          setResendingIdx(null);
                        }}>Resend</button>
                      </>
                    )}
                    {emails.length > 1 && idx !== 0 && (
                      <button className="text-red-500" onClick={async () => {
                        try {
                          await userApi.delete('/me/email', { data: { email: emailObj.value } });
                          setEmails(emails.filter((_, i) => i !== idx));
                          toast.success('Email deleted');
                        } catch {
                          toast.error('Failed to delete email');
                        }
                      }}><FaTrash size={16} /></button>
                    )}
                  </div>
                ))}
                {/* Verification input modal/inline */}
                {verifyEmailIdx !== null && emails[verifyEmailIdx] && !emails[verifyEmailIdx].verified && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="text" className="border rounded px-2 py-1 text-xs w-32" placeholder="Enter code" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} autoFocus />
                    <button className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-xs" onClick={async () => {
                      try {
                        await userApi.post('/verify-email', { email: emails[verifyEmailIdx].value, code: verifyCode });
                        toast.success('Email verified!');
                        setVerifyEmailIdx(null);
                        // Refresh user/emails
                        const res = await userApi.get('/me');
                        setUser(res.data);
                        setEmails(res.data.emails);
                      } catch {
                        toast.error('Invalid or expired code');
                      }
                    }}>Submit</button>
                    <button className="ml-1 px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" onClick={() => setVerifyEmailIdx(null)}>Cancel</button>
                  </div>
                )}
                {/* Add email UI */}
                <div className="flex items-center gap-2 mt-2">
                  <input type="email" className="border rounded px-2 py-1 text-base w-64" placeholder="Add email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-semibold" onClick={async () => {
                    if (!newEmail) return;
                    const updated = [...emails, { value: newEmail, verified: false, pending: true }];
                    try {
                      const res = await userApi.put('/me', { emails: updated });
                      setUser(res.data);
                      setEmails(res.data.emails);
                      setNewEmail('');
                      toast.success('Email added');
                    } catch {
                      toast.error('Failed to add email');
                    }
                  }}>+ Add</button>
                </div>
              </div>
            </div>
            {/* Phone Numbers */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">Phone:</span>
              {phones.length === 0 && <span className="text-gray-400 italic">No phone numbers added.</span>}
              {phones.map((phoneObj, idx) => (
                <span key={idx} className="flex items-center gap-1 font-mono">
                  {phoneObj.value}
                  {phoneObj.verified ? (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">Verified</span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full ml-1">Pending</span>
                  )}
                </span>
              ))}
            </div>
            {/* Time Zone */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">Time Zone:</span>
              <span>{user.timezone || 'UTC'}</span>
            </div>
            {/* Current Time */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black dark:text-white">Current Time:</span>
              <span>{new Date().toLocaleTimeString()} (Your local time)</span>
            </div>
          </div>
        </div>
      </div>
      {/* Global Footer */}
      <footer className="w-full flex justify-center items-center text-xs text-blue-900/40 dark:text-gray-500 mt-4 mb-2 select-none">
        <span className="opacity-70">© {new Date().getFullYear()} IncidentFlow. All rights reserved.</span>
      </footer>
    </>
  );
};

export default UserProfile; 