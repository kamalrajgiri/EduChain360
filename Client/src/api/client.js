import axios from 'axios';

const TOKEN_KEY = 'educhain360_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const client = axios.create({
  baseURL: '/api',
  timeout: 15000
});

// Attach JWT automatically
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, wipe token so ProtectedRoute kicks user back to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      // Let the app decide where to redirect (don't hard-reload here)
    }
    return Promise.reject(err);
  }
);

export default client;