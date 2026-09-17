import client from './client.js';

export async function getDashboard() {
  const { data } = await client.get('/student/dashboard');
  return data.data;
}

export async function getAttendance() {
  const { data } = await client.get('/student/attendance');
  return data.data;
}

export async function getResults() {
  const { data } = await client.get('/student/results');
  return data.data;
}

export async function getFees() {
  const { data } = await client.get('/student/fees');
  return data.data;
}

export async function getReceipt(receiptId) {
  const { data } = await client.get(`/student/fees/receipts/${receiptId}`);
  return data.data;
}

export async function payFees(method) {
  const { data } = await client.post('/student/fees/pay', { method });
  return data;
}

export async function getCertificates() {
  const { data } = await client.get('/student/certificates');
  return data.data;
}

export async function getCertificate(uuid) {
  const { data } = await client.get(`/student/certificates/${uuid}`);
  return data.data;
}

export async function getLibrary(query = '') {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  const { data } = await client.get(`/student/library${qs}`);
  return data.data;
}

export async function getNotices() {
  const { data } = await client.get('/student/notices');
  return data.data;
}

export async function getNotice(noticeId) {
  const { data } = await client.get(`/student/notices/${noticeId}`);
  return data.data;
}

export async function updateProfile({ phone_number, full_name }) {
  const body = {};
  if (phone_number !== undefined) body.phone_number = phone_number;
  if (full_name   !== undefined) body.full_name   = full_name;
  const { data } = await client.patch('/student/profile', body);
  return data;
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await client.post('/student/change-password', {
    currentPassword,
    newPassword
  });
  return data;
}

export async function uploadPhoto(dataUrl) {
  const { data } = await client.post('/student/profile/photo', { dataUrl });
  return data;
}

export async function removePhoto() {
  const { data } = await client.delete('/student/profile/photo');
  return data;
}

export async function search(q) {
  const { data } = await client.get(`/student/search?q=${encodeURIComponent(q)}`);
  return data.data;
}