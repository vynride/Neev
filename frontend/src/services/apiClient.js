import axios from 'axios';

// Empty base URL means "same origin": Vite proxies /api to the FastAPI backend in dev,
// and Caddy does the same in production. Set VITE_API_BASE_URL to call a backend elsewhere.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const TOKEN_KEY = 'neev_auth_token';
export const USER_KEY = 'neev_user';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // An answer that reads code and tasks takes 10-25 seconds
  timeout: 120000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or invalid token: drop it and send the user back to login
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

// A readable message for any failed request
export const errorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (error?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!error?.response) return 'Cannot reach the server. Check that the backend is running.';
  return `Something went wrong (${error.response.status}).`;
};
