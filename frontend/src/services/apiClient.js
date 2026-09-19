import axios from 'axios';

// Environment base URL for FastAPI backend with local fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor to attach JWT token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saathi_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: graceful logging for hackathon debugging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[Project Saathi API] Backend request failed or unreachable, relying on fallback:', error.message);
    return Promise.reject(error);
  }
);
