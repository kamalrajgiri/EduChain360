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

export async function payFees(amount, method) {
  const { data } = await client.post('/student/fees/pay', { amount, method });
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
export async function getAttendanceCalendar(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data } = await client.get(`/student/attendance/calendar${qs}`);
  return data.data;
}

export async function getAllExams() {
  const { data } = await client.get('/student/exams');
  return data.data;
}