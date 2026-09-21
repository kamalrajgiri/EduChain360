import { pool } from '../config/db.js';

function todayCode() {
  const map = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return map[new Date().getDay()];
}

async function getEnrollment(studentId) {
  const [rows] = await pool.query(
    `SELECT e.class_id, e.roll_number, c.name AS class_name, c.academic_year
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ?
      LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
}

function gradeFromPct(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export async function getDashboard(req, res, next) {
  try {
    const studentId = req.user.id;
    const enrollment = await getEnrollment(studentId);

    const [attRows] = await pool.query(
      `SELECT
         COUNT(*)                 AS total,
         SUM(status='PRESENT')    AS present,
         SUM(status='LATE')       AS late,
         SUM(status='ABSENT')     AS absent
       FROM attendance
       WHERE student_id = ?
         AND YEAR(attendance_date)  = YEAR(CURDATE())
         AND MONTH(attendance_date) = MONTH(CURDATE())`,
      [studentId]
    );
    const att = attRows[0] || { total: 0, present: 0, late: 0, absent: 0 };
    const attendancePct = Number(att.total) > 0
      ? Math.round((Number(att.present) / Number(att.total)) * 1000) / 10
      : 0;

    const [examRows] = await pool.query(
      `SELECT e.id, e.name, e.full_marks, m.marks_obtained, m.grade
         FROM exam_marks m
         JOIN exams e ON e.id = m.exam_id
        WHERE m.student_id = ? AND m.submitted_at IS NOT NULL
        ORDER BY e.exam_date DESC, e.id DESC`,
      [studentId]
    );

    let lastExam = null;
    if (examRows.length > 0) {
      const totalFull = examRows.reduce((s, r) => s + Number(r.full_marks || 0), 0);
      const totalObt  = examRows.reduce((s, r) => s + Number(r.marks_obtained || 0), 0);
      const pct = totalFull > 0 ? Math.round((totalObt / totalFull) * 1000) / 10 : 0;
      lastExam = {
        name: examRows[0].name,
        aggregate: pct,
        grade: gradeFromPct(pct),
        subjects: examRows
      };
    }

    const [feeRows] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status='UNPAID' THEN amount ELSE 0 END), 0) AS due,
         MIN(CASE WHEN status='UNPAID' THEN due_date END) AS next_due_date
       FROM fee_invoices
       WHERE student_id = ?`,
      [studentId]
    );

    const [certCntRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM academic_credentials WHERE student_id = ?`,
      [studentId]
    );

    const [recentCerts] = await pool.query(
      `SELECT credential_uuid, title, issue_date, is_anchored
         FROM academic_credentials
        WHERE student_id = ?
        ORDER BY issue_date DESC
        LIMIT 2`,
      [studentId]
    );

    const day = todayCode();
    let todayTimetable = [];
    if (enrollment) {
      const [ttRows] = await pool.query(
        `SELECT tt.id, tt.start_time, tt.end_time, tt.room,
                s.name AS subject,
                u.full_name AS teacher
           FROM timetable_entries tt
           JOIN subjects s ON s.id = tt.subject_id
           LEFT JOIN teachers t ON t.id = tt.teacher_id
           LEFT JOIN users u ON u.id = t.user_id
          WHERE tt.class_id = ? AND tt.day_of_week = ?
          ORDER BY tt.start_time`,
        [enrollment.class_id, day]
      );
      todayTimetable = ttRows;
    }

    const [noticeRows] = await pool.query(
      `SELECT id, title, description AS message,
              'ALL' AS audience, created_at AS published_at
         FROM notices
        ORDER BY created_at DESC
        LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        enrollment,
        attendance: {
          pct: attendancePct,
          total: Number(att.total),
          present: Number(att.present),
          late: Number(att.late),
          absent: Number(att.absent),
          requirement: 90
        },
        lastExam,
        fees: {
          due: Number(feeRows[0]?.due || 0),
          nextDueDate: feeRows[0]?.next_due_date || null
        },
        certificates: {
          count: Number(certCntRows[0]?.count || 0),
          recent: recentCerts
        },
        todayTimetable,
        day,
        recentNotices: noticeRows
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   ATTENDANCE
   ═══════════════════════════════════════════════════════════════ */

export async function getAttendance(req, res, next) {
  try {
    const studentId = req.user.id;
    const enrollment = await getEnrollment(studentId);

    const [summaryRows] = await pool.query(
      `SELECT
         COUNT(*)                 AS total,
         SUM(status='PRESENT')    AS present,
         SUM(status='LATE')       AS late,
         SUM(status='ABSENT')     AS absent
       FROM attendance
       WHERE student_id = ?
         AND YEAR(attendance_date)  = YEAR(CURDATE())
         AND MONTH(attendance_date) = MONTH(CURDATE())`,
      [studentId]
    );
    const summary = summaryRows[0] || { total: 0, present: 0, late: 0, absent: 0 };
    const pct = Number(summary.total) > 0
      ? Math.round((Number(summary.present) / Number(summary.total)) * 1000) / 10
      : 0;

    const [historyRows] = await pool.query(
      `SELECT a.attendance_date, a.status,
              s.name AS subject,
              u.full_name AS marked_by
         FROM attendance a
         LEFT JOIN subjects s ON s.id = a.subject_id
         LEFT JOIN teachers t ON t.id = a.marked_by_teacher_id
         LEFT JOIN users u ON u.id = t.user_id
        WHERE a.student_id = ?
        ORDER BY a.attendance_date DESC
        LIMIT 30`,
      [studentId]
    );

    let weekTimetable = [];
    if (enrollment) {
      const [ttRows] = await pool.query(
        `SELECT tt.day_of_week, tt.start_time, tt.end_time, tt.room,
                s.name AS subject
           FROM timetable_entries tt
           JOIN subjects s ON s.id = tt.subject_id
          WHERE tt.class_id = ?
            AND tt.day_of_week IN ('MON','TUE','WED','THU','FRI')
          ORDER BY FIELD(tt.day_of_week,'MON','TUE','WED','THU','FRI'), tt.start_time`,
        [enrollment.class_id]
      );
      weekTimetable = ttRows;
    }

    res.json({
      success: true,
      data: {
        enrollment,
        summary: { ...summary, pct, requirement: 90 },
        history: historyRows,
        weekTimetable
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS
   ═══════════════════════════════════════════════════════════════ */

export async function getResults(req, res, next) {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT e.id AS exam_id, e.name AS exam_name, e.exam_date, e.full_marks,
              s.name AS subject, s.code AS subject_code,
              m.marks_obtained, m.grade, m.submitted_at
         FROM exam_marks m
         JOIN exams    e ON e.id = m.exam_id
         JOIN subjects s ON s.id = e.subject_id
        WHERE m.student_id = ? AND m.submitted_at IS NOT NULL
        ORDER BY e.exam_date DESC, e.id DESC, s.name`,
      [studentId]
    );

    const byExam = {};
    for (const r of rows) {
      if (!byExam[r.exam_id]) {
        byExam[r.exam_id] = {
          exam_id: r.exam_id,
          exam_name: r.exam_name,
          exam_date: r.exam_date,
          subjects: []
        };
      }
      byExam[r.exam_id].subjects.push({
        subject: r.subject,
        subject_code: r.subject_code,
        full_marks: Number(r.full_marks),
        marks_obtained: Number(r.marks_obtained),
        grade: r.grade
      });
    }

    const exams = Object.values(byExam).map((ex) => {
      const totalFull = ex.subjects.reduce((s, r) => s + r.full_marks, 0);
      const totalObt  = ex.subjects.reduce((s, r) => s + r.marks_obtained, 0);
      const pct = totalFull > 0 ? Math.round((totalObt / totalFull) * 1000) / 10 : 0;
      return {
        ...ex,
        totalFull,
        totalObtained: totalObt,
        aggregate: pct,
        grade: gradeFromPct(pct)
      };
    });

    const enrollment = await getEnrollment(studentId);
    let classRank = null;
    let classSize = 0;
    if (enrollment && exams.length > 0) {
      const latestExamId = exams[0].exam_id;

      const [rankRows] = await pool.query(
        `SELECT m.student_id,
                SUM(m.marks_obtained) AS obt,
                SUM(e.full_marks)     AS full
           FROM exam_marks m
           JOIN exams e ON e.id = m.exam_id
          WHERE e.id = ? AND m.submitted_at IS NOT NULL
          GROUP BY m.student_id
          ORDER BY (SUM(m.marks_obtained) / SUM(e.full_marks)) DESC`,
        [latestExamId]
      );
      classSize = rankRows.length;
      const idx = rankRows.findIndex((r) => Number(r.student_id) === Number(studentId));
      classRank = idx >= 0 ? idx + 1 : null;
    }

    res.json({
      success: true,
      data: { exams, classRank, classSize, enrollment }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FEES
   ═══════════════════════════════════════════════════════════════ */

export async function getFees(req, res, next) {
  try {
    const studentId = req.user.id;

    const [invoiceRows] = await pool.query(
      `SELECT id, term, fee_head, amount, due_date, status
         FROM fee_invoices
        WHERE student_id = ?
        ORDER BY due_date IS NULL, due_date, fee_head`,
      [studentId]
    );

    const [receiptRows] = await pool.query(
      `SELECT id, receipt_number, amount, payment_method, payment_status,
              receipt_hash, is_anchored, created_at
         FROM fee_receipts
        WHERE student_id = ?
        ORDER BY created_at DESC`,
      [studentId]
    );

    const totalDue = invoiceRows
      .filter((r) => r.status === 'UNPAID')
      .reduce((s, r) => s + Number(r.amount), 0);

    res.json({
      success: true,
      data: {
        invoices: invoiceRows,
        receipts: receiptRows,
        totalDue
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req, res, next) {
  try {
    const studentId = req.user.id;
    const receiptId = Number(req.params.id);

    const [rows] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method, r.payment_status,
              r.receipt_hash, r.is_anchored, r.created_at,
              u.full_name AS student_name, u.school_id_number,
              c.name AS class_name
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE r.id = ? AND r.student_id = ?
        LIMIT 1`,
      [receiptId, studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/student/fees/pay
 * Mock payment. Body: { method }
 */
export async function payFees(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const studentId = req.user.id;
    const method = String(req.body?.method || '').trim();
    const allowed = ['eSewa', 'Khalti', 'Bank transfer'];
    if (!allowed.includes(method)) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT COALESCE(SUM(amount), 0) AS due
         FROM fee_invoices
        WHERE student_id = ? AND status = 'UNPAID'`,
      [studentId]
    );
    const amount = Number(rows[0].due);
    if (amount <= 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'No outstanding dues' });
    }

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [ins] = await conn.query(
      `INSERT INTO fee_receipts
         (receipt_number, student_id, amount, payment_status, payment_method)
       VALUES (?, ?, ?, 'PAID', ?)`,
      [receiptNumber, studentId, amount, method]
    );
    const receiptId = ins.insertId;

    await conn.query(
      `UPDATE fee_invoices SET status = 'PAID'
        WHERE student_id = ? AND status = 'UNPAID'`,
      [studentId]
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: 'Payment recorded',
      data: { receiptId, receiptNumber, amount, method }
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATES
   ═══════════════════════════════════════════════════════════════ */

export async function getCertificates(req, res, next) {
  try {
    const studentId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, credential_uuid, title, issue_date, document_hash, is_anchored, created_at
         FROM academic_credentials
        WHERE student_id = ?
        ORDER BY issue_date DESC`,
      [studentId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getCertificate(req, res, next) {
  try {
    const studentId = req.user.id;
    const { uuid } = req.params;

    const [rows] = await pool.query(
      `SELECT c.id, c.credential_uuid, c.title, c.issue_date,
              c.document_hash, c.is_anchored,
              u.full_name AS student_name, u.school_id_number,
              cl.name AS class_name
         FROM academic_credentials c
         JOIN users u ON u.id = c.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes cl ON cl.id = e.class_id
        WHERE c.credential_uuid = ? AND c.student_id = ?
        LIMIT 1`,
      [uuid, studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   LIBRARY
   ═══════════════════════════════════════════════════════════════ */

export async function getLibrary(req, res, next) {
  try {
    const studentId = req.user.id;
    const query = (req.query.q || '').trim();

    const [myIssues] = await pool.query(
      `SELECT bi.id, bi.issued_on, bi.due_date, bi.returned_on, bi.status,
              b.title, b.author
         FROM book_issues bi
         JOIN books b ON b.id = bi.book_id
        WHERE bi.student_id = ?
        ORDER BY bi.issued_on DESC`,
      [studentId]
    );

    let catalog = [];
    if (query.length > 0) {
      const like = `%${query}%`;
      const [rows] = await pool.query(
        `SELECT id, title, author, category, total_copies, available_copies
           FROM books
          WHERE title LIKE ? OR author LIKE ? OR category LIKE ?
          ORDER BY title
          LIMIT 25`,
        [like, like, like]
      );
      catalog = rows;
    }

    res.json({ success: true, data: { myIssues, catalog, query } });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   NOTICES
   ═══════════════════════════════════════════════════════════════ */

export async function getNotices(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, description AS message,
              'ALL' AS audience, created_at AS published_at
         FROM notices
        ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getNotice(req, res, next) {
  try {
    const noticeId = Number(req.params.id);

    const [rows] = await pool.query(
      `SELECT id, title, description AS message,
              'ALL' AS audience, created_at AS published_at
         FROM notices
        WHERE id = ?
        LIMIT 1`,
      [noticeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE — edit, password, photo
   ═══════════════════════════════════════════════════════════════ */

export async function updateProfile(req, res, next) {
  try {
    const studentId = req.user.id;
    const { phone_number, full_name } = req.body;

    const sets = [];
    const values = [];

    if (typeof phone_number === 'string') {
      const cleaned = phone_number.trim();
      if (cleaned.length > 0 && !/^[+0-9\-\s]{7,20}$/.test(cleaned)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }
      sets.push('phone_number = ?');
      values.push(cleaned || null);
    }

    if (typeof full_name === 'string' && full_name.trim().length >= 2) {
      sets.push('full_name = ?');
      values.push(full_name.trim());
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    values.push(studentId);

    await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number,
              u.school_id_number, u.avatar_data, r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
        LIMIT 1`,
      [studentId]
    );

    res.json({ success: true, message: 'Profile updated', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const studentId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [studentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (rows[0].password_hash !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPassword, studentId]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    const { dataUrl } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image data' });
    }
    if (dataUrl.length > 2_000_000) {
      return res.status(413).json({ success: false, message: 'Image too large (max ~1.5 MB)' });
    }

    await pool.query('UPDATE users SET avatar_data = ? WHERE id = ?', [dataUrl, req.user.id]);
    res.json({ success: true, message: 'Photo updated' });
  } catch (err) {
    next(err);
  }
}

export async function clearAvatar(req, res, next) {
  try {
    await pool.query('UPDATE users SET avatar_data = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Photo removed' });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════════════════ */

export async function search(req, res, next) {
  try {
    const studentId = req.user.id;
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: { books: [], notices: [], certificates: [], subjects: [] } });
    }
    const like = `%${q}%`;

    const [books] = await pool.query(
      `SELECT id, title, author, category, available_copies
         FROM books
        WHERE title LIKE ? OR author LIKE ? OR category LIKE ?
        LIMIT 5`,
      [like, like, like]
    );

    const [notices] = await pool.query(
      `SELECT id, title, description AS message,
              'ALL' AS audience, created_at AS published_at
         FROM notices
        WHERE title LIKE ? OR description LIKE ?
        ORDER BY created_at DESC
        LIMIT 5`,
      [like, like]
    );

    const [certificates] = await pool.query(
      `SELECT id, credential_uuid, title, issue_date, is_anchored
         FROM academic_credentials
        WHERE student_id = ?
          AND title LIKE ?
        ORDER BY issue_date DESC
        LIMIT 5`,
      [studentId, like]
    );

    const [subjects] = await pool.query(
      `SELECT DISTINCT s.id, s.name, s.code
         FROM subjects s
         JOIN class_subjects cs ON cs.subject_id = s.id
         JOIN enrollments e ON e.class_id = cs.class_id
        WHERE e.student_id = ?
          AND (s.name LIKE ? OR s.code LIKE ?)
        LIMIT 5`,
      [studentId, like, like]
    );

    res.json({
      success: true,
      data: { books, notices, certificates, subjects }
    });
  } catch (err) {
    next(err);
  }
}