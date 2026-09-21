import { pool } from '../config/db.js';

/**
 * ═══════════════════════════════════════════════════════════════
 * SHARED SEARCH — dispatches by role, returns grouped results
 * ═══════════════════════════════════════════════════════════════
 *
 * Response shape (always the same regardless of role):
 *   {
 *     success: true,
 *     data: {
 *       query: "physics",
 *       groups: [
 *         { id: "books", label: "Books", icon: "📖", items: [
 *             { id, title, subtitle, path }
 *         ]},
 *         ...
 *       ],
 *       total: 12
 *     }
 *   }
 */

function emptyResult(query) {
  return { query, groups: [], total: 0 };
}

function group(id, label, icon, items) {
  return { id, label, icon, items };
}

/* ─── STUDENT ────────────────────────────────────────────── */

async function searchAsStudent(userId, q) {
  const like = `%${q}%`;

  const [books] = await pool.query(
    `SELECT id, title, author, available_copies
       FROM books
      WHERE title LIKE ? OR author LIKE ? OR category LIKE ?
      LIMIT 5`,
    [like, like, like]
  );

  const [notices] = await pool.query(
    `SELECT id, title, audience, published_at
       FROM notices
      WHERE status = 'SENT'
        AND audience IN ('ALL','STUDENTS')
        AND (title LIKE ? OR message LIKE ?)
      ORDER BY published_at DESC
      LIMIT 5`,
    [like, like]
  );

  const [certificates] = await pool.query(
    `SELECT id, credential_uuid, title, issue_date, is_anchored
       FROM academic_credentials
      WHERE student_id = ? AND title LIKE ?
      ORDER BY issue_date DESC
      LIMIT 5`,
    [userId, like]
  );

  const [subjects] = await pool.query(
    `SELECT DISTINCT s.id, s.name, s.code
       FROM subjects s
       JOIN class_subjects cs ON cs.subject_id = s.id
       JOIN enrollments e ON e.class_id = cs.class_id
      WHERE e.student_id = ?
        AND (s.name LIKE ? OR s.code LIKE ?)
      LIMIT 5`,
    [userId, like, like]
  );

  const groups = [];

  if (books.length > 0) {
    groups.push(group('books', 'Books', '📖', books.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: `${b.author || '—'} · ${b.available_copies} available`,
      path: '/student/library'
    }))));
  }

  if (subjects.length > 0) {
    groups.push(group('subjects', 'Subjects', '📚', subjects.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.code,
      path: '/student/attendance'
    }))));
  }

  if (notices.length > 0) {
    groups.push(group('notices', 'Notices', '📣', notices.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.audience,
      path: `/student/notices/${n.id}`
    }))));
  }

  if (certificates.length > 0) {
    groups.push(group('certificates', 'Certificates', '🎓', certificates.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: `Issued ${new Date(c.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      path: `/student/certificates/${c.credential_uuid}`
    }))));
  }

  return groups;
}

/* ─── ACCOUNTANT ─────────────────────────────────────────── */

async function searchAsAccountant(userId, q) {
  const like = `%${q}%`;

  const [students] = await pool.query(
    `SELECT u.id, u.full_name, u.school_id_number,
            c.name AS class_name,
            COALESCE((SELECT SUM(amount - amount_paid) FROM fee_invoices
                      WHERE student_id = u.id AND status IN ('UNPAID','PARTIAL')), 0) AS dues
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN enrollments e ON e.student_id = u.id
       LEFT JOIN classes c ON c.id = e.class_id
      WHERE r.name = 'Student'
        AND (u.full_name LIKE ? OR u.school_id_number LIKE ?)
      ORDER BY u.full_name
      LIMIT 5`,
    [like, like]
  );

  const [invoices] = await pool.query(
    `SELECT fi.id, fi.fee_head, fi.term, fi.amount, fi.status,
            u.full_name AS student_name, u.id AS student_id
       FROM fee_invoices fi
       JOIN users u ON u.id = fi.student_id
      WHERE fi.fee_head LIKE ? OR fi.term LIKE ?
      ORDER BY fi.id DESC
      LIMIT 5`,
    [like, like]
  );

  const [receipts] = await pool.query(
    `SELECT r.id, r.receipt_number, r.amount,
            u.full_name AS student_name
       FROM fee_receipts r
       JOIN users u ON u.id = r.student_id
      WHERE r.receipt_number LIKE ?
      ORDER BY r.created_at DESC
      LIMIT 5`,
    [like]
  );

  const [notices] = await pool.query(
    `SELECT id, title, audience, published_at
       FROM notices
      WHERE status = 'SENT'
        AND audience IN ('ALL','STAFF')
        AND (title LIKE ? OR message LIKE ?)
      ORDER BY published_at DESC
      LIMIT 5`,
    [like, like]
  );

  const groups = [];

  if (students.length > 0) {
    groups.push(group('students', 'Students', '👤', students.map((s) => ({
      id: s.id,
      title: s.full_name,
      subtitle: `${s.school_id_number} · ${s.class_name || 'No class'}${Number(s.dues) > 0 ? ` · NPR ${Number(s.dues).toLocaleString('en-IN')} due` : ''}`,
      path: `/accountant/students/${s.id}`
    }))));
  }

  if (invoices.length > 0) {
    groups.push(group('invoices', 'Invoices', '🧾', invoices.map((i) => ({
      id: i.id,
      title: `${i.fee_head} · NPR ${Number(i.amount).toLocaleString('en-IN')}`,
      subtitle: `${i.student_name} · ${i.status}`,
      path: `/accountant/students/${i.student_id}`
    }))));
  }

  if (receipts.length > 0) {
    groups.push(group('receipts', 'Receipts', '💳', receipts.map((r) => ({
      id: r.id,
      title: r.receipt_number,
      subtitle: `${r.student_name} · NPR ${Number(r.amount).toLocaleString('en-IN')}`,
      path: `/accountant/receipts/${r.id}`
    }))));
  }

  if (notices.length > 0) {
    groups.push(group('notices', 'Notices', '📣', notices.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.audience,
      path: `/accountant/notices/${n.id}`
    }))));
  }

  return groups;
}

/* ─── TEACHER ────────────────────────────────────────────── */

async function searchAsTeacher(userId, q) {
  const like = `%${q}%`;

  // Get teacher id from user id
  const [teacherRows] = await pool.query(
    'SELECT id FROM teachers WHERE user_id = ? LIMIT 1',
    [userId]
  );
  if (teacherRows.length === 0) return [];
  const teacherId = teacherRows[0].id;

  // Students in teacher's classes
  const [students] = await pool.query(
    `SELECT DISTINCT u.id, u.full_name, u.school_id_number,
            c.name AS class_name
       FROM class_subjects cs
       JOIN enrollments e ON e.class_id = cs.class_id
       JOIN users u ON u.id = e.student_id
       JOIN classes c ON c.id = cs.class_id
      WHERE cs.teacher_id = ?
        AND (u.full_name LIKE ? OR u.school_id_number LIKE ?)
      ORDER BY u.full_name
      LIMIT 5`,
    [teacherId, like, like]
  );

  // Notices (ALL + STAFF + TEACHERS)
  const [notices] = await pool.query(
    `SELECT id, title, audience, published_at
       FROM notices
      WHERE status = 'SENT'
        AND audience IN ('ALL','STAFF','TEACHERS')
        AND (recipient_id IS NULL OR recipient_id = ?)
        AND (title LIKE ? OR message LIKE ?)
      ORDER BY published_at DESC
      LIMIT 5`,
    [userId, like, like]
  );

  // Exams created by this teacher
  const [exams] = await pool.query(
    `SELECT DISTINCT e.name AS exam_name, e.exam_date,
            c.id AS class_id, c.name AS class_name
       FROM exams e
       JOIN classes c ON c.id = e.class_id
      WHERE e.created_by_teacher_id = ? AND e.name LIKE ?
      ORDER BY e.exam_date DESC
      LIMIT 5`,
    [teacherId, like]
  );

  // Subjects this teacher teaches
  const [subjects] = await pool.query(
    `SELECT DISTINCT s.id, s.name, s.code
       FROM class_subjects cs
       JOIN subjects s ON s.id = cs.subject_id
      WHERE cs.teacher_id = ?
        AND (s.name LIKE ? OR s.code LIKE ?)
      LIMIT 5`,
    [teacherId, like, like]
  );

  const groups = [];

  if (students.length > 0) {
    groups.push(group('students', 'Students', '👤', students.map((s) => ({
      id: s.id,
      title: s.full_name,
      subtitle: `${s.school_id_number} · ${s.class_name}`,
      path: `/teacher/classes`
    }))));
  }

  if (exams.length > 0) {
    groups.push(group('exams', 'Exams', '📝', exams.map((e, i) => ({
      id: `${e.exam_name}-${i}`,
      title: e.exam_name,
      subtitle: `${e.class_name} · ${new Date(e.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      path: `/teacher/exams`
    }))));
  }

  if (subjects.length > 0) {
    groups.push(group('subjects', 'Subjects', '📚', subjects.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.code,
      path: `/teacher/exams`
    }))));
  }

  if (notices.length > 0) {
    groups.push(group('notices', 'Notices', '📣', notices.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.audience,
      path: `/teacher/notices/${n.id}`
    }))));
  }

  return groups;
}

