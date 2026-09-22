import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach client session token header for device/session verification
api.interceptors.request.use((config) => {
  try {
    const sessionToken = sessionStorage.getItem('nss_exam_session_token');
    if (sessionToken) {
      config.headers['x-session-token'] = sessionToken;
    }
  } catch {
    // Graceful fallback if sessionStorage is inaccessible
  }
  return config;
});

export default api;

