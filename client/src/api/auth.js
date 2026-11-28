/**
 * @file Creates and exports helper functions that make auth-related API calls
 * @module client/src/api/auth.js
 * @author Alejandro Alvarado <alejalva@pdx.edu>
 */

import client from './client.js';

// Each call resolves to the response body and rejects with the Axios
// error, whose response.data holds the API's { error: { ... } }.

export async function login(username, password) {
  const res = await client.post('/auth/login', { username, password });
  return res.data; // { token, user }
}

export async function register(username, email, password) {
  const res = await client.post('/auth/register', {
    username,
    email,
    password,
  });
  return res.data; // { token, user }
}

export async function getMe() {
  const res = await client.get('/auth/me');
  return res.data; // { user }
}
