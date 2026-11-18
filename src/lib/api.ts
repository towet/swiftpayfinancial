import axios from 'axios';

// Resolve configured API base URL if provided via environment variables.
// When blank (''), all API calls use relative paths (e.g. /api/auth/register).
// In development & preview: Vite proxy (vite.config.ts) handles forwarding /api to the backend.
// In production: Vercel (vercel.json rewrites) proxies /api, preventing browser CORS issues.
const rawEnvUrl =
  (import.meta as any)?.env?.VITE_API_BASE_URL ||
  (import.meta as any)?.env?.VITE_API_URL ||
  '';

const API_BASE_URL = rawEnvUrl
  ? String(rawEnvUrl).replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : '';

if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

// Add token to requests if available
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to apiClient requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
