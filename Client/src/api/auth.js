import client from './client.js';

export async function login(identifier, password) {
  const { data } = await client.post('/auth/login', { identifier, password });
  return data; // { success, token, user }
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data.user;
}