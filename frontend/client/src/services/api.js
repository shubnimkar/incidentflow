import axios from "axios";

// Auth API (on port 5000)
export const authApi = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

const incidentApi = axios.create({
  baseURL: "http://localhost:5001/api",
});

incidentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { incidentApi };