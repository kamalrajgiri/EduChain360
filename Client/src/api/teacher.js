import client from './client.js';

/* ─── Dashboard ──────────────────────────────────────── */

export async function getDashboard() {
  const { data } = await client.get('/teacher/dashboard');
  return data.data;
}

export async function getActivity() {
  const { data } = await client.get('/teacher/activity');
  return data.data;
}

/* ─── Classes ────────────────────────────────────────── */

export async function getMyClasses() {
  const { data } = await client.get('/teacher/classes');
  return data.data;
}

export async function getClassDetail(classId) {
  const { data } = await client.get(`/teacher/classes/${classId}`);
  return data.data;
}

/* ─── Attendance ─────────────────────────────────────── */

export async function getAttendance({ class_id, subject_id, date } = {}) {
  const params = new URLSearchParams();
  if (class_id)   params.set('class_id', class_id);
  if (subject_id) params.set('subject_id', subject_id);
  if (date)       params.set('date', date);
  const { data } = await client.get(`/teacher/attendance?${params.toString()}`);
  return data.data;
}

export async function saveAttendance({ class_id, subject_id, date, entries }) {
  const { data } = await client.post('/teacher/attendance', {
    class_id, subject_id, date, entries
  });
  return data;
}

export async function getStudentAttendance(studentId) {
  const { data } = await client.get(`/teacher/students/${studentId}/attendance`);
  return data.data;
}

/* ─── Exams & Marks ──────────────────────────────────── */

export async function getExams() {
  const { data } = await client.get('/teacher/exams');
  return data.data;
}

export async function getExamMarks(examId) {
  const { data } = await client.get(`/teacher/exams/${examId}/marks`);
  return data.data;
}

export async function getExamDetailByName(name, classId) {
  const params = new URLSearchParams({ name, class_id: classId });
  const { data } = await client.get(`/teacher/exams/detail?${params.toString()}`);
  return data.data;
}

export async function saveExams({ class_id, exam_name, exam_date, subjects }) {
  const { data } = await client.post('/teacher/exams/save', {
    class_id, exam_name, exam_date, subjects
  });
  return data;
}

/* ─── Timetable ──────────────────────────────────────── */

export async function getTimetable() {
  const { data } = await client.get('/teacher/timetable');
  return data.data;
}