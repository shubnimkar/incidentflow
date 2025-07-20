import React, { useEffect, useState, useContext, useRef } from "react";
import { userApi } from "../services/api";
import { toast } from "react-hot-toast";
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import { FaCamera, FaTrash, FaEdit, FaCheck, FaTimes, FaLock, FaPlus, FaEye, FaEyeSlash, FaUser, FaGoogle, FaGithub, FaMicrosoft, FaEnvelope, FaPhone, FaClock, FaGlobe, FaMapMarkerAlt, FaUsers, FaUserShield, FaCalendarPlus, FaSignInAlt, FaTasks, FaChartLine, FaRegEdit } from 'react-icons/fa';
import { FiShare2 } from 'react-icons/fi';
import { FiTrendingUp, FiBriefcase, FiUsers, FiUser, FiMail, FiCheckCircle, FiPhone, FiClock, FiMapPin, FiCalendar, FiShield } from 'react-icons/fi';
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
import getCroppedImg from '../utils/cropImage'; // Utility to get cropped image blob
import Footer from '../components/Footer';

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
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'do not disturb', label: 'Do Not Disturb', color: 'bg-pink-500' },
  { value: 'be right back', label: 'Be Right Back', color: 'bg-yellow-400' },
  { value: 'appear away', label: 'Appear Away', color: 'bg-orange-400' },
  { value: 'appear offline', label: 'Appear Offline', color: 'bg-gray-400' },
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
  const [status, setStatus] = useState('available');
  const [editStatus, setEditStatus] = useState(STATUS_OPTIONS[0]);
  const { token, user: authUser, setUser: setAuthUser } = useAuth() || {};
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

  // Fetch teams (make top-level for event listener)
    const fetchTeams = async () => {
      try {
        const res = await userApi.get('/teams');
        setTeams(res.data);
      } catch (err) {
        setTeams([]);
      }
    };
  // Fetch assigned cases (make top-level for event listener)
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

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (user && teams.length > 0) {
      const myTeams = teams.filter(team => team.members.some(m => m._id === user._id));
      setUserTeams(myTeams);
    }
  }, [user, teams]);

  useEffect(() => {
    fetchAssignedCases();
  }, [user]);

  useEffect(() => {
    // Listen for global profile data changes (e.g., team/case assignment)
    const handleProfileDataChanged = () => {
      fetchTeams();
      fetchAssignedCases();
    };
    window.addEventListener('profileDataChanged', handleProfileDataChanged);
    return () => window.removeEventListener('profileDataChanged', handleProfileDataChanged);
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
      setAuthUser(res.data.user); // <-- Update global user state
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

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setCropModalOpen(true);
    }
  };

  // On crop complete
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Upload cropped avatar
  const handleUploadCroppedAvatar = async () => {
    setAvatarUploading(true);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      const avatarRes = await userApi.post('/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(avatarRes.data.user);
      setAuthUser(avatarRes.data.user); // <-- Update global user state
      setCropModalOpen(false);
      setSelectedImage(null);
      toast.success('Avatar updated!');
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
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

  const [qrModalOpen, setQrModalOpen] = useState(false);
  // Helper to get frontend URL
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
  const profileUrl = user ? `${frontendUrl}/profile/${user._id}` : '';

  // Ensure all hooks are before any early return (if (loading) or if (error))
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    }
    if (statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusDropdownOpen]);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    setStatusDropdownOpen(false);
    try {
      await userApi.put('/me', { status: newStatus });
      // Optionally refetch user/profile if needed
    } catch (err) {
      toast.error('Failed to update status');
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
    <div className="min-h-screen bg-gray-50 px-4 py-10 font-inter">
      {/* Modern SaaS Profile Card */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-10 flex flex-col md:flex-row items-center md:items-start mb-10 border border-gray-100 gap-8 px-4 transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(124,58,237,0.15)]">
        {/* Avatar section (left) */}
        <div className="relative mb-6 md:mb-0 md:mr-8 flex-shrink-0 w-36 h-36">
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 p-1 shadow-lg">
            <img
              src={user?.avatarUrl && user.avatarUrl.trim() !== '' ? user.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff&size=128`}
              className="w-full h-full rounded-full object-cover border-4 border-white"
              alt="Avatar"
            />
          </div>
          {/* Status dot overlay */}
          <span
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg
              ${status === 'available' ? 'bg-green-500' : ''}
              ${status === 'busy' ? 'bg-red-500' : ''}
              ${status === 'do not disturb' ? 'bg-pink-500' : ''}
              ${status === 'be right back' ? 'bg-yellow-400' : ''}
              ${status === 'appear away' ? 'bg-orange-400' : ''}
              ${status === 'appear offline' ? 'bg-gray-400' : ''}
            `}
            title={status}
          />
        </div>
        {/* Details section (right) */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          {/* Name with country flag */}
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight flex items-center justify-center md:justify-start">
            {user?.name || 'User Name'}
            {(() => {
              // Try to map country code to flag
              let code = '';
              if (user?.country) {
                if (typeof user.country === 'object' && user.country.value) {
                  code = user.country.value;
                } else if (typeof user.country === 'string') {
                  const match = allCountries.find(c => c[1] === user.country);
                  if (match) {
                    code = match[1];
                  }
                }
              }
              let flag = '';
              if (code && code.length === 2) {
                flag = String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt()));
              }
              return flag ? <span className="ml-2 text-2xl align-middle">{flag}</span> : null;
            })()}
          </h2>
          {/* Role and Status badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${user?.role === 'admin' ? 'bg-[#1976d2] text-white' : 'bg-[#388e3c] text-white'}`}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
            {/* Status badge with dropdown */}
            <div className="relative" ref={statusRef}>
              <button
                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[#1976d2] text-xs font-bold shadow-sm cursor-pointer"
                onClick={() => setStatusDropdownOpen((open) => !open)}
                type="button"
              >
                {STATUS_OPTIONS.find(opt => opt.value === status)?.label || 'Available'}
                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
              </button>
              {statusDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 ${status === opt.value ? 'font-bold text-[#1976d2]' : 'text-gray-700'}`}
                      onClick={() => handleStatusChange(opt.value)}
                    >
                      <span className={`inline-block w-3 h-3 rounded-full ${opt.color}`}></span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Bio */}
          <div className="italic text-gray-500 mb-3 max-w-xl">{user?.bio || 'No bio provided.'}</div>
          {/* Email */}
          <div className="flex items-center gap-2 mb-2 text-gray-700 justify-center md:justify-start">
            <FaEnvelope className="text-gray-400" />
            <span>{user?.email}</span>
          </div>
          {/* Location: city, country name (no flag) */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 justify-center md:justify-start">
            <FaMapMarkerAlt className="inline mr-1" />
            <span>{user?.city || 'N/A'}, {(() => {
              if (user?.country) {
                if (typeof user.country === 'object' && user.country.label) {
                  return user.country.label;
                }
                const match = allCountries.find(c => c[1] === user.country);
                if (match) {
                  return match[0];
                }
                return user.country;
              }
              return 'N/A';
            })()}</span>
        </div>
          {/* Timezone */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 justify-center md:justify-start">
            <FaClock className="inline mr-1" />
            <span>{user?.timezone || 'N/A'}</span>
          </div>
          {/* Member since */}
          <div className="flex items-center gap-2 mb-4 text-gray-500 justify-center md:justify-start">
            <FaCalendarPlus className="text-gray-400" />
            <span>Member since {user?.createdAt ? new Date(user?.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex gap-3 mt-2 justify-center md:justify-start">
            <button
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-[#1976d2] to-[#1565c0] text-white font-bold shadow-lg hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={handleEditProfile}
            >
              <FaRegEdit className="text-lg" />
              Edit Profile
            </button>
            <button
              className="flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-[#1976d2] shadow hover:bg-blue-50 transition"
              title="Change Avatar"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              type="button"
            >
              <FaCamera className="text-xl" />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
            style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
              <button
              className="flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-[#1976d2] shadow hover:bg-blue-50 transition"
              title="Share Profile"
              onClick={() => {
                navigator.clipboard.writeText(profileUrl);
                toast.success('Profile link copied!');
              }}
                type="button"
              >
              <FiShare2 className="text-xl" />
              </button>
            </div>
          </div>
            </div>
      {/* Stats/Skills Section (light theme) */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mb-10">
        {/* Assigned Cases Stat Card */}
        <div className="relative bg-white rounded-2xl shadow border border-gray-100 p-6 flex flex-col justify-between min-h-[150px] w-full transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(25,118,210,0.15)]">
          <div className="flex justify-between items-start mb-2 w-full">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50">
              <FiBriefcase className="text-2xl" style={{ color: '#1976d2' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#1976d2' }}>+1</span>
            </div>
          <div className="flex-1 flex flex-col justify-end items-start">
            <span className="text-3xl font-extrabold text-gray-900 mb-1">{assignedCases.length}</span>
            <span className="text-gray-500 font-medium">Assigned Cases</span>
          </div>
        </div>
        {/* Teams Stat Card */}
        <div className="relative bg-white rounded-2xl shadow border border-gray-100 p-6 flex flex-col justify-between min-h-[150px] w-full transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(56,142,60,0.15)]">
          <div className="flex justify-between items-start mb-2 w-full">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50">
              <FiUsers className="text-2xl" style={{ color: '#388e3c' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#388e3c' }}>+0</span>
          </div>
          <div className="flex-1 flex flex-col justify-end items-start">
            <span className="text-2xl font-extrabold text-gray-900 mb-1">{userTeams.length}</span>
            <span className="text-gray-500 font-medium">Teams</span>
          </div>
        </div>
        {/* Efficiency Stat Card Redesigned */}
        <div className="relative bg-white rounded-2xl shadow border border-gray-100 p-6 flex flex-col justify-between min-h-[150px] w-full transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(255,152,0,0.15)]">
          <div className="flex justify-between items-start mb-2 w-full">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-50">
              <FiTrendingUp className="text-2xl" style={{ color: '#ff9800' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#ff9800' }}>+2%</span>
          </div>
          <div className="flex-1 flex flex-col justify-end items-start">
            <span className="text-3xl font-extrabold text-gray-900 mb-1">{assignedCases.length > 0 ? `${Math.round((assignedCases.filter(c => c.status === 'resolved').length / assignedCases.length) * 100)}%` : 'N/A'}</span>
            <span className="text-gray-500 font-medium">Performance</span>
          </div>
        </div>
      </div>
      {/* Details Section Polished */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Information Card */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-12 transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(25,118,210,0.10)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50">
              <FiUser className="text-3xl text-[#1976d2]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#1976d2]">Profile Information</h3>
          </div>
          <div className="grid grid-cols-1 gap-y-6">
            {/* Full Name */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiUser className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Full Name:</span>
              {editMode ? (
                <input className="border rounded px-2 py-1 w-full" value={editName} onChange={e => setEditName(e.target.value)} />
              ) : (
                <span className="text-gray-900">{user?.name}</span>
              )}
            </div>
            {/* Title/Status */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiShield className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Title/Status:</span>
              {editMode ? (
                <input className="border rounded px-2 py-1 w-full" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              ) : (
                <span className="text-gray-900">{user?.title || 'N/A'}</span>
              )}
            </div>
            {/* Email */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiMail className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="text-gray-900 flex items-center">{user?.email}{user?.emails?.[0]?.verified && (<FiCheckCircle className="text-green-500 ml-2" title="Verified" />)}</span>
            </div>
            {/* Phone */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiPhone className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Phone:</span>
              {editMode ? (
                <input className="border rounded px-2 py-1 w-full" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              ) : (
                <span className="text-gray-900 flex items-center">{user?.phones?.[0]?.value || 'N/A'}{user?.phones?.[0]?.verified && (<FiCheckCircle className="text-green-500 ml-2" title="Verified" />)}</span>
              )}
            </div>
            {/* Location */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiMapPin className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Location:</span>
              {editMode ? (
                <div className="flex flex-col gap-2 w-full">
                  <input className="border rounded px-2 py-1 w-full" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="City" />
                  <div className="w-full">
                    <Select
                      classNamePrefix="react-select"
                      className="w-full"
                      options={countryOptions}
                      value={countryOptions.find(opt => opt.value === editCountry) || null}
                      onChange={option => setEditCountry(option.value)}
                      placeholder="Country"
                      isClearable
                      menuPlacement="auto"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-gray-900">{user?.city || 'N/A'}, {(() => {
                  if (user?.country) {
                    if (typeof user.country === 'object' && user.country.label) {
                      return user.country.label;
                    }
                    const match = allCountries.find(c => c[1] === user.country);
                    if (match) {
                      return match[0];
                    }
                    return user.country;
                  }
                  return 'N/A';
                })()}</span>
              )}
            </div>
            {/* Timezone */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiClock className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Timezone:</span>
              {editMode ? (
                <select className="border rounded px-2 py-1 w-full" value={editTimezone} onChange={e => setEditTimezone(e.target.value)}>
                  {timeZones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              ) : (
                <span className="text-gray-900">{user?.timezone || 'N/A'}</span>
              )}
            </div>
            {/* Member since */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2 border-t border-gray-100 pt-4 mt-2">
              <FiCalendar className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Member since:</span>
              <span className="text-gray-900">{user?.createdAt ? new Date(user?.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          {editMode && (
            <div className="flex gap-4 mt-8 justify-end">
              <button className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700" onClick={handleSaveEdit}>Save</button>
              <button className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-bold hover:bg-gray-300" onClick={handleCancelEdit}>Cancel</button>
            </div>
          )}
        </div>
        {/* Account Details Card */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-12 transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(25,118,210,0.10)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50">
              <FiUsers className="text-3xl text-[#1976d2]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#1976d2]">Account Details</h3>
          </div>
          <div className="grid grid-cols-1 gap-y-6">
            {/* Teams */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiUsers className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Teams:</span>
              <span className="text-gray-900">{userTeams.map(t => t.name).join(', ') || 'No teams'}</span>
            </div>
            {/* Role (not editable) */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiShield className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Role:</span>
              <span className="text-gray-900">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}</span>
            </div>
            {/* Account Created */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiCalendar className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Account Created:</span>
              <span className="text-gray-900">{user?.createdAt ? new Date(user?.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            {/* Last Login */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiClock className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Last Login:</span>
              <span className="text-gray-900">{user?.lastLogin ? new Date(user?.lastLogin).toLocaleString() : 'N/A'}</span>
            </div>
            {/* Assigned Cases */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2">
              <FiBriefcase className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Assigned Cases:</span>
              <span className="text-gray-900">{assignedCases.length}</span>
            </div>
            {/* Efficiency */}
            <div className="grid grid-cols-[40px_140px_1fr] items-center gap-x-4 py-2 border-t border-gray-100 pt-4 mt-2">
              <FiTrendingUp className="text-blue-400 text-xl" />
              <span className="font-semibold text-gray-700">Efficiency:</span>
              <span className="text-gray-900">{assignedCases.length > 0 ? `${Math.round((assignedCases.filter(c => c.status === 'resolved').length / assignedCases.length) * 100)}%` : 'N/A'}</span>
            </div>
          </div>
        </div>
        {/* Account Linking Card */}
        <div className="w-full max-w-6xl mx-auto mt-8">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-8 transition-shadow duration-200 hover:shadow-[0_0_24px_0_rgba(25,118,210,0.10)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50">
                <FaLock className="text-2xl text-[#1976d2]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1976d2]">Account Linking</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Google */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-1">
                  <FaGoogle className="text-3xl text-red-500" />
                </span>
                <span className="font-semibold text-gray-700">Google</span>
                {isLinked('google') ? (
                  <>
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Linked</span>
                    <button className="mt-2 px-4 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition" onClick={() => handleUnlinkSocial('google')} disabled={saving}>Unlink</button>
                  </>
                ) : (
                  <a href={getLinkUrl('google')} className="mt-2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">Link</a>
                )}
              </div>
              {/* GitHub */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-1">
                  <FaGithub className="text-3xl text-gray-800" />
                </span>
                <span className="font-semibold text-gray-700">GitHub</span>
                {isLinked('github') ? (
                  <>
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Linked</span>
                    <button className="mt-2 px-4 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition" onClick={() => handleUnlinkSocial('github')} disabled={saving}>Unlink</button>
                  </>
                ) : (
                  <a href={getLinkUrl('github')} className="mt-2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">Link</a>
                )}
              </div>
              {/* Microsoft */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-1">
                  <FaMicrosoft className="text-3xl text-blue-700" />
                </span>
                <span className="font-semibold text-gray-700">Microsoft</span>
                {isLinked('microsoft') ? (
                  <>
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Linked</span>
                    <button className="mt-2 px-4 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition" onClick={() => handleUnlinkSocial('microsoft')} disabled={saving}>Unlink</button>
                  </>
                ) : (
                  <a href={getLinkUrl('microsoft')} className="mt-2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">Link</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Avatar Crop Modal */}
      {cropModalOpen && (
        <Modal
          isOpen={cropModalOpen}
          onRequestClose={() => setCropModalOpen(false)}
          className="fixed inset-0 flex items-center justify-center z-50"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
          ariaHideApp={false}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4">Crop Avatar</h2>
            <div className="relative w-64 h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex gap-4 mb-4 w-full justify-center">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-48"
              />
            </div>
            <div className="flex gap-4">
              <button
                className="px-4 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setCropModalOpen(false)}
                disabled={avatarUploading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                onClick={handleUploadCroppedAvatar}
                disabled={avatarUploading}
              >
                {avatarUploading ? 'Uploading...' : 'Save Avatar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      <Footer />
    </div>
  );
};

export default UserProfile; 