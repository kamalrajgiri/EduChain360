import client from './client.js';

export async function login(identifier, password) {
  const { data } = await client.post('/auth/login', { identifier, password });
  return data; // { success, token, user }
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data.user;
}

export async function updateProfile({ phone_number, full_name }) {
  const body = {};
  if (phone_number !== undefined) body.phone_number = phone_number;
  if (full_name   !== undefined) body.full_name   = full_name;
  const { data } = await client.patch('/auth/profile', body);
  return data;
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await client.post('/auth/change-password', {
    currentPassword,
    newPassword
  });
  return data;
}

export async function uploadPhoto(dataUrl) {
  const { data } = await client.post('/auth/profile/photo', { dataUrl });
  return data;
}

export async function removePhoto() {
  const { data } = await client.delete('/auth/profile/photo');
  return data;
}