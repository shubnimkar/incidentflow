import React, { useEffect, useState, useContext } from "react";
import { userApi } from "../services/api";
import { toast } from "react-hot-toast";
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import { FaCamera, FaTrash, FaEdit, FaCheck, FaTimes, FaLock, FaPlus, FaEye, FaEyeSlash, FaUser, FaGoogle, FaGithub, FaMicrosoft, FaEnvelope, FaPhone, FaClock, FaGlobe, FaMapMarkerAlt, FaUsers, FaUserShield, FaCalendarPlus, FaSignInAlt, FaTasks, FaChartLine } from 'react-icons/fa';
import timeZones from './timeZones'; // Assume a timeZones.js file exports an array of tz strings
import axios from 'axios';
import { incidentApi } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import Select from 'react-select';
import 'react-country-state-city/dist/react-country-state-city.css';
import { allCountries } from 'country-region-data';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash.debounce';
import { useLocation } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

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

function ProfileHeader() {
  return (
    <div className="flex items-center gap-4 mb-8 max-w-2xl">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50">
        <FaUser className="text-blue-600 text-2xl" />
      </span>
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Profile</h1>
        <nav className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Home / <span className="text-gray-700 dark:text-gray-200 font-semibold">User Profile</span>
        </nav>
      </div>
    </div>
  );
}

function getRoleBadge(role) {
  if (role === 'admin') {
    return <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold ml-2">Administrator</span>;
  }
  if (role === 'responder') {
    return <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">Responder</span>;
  }
  return <span className="inline-block px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold ml-2">{role || 'N/A'}</span>;
}

// Demo static data for country/state/city
const DEMO_LOCATION_DATA = [
  {
    label: 'India',
    value: 'IN',
    states: [
      {
        label: 'Maharashtra',
        value: 'MH',
        cities: [
          { label: 'Mumbai', value: 'Mumbai' },
          { label: 'Pune', value: 'Pune' },
          { label: 'Nagpur', value: 'Nagpur' },
        ],
      },
      {
        label: 'Karnataka',
        value: 'KA',
        cities: [
          { label: 'Bangalore', value: 'Bangalore' },
          { label: 'Mysore', value: 'Mysore' },
        ],
      },
    ],
  },
  {
    label: 'United States',
    value: 'US',
    states: [
      {
        label: 'California',
        value: 'CA',
        cities: [
          { label: 'Los Angeles', value: 'Los Angeles' },
          { label: 'San Francisco', value: 'San Francisco' },
        ],
      },
      {
        label: 'New York',
        value: 'NY',
        cities: [
          { label: 'New York City', value: 'New York City' },
          { label: 'Buffalo', value: 'Buffalo' },
        ],
      },
    ],
  },
  {
    label: 'United Kingdom',
    value: 'UK',
    states: [
      {
        label: 'England',
        value: 'ENG',
        cities: [
          { label: 'London', value: 'London' },
          { label: 'Manchester', value: 'Manchester' },
        ],
      },
      {
        label: 'Scotland',
        value: 'SCT',
        cities: [
          { label: 'Edinburgh', value: 'Edinburgh' },
          { label: 'Glasgow', value: 'Glasgow' },
        ],
      },
    ],
  },
];

// Use environment variable for GeoDB Cities API key
const GEO_API_KEY = process.env.REACT_APP_GEODB_API_KEY; // Set this in your .env file

