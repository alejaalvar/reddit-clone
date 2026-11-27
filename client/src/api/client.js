import axios from 'axios';

const TOKEN_KEY = 'token';

/**
 * The one place that reads and writes the JWT. The spec keeps it in
 * localStorage so a login survives a reload.
 */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Shared Axios instance. Every api module goes through it, so
 * components never build URLs or attach headers themselves.
 */
const client = axios.create({ baseURL: '/api' });

// Attach the token, when there is one, to every request
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * A 401 means the token is missing, bad or expired: drop it and send
 * the user to log in. The auth routes are skipped, because a wrong
 * password at /auth/login is also a 401 and the form must show it.
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      tokenStore.clear();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export default client;
