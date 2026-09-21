import client from './client.js';

/* ─── Dashboard ──────────────────────────────────────── */

export async function getDashboard() {
  const { data } = await client.get('/accountant/dashboard');
  return data.data;
}

export async function getAlerts() {
  const { data } = await client.get('/accountant/dashboard/alerts');
  return data.data;
}

export async function getActivity() {
  const { data } = await client.get('/accountant/dashboard/activity');
  return data.data;
}

export async function getWeeklyChart() {
  const { data } = await client.get('/accountant/dashboard/weekly');
  return data.data;
}

/* ─── Transactions ───────────────────────────────────── */

export async function getTransactions({ limit = 50, offset = 0, method = '', q = '' } = {}) {
  const params = new URLSearchParams();
  if (limit)  params.set('limit', limit);
  if (offset) params.set('offset', offset);
  if (method) params.set('method', method);
  if (q)      params.set('q', q);
  const { data } = await client.get(`/accountant/transactions?${params.toString()}`);
  return data.data;
}

/* ─── Receipts ───────────────────────────────────────── */

export async function getReceipt(id) {
  const { data } = await client.get(`/accountant/receipts/${id}`);
  return data.data;
}

/* ─── Invoices ───────────────────────────────────────── */

export async function getInvoices({ limit = 50, offset = 0, status = '', class_id = '', q = '', aging = '' } = {}) {
  const params = new URLSearchParams();
  if (limit)    params.set('limit', limit);
  if (offset)   params.set('offset', offset);
  if (status)   params.set('status', status);
  if (class_id) params.set('class_id', class_id);
  if (q)        params.set('q', q);
  if (aging)    params.set('aging', aging);
  const { data } = await client.get(`/accountant/invoices?${params.toString()}`);
  return data.data;
}

export async function getInvoice(id) {
  const { data } = await client.get(`/accountant/invoices/${id}`);
  return data.data;
}

export async function updateInvoice(id, payload) {
  const { data } = await client.patch(`/accountant/invoices/${id}`, payload);
  return data;
}

/* ─── Classes ────────────────────────────────────────── */

export async function getClasses() {
  const { data } = await client.get('/accountant/classes');
  return data.data;
}

/* ─── Fee structure ──────────────────────────────────── */

export async function getFeeStructure() {
  const { data } = await client.get('/accountant/fee-structure');
  return data.data;
}

export async function createFeeStructure(payload) {
  const { data } = await client.post('/accountant/fee-structure', payload);
  return data;
}

export async function updateFeeStructure(id, payload) {
  const { data } = await client.patch(`/accountant/fee-structure/${id}`, payload);
  return data;
}

export async function deleteFeeStructure(id) {
  const { data } = await client.delete(`/accountant/fee-structure/${id}`);
  return data;
}

export async function previewInvoices({ class_id, academic_year, term }) {
  const { data } = await client.post('/accountant/fee-structure/preview-invoices', {
    class_id, academic_year, term
  });
  return data.data;
}

export async function generateInvoices({ class_id, academic_year, term }) {
  const { data } = await client.post('/accountant/fee-structure/generate-invoices', {
    class_id, academic_year, term
  });
  return data;
}

/* ─── Payments ───────────────────────────────────────── */

export async function recordPayment({ student_id, amount, method, notes }) {
  const { data } = await client.post('/accountant/payments', {
    student_id, amount, method, notes
  });
  return data;
}

/* ─── Students ───────────────────────────────────────── */

export async function searchStudents(q) {
  const { data } = await client.get(`/accountant/students?q=${encodeURIComponent(q)}`);
  return data.data;
}

export async function getStudentDetail(studentId) {
  const { data } = await client.get(`/accountant/students/${studentId}`);
  return data.data;
}

export async function remindStudent(studentId) {
  const { data } = await client.post(`/accountant/students/${studentId}/remind`);
  return data;
}

/* ─── Reports ────────────────────────────────────────── */

export async function getReports() {
  const { data } = await client.get('/accountant/reports');
  return data.data;
}

export async function getAgingReport() {
  const { data } = await client.get('/accountant/reports/aging');
  return data.data;
}

/* ─── Reminders (bulk) ───────────────────────────────── */

export async function getRemindersPreview() {
  const { data } = await client.get('/accountant/reminders/preview');
  return data.data;
}

export async function sendFeeReminder(payload = {}) {
  const { data } = await client.post('/accountant/reminders/send', payload);
  return data;
}

/* ─── Payroll ────────────────────────────────────────── */

export async function getPayrollStaff() {
  const { data } = await client.get('/accountant/payroll/staff');
  return data.data;
}

export async function upsertStaffSalary(userId, payload) {
  const { data } = await client.post(`/accountant/payroll/staff/${userId}`, payload);
  return data;
}

export async function getPayrollRuns() {
  const { data } = await client.get('/accountant/payroll/runs');
  return data.data;
}

export async function getPayrollRunDetail(id) {
  const { data } = await client.get(`/accountant/payroll/runs/${id}`);
  return data.data;
}

export async function createPayrollRun(month, notes) {
  const { data } = await client.post('/accountant/payroll/runs', { month, notes });
  return data;
}

export async function getSalarySlip(runId, userId) {
  const { data } = await client.get(`/accountant/payroll/runs/${runId}/slip/${userId}`);
  return data.data;
}

export async function getUnpaidInvoices(studentId) {
  const { data } = await client.get(`/accountant/students/${studentId}/unpaid`);
  return data.data;
}

export async function getStudentStatement(studentId) {
  const { data } = await client.get(`/accountant/students/${studentId}/statement`);
  return data.data;
}
export async function getDaybook(date) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  const { data } = await client.get(`/accountant/daybook${qs}`);
  return data.data;
}

export async function bulkInvoiceAction(ids, action) {
  const { data } = await client.post('/accountant/invoices/bulk', { ids, action });
  return data;
}
export async function getAdjustments(studentId) {
  const { data } = await client.get(`/accountant/students/${studentId}/adjustments`);
  return data.data;
}

export async function createAdjustment(payload) {
  const { data } = await client.post('/accountant/adjustments', payload);
  return data;
}

export async function deleteAdjustment(id) {
  const { data } = await client.delete(`/accountant/adjustments/${id}`);
  return data;
}
export async function getDayOfWeekReport(months = 6) {
  const { data } = await client.get(`/accountant/reports/day-of-week?months=${months}`);
  return data.data;
}

export async function confirmReceipt(receiptId) {
  const { data } = await client.post(`/accountant/receipts/${receiptId}/confirm`);
  return data;
}