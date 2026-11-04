import axios from 'axios';

// Dev/preview: same-origin requests so the Vite dev proxy (vite.config.ts) forwards
// /api to the live backend — the backend only accepts the swiftpayfinancial.com Origin.
// Production: call the backend directly (Vercel also proxies /api via vercel.json rewrites).
const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL ||
  (import.meta.env?.MODE === 'development' ? '' : 'https://swiftpay-backend-uvv9.onrender.com');

// Set default base URL for all axios requests
axios.defaults.baseURL = API_BASE_URL;

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
  baseURL: API_BASE_URL,
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