/* ─── ADMIN ──────────────────────────────────────────────── */

async function searchAsAdmin(userId, q) {
  const like = `%${q}%`;

  const [users] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.school_id_number,
            r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.full_name LIKE ? OR u.email LIKE ? OR u.school_id_number LIKE ?
      ORDER BY u.full_name
      LIMIT 5`,
    [like, like, like]
  );

  const [classes] = await pool.query(
    `SELECT id, name, academic_year FROM classes
      WHERE name LIKE ? OR academic_year LIKE ?
      ORDER BY name LIMIT 5`,
    [like, like]
  );

  const [notices] = await pool.query(
    `SELECT id, title, audience, published_at FROM notices
      WHERE status = 'SENT' AND audience = 'ALL'
        AND (title LIKE ? OR message LIKE ?)
      ORDER BY published_at DESC LIMIT 5`,
    [like, like]
  );

  const groups = [];

  if (users.length > 0) {
    groups.push(group('users', 'Users', '👤', users.map((u) => ({
      id: u.id,
      title: u.full_name,
      subtitle: `${u.role} · ${u.school_id_number}`,
      path: '/admin/users'
    }))));
  }

  if (classes.length > 0) {
    groups.push(group('classes', 'Classes', '🏫', classes.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.academic_year,
      path: '/admin/academics'
    }))));
  }

  if (notices.length > 0) {
    groups.push(group('notices', 'Notices', '📣', notices.map((n) => ({
      id: n.id,
      title: n.title,
      subtitle: n.audience,
      path: '/admin'
    }))));
  }

  return groups;
}
/* ─── DEFAULT (unknown role) ────────────────────────────── */

async function searchDefault(userId, q) {
  // Fallback: just search notices the role can see
  const like = `%${q}%`;
  const [notices] = await pool.query(
    `SELECT id, title, audience
       FROM notices
      WHERE status = 'SENT'
        AND audience IN ('ALL','STAFF','STUDENTS','PARENTS')
        AND (title LIKE ? OR message LIKE ?)
      ORDER BY published_at DESC
      LIMIT 5`,
    [like, like]
  );

  if (notices.length === 0) return [];

  return [group('notices', 'Notices', '📣', notices.map((n) => ({
    id: n.id,
    title: n.title,
    subtitle: n.audience,
    path: `/help`
  })))];
}

/* ─── ENTRY POINT ────────────────────────────────────────── */

export async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: emptyResult(q) });
    }

    const role = req.user.role;
    const userId = req.user.id;

    let groups = [];
    if (role === 'Student') {
      groups = await searchAsStudent(userId, q);
    } else if (role === 'Accountant') {
      groups = await searchAsAccountant(userId, q);
    } else if (role === 'Teacher') {
      groups = await searchAsTeacher(userId, q);
    } else if (role === 'Admin') {
      groups = await searchAsAdmin(userId, q);
    } else {
      groups = await searchDefault(userId, q);
    }

    const total = groups.reduce((s, g) => s + g.items.length, 0);

    res.json({
      success: true,
      data: { query: q, groups, total }
    });
  } catch (err) {
    next(err);
  }
}