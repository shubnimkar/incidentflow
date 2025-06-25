import axios from "axios";

// Auth API (http://localhost:5000/api/auth)
export const authApi = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

// Incident API (http://localhost:5001/api)
export const incidentApi = axios.create({
  baseURL: "http://localhost:5001/api",
});

// User API (http://localhost:5002/api/users)
export const userApi = axios.create({
  baseURL: "http://localhost:5002/api/users",
});

export const onCallApi = axios.create({
  baseURL: "http://localhost:5003/api", // separate from incidentApi
});


// Attach token for protected APIs (incident, user)
incidentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

onCallApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