const loadCityOptions = (inputValue, callback) => {
  if (!inputValue) {
    callback([]);
    return;
  }
  fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(inputValue)}&limit=10&sort=-population`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': GEO_API_KEY,
      'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
  })
    .then(res => res.json())
    .then(data => {
      const options = (data.data || []).map(city => ({
        label: `${city.city}, ${city.region}, ${city.country}`,
        value: city.city
      }));
      callback(options);
    })
    .catch(() => {
      callback([]);
    });
};

// Debounce the city loader to avoid rate limits
const debouncedLoadCityOptions = debounce(loadCityOptions, 500);

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'do not disturb', label: 'Do Not Disturb' },
  { value: 'be right back', label: 'Be Right Back' },
  { value: 'appear away', label: 'Appear Away' },
  { value: 'appear offline', label: 'Appear Offline' },
];

const STATUS_COLORS = {
  available: 'bg-green-500',
  busy: 'bg-red-500',
  'do not disturb': 'bg-pink-500',
  'be right back': 'bg-yellow-500',
  'appear away': 'bg-orange-400',
  'appear offline': 'bg-gray-400',
};

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
  const fileInputRef = React.useRef();
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountryCode, setEditCountryCode] = useState(COUNTRY_CODES[0].code);
  const [teams, setTeams] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [assignedCases, setAssignedCases] = useState([]);
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState(null);
  const [editState, setEditState] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [status, setStatus] = useState('available');
  const [editStatus, setEditStatus] = useState(STATUS_OPTIONS[0]);
  const { token, user: authUser } = useAuth() || {};
  // Helper to check if a provider is linked
  const isLinked = (provider) => {
    if (!user) return false;
    if (provider === 'google') return !!user.googleId || (user.socialAccounts && user.socialAccounts.some(acc => acc.provider === 'google'));
    if (provider === 'github') return !!user.githubId || (user.socialAccounts && user.socialAccounts.some(acc => acc.provider === 'github'));
    if (provider === 'microsoft') return !!user.microsoftId || (user.socialAccounts && user.socialAccounts.some(acc => acc.provider === 'microsoft'));
    return false;
  };
  // Helper to get link URL
  const getLinkUrl = (provider) => {
    const jwt = token || localStorage.getItem('token');
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    if (provider === 'google' || provider === 'github' || provider === 'microsoft') {
      const state = encodeURIComponent(JSON.stringify({ link: true, token: jwt }));
      return `${backendUrl}/api/auth/${provider}?state=${state}`;
    }
    return `${backendUrl}/api/auth/${provider}?link=1&token=${jwt}`;
  };

  const TABS = [
    { label: 'Contact Information', key: 'contact' },
    // Future: { label: 'Notification Rules', key: 'notifications' }, ...
  ];

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('link') === 'success') {
      toast.success('Social account linked successfully!');
    } else if (params.get('link') === 'error') {
      toast.error('Failed to link social account.');
    }
  }, [location.search]);

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
        setEditCity(res.data.city || '');
        setEditCountry(res.data.country || '');
        setStatus(res.data.status || 'available');
        const foundStatus = STATUS_OPTIONS.find(opt => opt.value === (res.data.status || 'available'));
        setEditStatus(foundStatus || STATUS_OPTIONS[0]);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phones?.[0]?.value ? user.phones[0].value.replace(/^\+\d+\s*/, '') : "");
      setEditTimezone(user.timezone || "");
      setEditTitle(user.title || "");
      setEditBio(user.bio || "");
      // Set country code if phone exists
      if (user.phones?.[0]?.value) {
        const match = COUNTRY_CODES.find(c => user.phones[0].value.startsWith(c.code));
        setEditCountryCode(match ? match.code : COUNTRY_CODES[0].code);
      } else {
        setEditCountryCode(COUNTRY_CODES[0].code);
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await userApi.get('/teams');
        setTeams(res.data);
      } catch (err) {
        setTeams([]);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (user && teams.length > 0) {
      const myTeams = teams.filter(team => team.members.some(m => m._id === user._id));
      setUserTeams(myTeams);
    }
  }, [user, teams]);

  useEffect(() => {
    const fetchAssignedCases = async () => {
      if (!user) return;
      try {
        const res = await incidentApi.get('/incidents');
        // Filter for cases where assignedTo matches user._id
        const myCases = res.data.filter(inc => {
          if (!inc.assignedTo) return false;
          if (typeof inc.assignedTo === 'object') {
            return inc.assignedTo._id === user._id;
          }
          return inc.assignedTo === user._id;
        });
        setAssignedCases(myCases);
      } catch (err) {
        setAssignedCases([]);
      }
    };
    fetchAssignedCases();
  }, [user]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      try {
        const res = await userApi.get('/logs/recent'); // Assuming a logs endpoint
        setRecentActivity(res.data);
      } catch (err) {
        setRecentActivity([]);
      }
    };
    fetchRecentActivity();
  }, [user]);

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
    setEditCity(user.city || '');
    setEditCountry(user.country || '');
    setEditState(user.state || null);
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
    if (field === 'city') update = { city: editCity };
    if (field === 'country') update = { country: editCountry };
    try {
      const res = await userApi.put('/me', update);
      setUser(res.data);
      toast.success('Profile updated');
      setEditField(null);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  // Avatar upload handler (placeholder)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implement actual upload logic
      toast.success('Avatar selected: ' + file.name);
    }
  };

  const handleEditProfile = () => setEditMode(true);
  const handleCancelEdit = () => {
    setEditName(user.name || "");
    setEditPhone(user.phones?.[0]?.value || "");
    setEditTimezone(user.timezone || "");
    setEditTitle(user.title || "");
    setEditBio(user.bio || "");
    setEditCity(user.city || '');
    setEditCountry(user.country || '');
    setEditState(user.state || null);
    setEditMode(false);
  };
  // In editMode, always save and verify the full international number
  const getFullPhoneNumber = () => {
    // Remove any leading country code from newPhone, then prepend selectedCountryCode
    let number = newPhone.replace(/^\+?[0-9]*/, '');
    return selectedCountryCode + number;
  };

  // When entering edit mode, parse the stored phone number
  useEffect(() => {
    if (editMode && user?.phones?.[0]?.value) {
      const match = COUNTRY_CODES.find(c => user.phones[0].value.startsWith(c.code));
      if (match) {
        setSelectedCountryCode(match.code);
        setLocalPhone(user.phones[0].value.replace(match.code, ''));
      } else {
        setSelectedCountryCode(COUNTRY_CODES[0].code);
        setLocalPhone(user.phones[0].value);
      }
    } else if (editMode) {
      setSelectedCountryCode(COUNTRY_CODES[0].code);
      setLocalPhone('');
    }
    // eslint-disable-next-line
  }, [editMode]);

  // Add state for phone error and verification UI
  const [phoneSaveError, setPhoneSaveError] = useState('');
  const [showPhoneVerificationUI, setShowPhoneVerificationUI] = useState(false);

  const handleSaveEdit = async () => {
    try {
      setPhoneSaveError('');
      const fullPhone = localPhone ? (selectedCountryCode + localPhone) : '';
      if (fullPhone && !isValidE164(fullPhone)) {
        toast.error('Please enter a valid phone number in international format (e.g., +919876543210)');
        return;
      }
      let countryString = '';
      if (typeof editCountry === 'string') {
        countryString = editCountry;
      } else if (editCountry && typeof editCountry === 'object') {
        countryString = editCountry.value || editCountry.label || '';
      }
      const payload = {
        name: editName,
        timezone: editTimezone,
        phones: fullPhone ? [{ value: fullPhone }] : [],
        title: editTitle,
        bio: editBio,
        city: editCity || '',
        country: countryString,
        status: editStatus.value,
      };
      // Debug log for payload
      console.log('Profile update payload:', payload);
      await userApi.put("/me", payload);
      // Refetch the latest user profile
      const res = await userApi.get("/me");
      setUser(res.data);
      setEditName(res.data.name || "");
      setEditTitle(res.data.title || "");
      setEditStatus(STATUS_OPTIONS.find(opt => opt.value === (res.data.status || 'available')) || STATUS_OPTIONS[0]);
      setLocalPhone(res.data.phones?.[0]?.value ? res.data.phones[0].value.replace(selectedCountryCode, '') : '');
      // ...update other local state as needed...
      setSavedPhone(fullPhone);
      // If phone is unique and not verified, show verification UI
      if (fullPhone && res.data.phones?.[0]?.value === fullPhone && !res.data.phones[0].verified) {
        setShowPhoneVerificationUI(true);
      } else {
        setShowPhoneVerificationUI(false);
      }
      toast.success("Profile updated successfully!");
      setEditMode(false);
      setStatus(res.data.status || 'available');
    } catch (err) {
      // If phone already in use, show error and do not show verification UI
      if (err.response?.data?.message && err.response.data.message.includes('already in use')) {
        setPhoneSaveError(err.response.data.message);
        setShowPhoneVerificationUI(false);
        toast.error(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || "Failed to update profile");
      }
    }
  };

  // Add unlinkSocial function
  const handleUnlinkSocial = async (provider) => {
    try {
      setSaving(true);
      const res = await userApi.post(`/me/unlink-social`, { provider });
      setUser(res.data.user);
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked!`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to unlink ${provider} account`);
    } finally {
      setSaving(false);
    }
  };

  // Add state for verification
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [emailVerifyError, setEmailVerifyError] = useState('');
  const [phoneVerifyError, setPhoneVerifyError] = useState('');
  // Add state to track if code was sent
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  // Add handlers for verification
  const handleSendEmailVerification = async () => {
    setVerifyingEmail(true);
    setEmailVerifyError('');
    try {
      await userApi.post('/resend-email-verification', { email: user?.email });
      toast.success('Verification email sent!');
    } catch (err) {
      setEmailVerifyError(err.response?.data?.message || 'Failed to send verification email');
    } finally {
      setVerifyingEmail(false);
    }
  };
  const handleVerifyEmailCode = async () => {
    setVerifyingEmail(true);
    setEmailVerifyError('');
    try {
      await userApi.post('/verify-email', { email: user?.email, code: emailCode });
      toast.success('Email verified!');
      // Refetch user profile
      const res = await userApi.get('/me');
      setUser(res.data);
      setEmailCode('');
    } catch (err) {
      setEmailVerifyError(err.response?.data?.message || 'Invalid code');
    } finally {
      setVerifyingEmail(false);
    }
  };
  const handleSendPhoneVerification = async () => {
    setVerifyingPhone(true);
    setPhoneVerifyError('');
    try {
      const fullPhone = getFullPhoneNumber();
      if (!isValidE164(fullPhone)) {
        toast.error('Please enter a valid phone number in international format (e.g., +919876543210)');
        setVerifyingPhone(false);
        return;
      }
      await userApi.post('/send-phone-verification', { phone: fullPhone });
      toast.success('Verification SMS sent!');
    } catch (err) {
      setPhoneVerifyError(err.response?.data?.message || 'Failed to send verification SMS');
    } finally {
      setVerifyingPhone(false);
    }
  };
  const handleVerifyPhoneCode = async () => {
    setVerifyingPhone(true);
    setPhoneVerifyError('');
    try {
      const fullPhone = localPhone ? (selectedCountryCode + localPhone) : '';
      if (!isValidE164(fullPhone)) {
        toast.error('Please enter a valid phone number in international format (e.g., +919876543210)');
        setVerifyingPhone(false);
        return;
      }
      await userApi.post('/verify-phone', { phone: fullPhone, code: phoneCode });
      toast.success('Phone verified!');
      // Refetch user profile
      const res = await userApi.get('/me');
      setUser(res.data);
      setPhoneCode('');
      setShowPhoneVerificationUI(false); // Hide verification UI after success
    } catch (err) {
      setPhoneVerifyError(err.response?.data?.message || 'Invalid code');
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Add state for editing/adding phone
  const [phoneSource, setPhoneSource] = useState(''); // 'sso' or 'user'

  useEffect(() => {
    // Detect if phone is from SSO (e.g., user.phones[0].source === 'sso')
    if (user?.phones?.[0]) {
      setNewPhone(user.phones[0].value);
      setPhoneSource(user.phones[0].source || 'user');
    } else {
      setNewPhone('');
      setPhoneSource('');
    }
  }, [user]);

  const handleSavePhone = async () => {
    try {
      const payload = {
        ...user,
        phones: [{ value: newPhone, source: phoneSource || 'user' }],
      };
      const res = await userApi.put('/me', payload);
      setUser(res.data);
      toast.success('Phone updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phone');
    }
  };

  // Track the last saved phone number
  const [savedPhone, setSavedPhone] = useState('');

  // Update savedPhone whenever user profile is loaded/refetched
  useEffect(() => {
    setSavedPhone(user?.phones?.[0]?.value || '');
  }, [user]);

  const handleSendPhoneCode = async () => {
    setVerifyingPhone(true);
    setPhoneVerifyError('');
    try {
      const fullPhone = localPhone ? (selectedCountryCode + localPhone) : '';
      if (!isValidE164(fullPhone)) {
        toast.error('Please enter a valid phone number in international format (e.g., +919876543210)');
        setVerifyingPhone(false);
        return;
      }
      // If the phone number has changed, save the profile first
      if (fullPhone !== savedPhone) {
        let countryString = '';
        if (typeof editCountry === 'string') {
          countryString = editCountry;
        } else if (editCountry && typeof editCountry === 'object') {
          countryString = editCountry.value || editCountry.label || '';
        }
        const payload = {
          name: editName,
          timezone: editTimezone,
          phones: fullPhone ? [{ value: fullPhone }] : [],
          title: editTitle,
          bio: editBio,
          city: editCity || '',
          country: countryString,
          status: editStatus.value,
        };
        await userApi.put("/me", payload);
        // Refetch the latest user profile
        const res = await userApi.get("/me");
        setUser(res.data);
        setSavedPhone(fullPhone);
      }
      await userApi.post('/send-phone-verification', { phone: fullPhone });
      toast.success('Verification code sent!');
      setPhoneCodeSent(true);
    } catch (err) {
      setPhoneVerifyError(err.response?.data?.message || 'Failed to send verification SMS');
    } finally {
      setVerifyingPhone(false);
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

  // Debug logging for country data
  console.log('allCountries:', allCountries);
  // Build country options from country-region-data
  const countryOptions = allCountries.map(countryArr => ({
    label: countryArr[0], // countryName
    value: countryArr[1], // countryShortCode
  }));
  console.log('countryOptions:', countryOptions);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      {/* Header Card */}
      <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col md:flex-row items-center gap-8 mb-8">
        <div className="relative">
          <img
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&size=128`}
            className="w-32 h-32 rounded-full border-4 border-blue-100 shadow object-cover"
            alt="Avatar"
          />
          {/* Status indicator */}
          <span className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 ${STATUS_COLORS[status] || 'bg-green-500'}`}></span>
        </div>
        <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.name || 'User Name'}</h2>
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{user?.role || 'User'}</span>
            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">{STATUS_OPTIONS.find(opt => opt.value === status)?.label || 'Available'}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="px-4 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="Edit profile"
              type="button"
              onClick={handleEditProfile}
              disabled={editMode}
            >
              Edit Profile
            </button>
            <button
              className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              aria-label="Change profile picture"
              type="button"
            >
              Change Avatar
            </button>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="w-full max-w-3xl mx-auto">
        <Tabs>
          <TabList>
            <Tab>Profile</Tab>
            <Tab>Security</Tab>
            <Tab>Activity</Tab>
          </TabList>
          {/* Profile Tab */}
          <TabPanel>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FaUser /> Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  <span className="font-semibold">Full Name:</span>
                  {editMode ? (
                    <input className="border rounded px-2 py-1 ml-2 flex-1" value={editName} onChange={e => setEditName(e.target.value)} />
                  ) : (
                    <span className="ml-2">{user?.name || 'N/A'}</span>
                  )}
                </div>
                {/* Title */}
                <div className="flex items-center gap-2">
                  <FaEdit className="text-gray-400" />
                  <span className="font-semibold">Title/Status:</span>
                  {editMode ? (
                    <input className="border rounded px-2 py-1 ml-2 flex-1" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                  ) : (
                    <span className="ml-2">{user?.title || 'N/A'}</span>
                  )}
                </div>
                {/* Bio */}
                <div className="flex items-center gap-2 md:col-span-2">
                  <FaEdit className="text-gray-400" />
                  <span className="font-semibold">Bio:</span>
                  {editMode ? (
                    <input className="border rounded px-2 py-1 ml-2 flex-1" value={editBio} onChange={e => setEditBio(e.target.value)} />
                  ) : (
                    <span className="ml-2">{user?.bio || 'N/A'}</span>
                  )}
                </div>
                {/* Email */}
                <div className="flex items-center gap-2 flex-wrap">
                  <FaEnvelope className="text-gray-400" />
                  <span className="font-semibold">Email:</span>
                  <span className="ml-2">{user?.email || 'N/A'}</span>
                  {/* SSO users: always show Verified, no verification UI */}
                  {user?.ssoProvider && user.ssoProvider !== 'local' ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">Verified</span>
                  ) : (() => {
                    const emailObj = (user?.emails || []).find(e => e.value === user?.email);
                    if (emailObj && emailObj.verified) {
                      return <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">Verified</span>;
                    } else {
                      return (
                        <div className="flex items-center gap-2 ml-2 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Unverified</span>
                          <button
                            className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                            onClick={handleSendEmailVerification}
                            disabled={verifyingEmail}
                          >
                            {verifyingEmail ? 'Sending...' : 'Send Code'}
                          </button>
                          <input
                            className="border rounded px-2 py-0.5 text-xs w-24"
                            placeholder="Enter code"
                            value={emailCode}
                            onChange={e => setEmailCode(e.target.value)}
                          />
                          <button
                            className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200"
                            onClick={handleVerifyEmailCode}
                            disabled={verifyingEmail || !emailCode}
                          >
                            Verify Code
                          </button>
                          {emailVerifyError && <span className="text-xs text-red-500">{emailVerifyError}</span>}
                        </div>
                      );
                    }
                  })()}
                </div>
                {/* Phone */}
                <div className="flex items-center gap-2 flex-wrap">
                  <FaPhone className="text-gray-400" />
                  <span className="font-semibold">Phone:</span>
                  {editMode ? (
                    <>
                      <select
                        className="border rounded px-2 py-0.5 text-xs w-20"
                        value={selectedCountryCode}
                        onChange={e => setSelectedCountryCode(e.target.value)}
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                        ))}
                      </select>
                      <input
                        className="border rounded px-2 py-0.5 text-xs w-32"
                        placeholder="Enter mobile number"
                        value={localPhone}
                        onChange={e => setLocalPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                      {phoneSource === 'sso' && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold ml-2">From SSO</span>
                      )}
                      {phoneSaveError && <span className="text-xs text-red-500 ml-2">{phoneSaveError}</span>}
                    </>
                  ) : (
                    <>
                      <span className="ml-2">{user?.phones?.length ? user.phones[0].value : 'N/A'}</span>
                      {phoneSource === 'sso' && (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold ml-2">From SSO</span>
                      )}
                    </>
                  )}
                  {/* Show verification UI only if phone is not verified and showPhoneVerificationUI is true */}
                  {user?.phones?.[0]?.verified ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">Verified</span>
                  ) : showPhoneVerificationUI ? (
                    <div className="flex items-center gap-2 ml-2 flex-wrap">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Unverified</span>
                      <button
                        className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                        onClick={handleSendPhoneCode}
                        disabled={verifyingPhone || !localPhone}
                      >
                        {verifyingPhone ? 'Sending...' : 'Send Code'}
                      </button>
                      <input
                        className="border rounded px-2 py-0.5 text-xs w-24"
                        placeholder="Enter code"
                        value={phoneCode}
                        onChange={e => setPhoneCode(e.target.value)}
                      />
                      <button
                        className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200"
                        onClick={handleVerifyPhoneCode}
                        disabled={verifyingPhone || !phoneCode}
                      >
                        Verify Code
                      </button>
                      {phoneVerifyError && <span className="text-xs text-red-500">{phoneVerifyError}</span>}
                    </div>
                  ) : null}
                </div>
                {/* Status */}
                <div className="flex items-center gap-2">
                  <FaCheck className="text-gray-400" />
                  <span className="font-semibold">Status:</span>
                  {editMode ? (
                    <Select
                      options={STATUS_OPTIONS}
                      value={editStatus}
                      onChange={setEditStatus}
                      className="w-48 ml-2"
                      placeholder="Select status"
                    />
                  ) : (
                    <span className="ml-2">{STATUS_OPTIONS.find(opt => opt.value === status)?.label || 'Available'}</span>
                  )}
                </div>
                {/* Timezone */}
                <div className="flex items-center gap-2">
                  <FaClock className="text-gray-400" />
                  <span className="font-semibold">Timezone:</span>
                  {editMode ? (
                    <select className="border rounded px-2 py-1 ml-2 flex-1" value={editTimezone} onChange={e => setEditTimezone(e.target.value)}>
                      {timeZones.map(tz => {
                        const parts = tz.split('/');
                        const label = parts.length > 1 ? `${tz} (${parts[1].replace('_', ' ')})` : tz;
                        return (
                          <option key={tz} value={tz}>{label}</option>
                        );
                      })}
                    </select>
                  ) : (
                    <span className="ml-2">{user?.timezone || 'N/A'}</span>
                  )}
                </div>
                {/* Country */}
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-gray-400" />
                  <span className="font-semibold">Country:</span>
                  {editMode ? (
                    <Select
                      options={countryOptions}
                      value={editCountry}
                      onChange={option => setEditCountry(option)}
                      placeholder="Select country"
                      className="w-48 ml-2"
                    />
                  ) : (
                    <span className="ml-2">{user?.country || 'N/A'}</span>
                  )}
                </div>
                {/* City */}
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span className="font-semibold">City:</span>
                  {editMode ? (
                    <input
                      className="border rounded px-2 py-1 ml-2 flex-1"
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      placeholder="Enter city"
                    />
                  ) : (
                    <span className="ml-2">{user?.city || 'N/A'}</span>
                  )}
                </div>
              </div>
              {editMode && (
                <div className="flex gap-2 mt-6 justify-end">
                  <button className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700" onClick={handleSaveEdit} type="button">Save</button>
                  <button className="px-4 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={handleCancelEdit} type="button">Cancel</button>
                </div>
              )}
            </div>
            {/* Add after the main profile info grid in the Profile Tab */}
            <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl shadow p-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FaUser /> Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teams */}
                <div className="flex items-center gap-2">
                  <FaUsers className="text-gray-400" />
                  <span className="font-semibold">Teams:</span>
                  {userTeams.length > 0 ? (
                    <span className="ml-2">{userTeams.map(t => t.name).join(', ')}</span>
                  ) : (
                    <span className="ml-2 text-gray-400">No teams</span>
                  )}
                </div>
                {/* Role */}
                <div className="flex items-center gap-2">
                  <FaUserShield className="text-gray-400" />
                  <span className="font-semibold">Role:</span>
                  <span className="ml-2">{user?.role || 'N/A'}</span>
                </div>
                {/* Account Created */}
                <div className="flex items-center gap-2">
                  <FaCalendarPlus className="text-gray-400" />
                  <span className="font-semibold">Account Created:</span>
                  <span className="ml-2">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
                {/* Last Login */}
                <div className="flex items-center gap-2">
                  <FaSignInAlt className="text-gray-400" />
                  <span className="font-semibold">Last Login:</span>
                  <span className="ml-2">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span>
                </div>
                {/* Assigned Cases */}
                <div className="flex items-center gap-2">
                  <FaTasks className="text-gray-400" />
                  <span className="font-semibold">Assigned Cases:</span>
                  <span className="ml-2">{assignedCases.length}</span>
                </div>
                {/* Efficiency */}
                <div className="flex items-center gap-2">
                  <FaChartLine className="text-gray-400" />
                  <span className="font-semibold">Efficiency:</span>
                  <span className="ml-2">{assignedCases.length > 0 ? `${Math.round((assignedCases.filter(c => c.status === 'resolved').length / assignedCases.length) * 100)}%` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </TabPanel>
          {/* Security Tab */}
          <TabPanel>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FaLock /> Security</h3>
              {/* Password change */}
              <div className="mb-4">
                <button
                  className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
                </button>
                {showPasswordForm && (
                  <form className="mt-4 space-y-2" onSubmit={handlePasswordChange}>
                    <input
                      type="password"
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Old Password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      className="border rounded px-2 py-1 w-full"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? 'Saving...' : 'Save Password'}
                    </button>
                  </form>
                )}
              </div>
              {/* Social logins */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Social Accounts</h4>
                <div className="flex gap-4">
                  {/* Google */}
                  <div className="flex items-center gap-2">
                    <FaGoogle className="text-red-500 text-xl" />
                    {isLinked('google') ? (
                      <>
                        <span className="text-green-600 font-semibold">Linked</span>
                        <button
                          className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200"
                          onClick={() => handleUnlinkSocial('google')}
                          disabled={saving}
                        >
                          {saving ? 'Unlinking...' : 'Unlink'}
                        </button>
                      </>
                    ) : (
                      <a
                        href={getLinkUrl('google')}
                        className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                      >
                        Link
                      </a>
                    )}
                  </div>
                  {/* Microsoft */}
                  <div className="flex items-center gap-2">
                    <FaMicrosoft className="text-blue-700 text-xl" />
                    {isLinked('microsoft') ? (
                      <>
                        <span className="text-green-600 font-semibold">Linked</span>
                        <button
                          className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200"
                          onClick={() => handleUnlinkSocial('microsoft')}
                          disabled={saving}
                        >
                          {saving ? 'Unlinking...' : 'Unlink'}
                        </button>
                      </>
                    ) : (
                      <a
                        href={getLinkUrl('microsoft')}
                        className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                      >
                        Link
                      </a>
                    )}
                  </div>
                  {/* GitHub */}
                  <div className="flex items-center gap-2">
                    <FaGithub className="text-gray-800 text-xl" />
                    {isLinked('github') ? (
                      <>
                        <span className="text-green-600 font-semibold">Linked</span>
                        <button
                          className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200"
                          onClick={() => handleUnlinkSocial('github')}
                          disabled={saving}
                        >
                          {saving ? 'Unlinking...' : 'Unlink'}
                        </button>
                      </>
                    ) : (
                      <a
                        href={getLinkUrl('github')}
                        className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                      >
                        Link
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {/* 2FA (placeholder) */}
              <div>
                <h4 className="font-semibold mb-2">Two-Factor Authentication</h4>
                <div className="text-gray-500">(2FA setup coming soon...)</div>
              </div>
            </div>
          </TabPanel>
          {/* Activity Tab */}
          <TabPanel>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FaClock /> Recent Activity</h3>
              {recentActivity.length > 0 ? (
                <ul className="list-disc ml-6 space-y-1">
                  {recentActivity.map(log => (
                    <li key={log._id}>{log.action} - {new Date(log.timestamp).toLocaleString()}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-400">No recent activity.</div>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile; 