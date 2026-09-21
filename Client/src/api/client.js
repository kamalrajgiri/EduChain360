import axios from 'axios';

const TOKEN_KEY = 'educhain360_token';
const LEGACY_TOKEN_KEY = 'token';
export const AUTH_UNAUTHORIZED_EVENT = 'educhain360:unauthorized';

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacyToken) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  return legacyToken;
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
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
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  }
);

export default client;