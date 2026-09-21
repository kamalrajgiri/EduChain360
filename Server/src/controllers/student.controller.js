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

// Notices visible to THIS student only:
//   • private notices addressed to them (recipient_id = studentId), OR
//   • public notices with audience ALL/STUDENTS
const [noticeRows] = await pool.query(
  `SELECT id, title, audience, recipient_id, published_at
     FROM notices
    WHERE status = 'SENT'
      AND (
        recipient_id = ?
        OR (recipient_id IS NULL AND audience IN ('ALL','STUDENTS'))
      )
    ORDER BY published_at DESC
    LIMIT 5`,
  [studentId]
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

    // ─── Overall monthly summary (current month) ─────
    const [summaryRows] = await pool.query(
      `SELECT
         COUNT(*)                 AS total,
         SUM(status='PRESENT')    AS present,
         SUM(status='LATE')       AS late,
         SUM(status='ABSENT')     AS absent,
         SUM(status='LEAVE')      AS leave_count
       FROM attendance
       WHERE student_id = ?
         AND YEAR(attendance_date)  = YEAR(CURDATE())
         AND MONTH(attendance_date) = MONTH(CURDATE())`,
      [studentId]
    );
    const summary = summaryRows[0] || { total: 0, present: 0, late: 0, absent: 0, leave_count: 0 };
    const pct = Number(summary.total) > 0
      ? Math.round((Number(summary.present) / Number(summary.total)) * 1000) / 10
      : 0;

    // ─── Subject-wise totals (this academic year) ─────
    const [subjectTotals] = await pool.query(
      `SELECT s.id AS subject_id, s.name AS subject, s.code,
              COUNT(*) AS total,
              SUM(a.status='PRESENT') AS present,
              SUM(a.status='LATE')    AS late,
              SUM(a.status='ABSENT')  AS absent,
              SUM(a.status='LEAVE')   AS leave_count
         FROM attendance a
         JOIN subjects s ON s.id = a.subject_id
        WHERE a.student_id = ?
        GROUP BY s.id, s.name, s.code
        ORDER BY s.name`,
      [studentId]
    );

    // ─── History (last 30) ─────────────────────────────
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

    // ─── Weekly timetable snapshot ─────────────────────
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
        subjectTotals,
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
      `SELECT id, term, fee_head, amount, amount_paid, due_date, status
         FROM fee_invoices
        WHERE student_id = ?
        ORDER BY due_date IS NULL, due_date, fee_head`,
      [studentId]
    );

    const [receiptRows] = await pool.query(
      `SELECT id, receipt_number, amount, payment_method, payment_status,
              receipt_hash, is_anchored, created_at, notes
         FROM fee_receipts
        WHERE student_id = ?
        ORDER BY created_at DESC`,
      [studentId]
    );

    const [adjRows] = await pool.query(
      `SELECT id, type, amount, reason, created_at
         FROM fee_adjustments
        WHERE student_id = ?
        ORDER BY created_at DESC`,
      [studentId]
    );

    const totalDue = invoiceRows
      .filter((r) => r.status !== 'PAID')
      .reduce((s, r) => s + (Number(r.amount) - Number(r.amount_paid)), 0);

    const adjTotals = adjRows.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + Number(a.amount);
      return acc;
    }, { FINE: 0, DISCOUNT: 0, ADDITIONAL: 0 });

    const netDue = Math.max(
      0,
      totalDue + adjTotals.FINE + adjTotals.ADDITIONAL - adjTotals.DISCOUNT
    );

    // Payment type: was the student's last payment partial/full/advance?
    // Advance = payment exceeded outstanding at time of payment (we approximate:
    // sum(payments) > sum(invoices fully settled))
    const totalInvoiced = invoiceRows.reduce((s, r) => s + Number(r.amount), 0);
    const totalPaid = receiptRows.reduce((s, r) => s + Number(r.amount), 0);
    const paymentTrend = totalPaid > totalInvoiced ? 'ADVANCE'
                       : totalPaid === 0 ? 'NONE'
                       : 'PARTIAL_OR_FULL';

    res.json({
      success: true,
      data: {
        invoices: invoiceRows,
        receipts: receiptRows,
        adjustments: adjRows,
        totalDue,
        netDue,
        adjustmentTotals: adjTotals,
        summary: {
          totalInvoiced,
          totalPaid,
          paymentTrend
        }
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
 * Body: { amount, method }
 *
 * Supports:
 *   • Partial payment (amount < outstanding)
 *   • Full payment (amount == outstanding)
 *   • Advance payment (amount > outstanding) — extra kept as credit
 *   • Offline methods (Cash/Cheque/Bank slip) → PENDING receipt,
 *     invoices NOT marked paid until accounts confirms
 *   • Online methods (eSewa/Khalti/Bank transfer) → PAID receipt immediately
 */
export async function payFees(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const studentId = req.user.id;
    const { amount, method } = req.body;

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    const OFFLINE = ['Cash', 'Cheque', 'Bank slip'];
    const ONLINE  = ['eSewa', 'Khalti', 'Bank transfer'];
    const ALL = [...ONLINE, ...OFFLINE];

    if (!ALL.includes(method)) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const isOffline = OFFLINE.includes(method);

    // Current outstanding
    const [rows] = await conn.query(
      `SELECT COALESCE(SUM(amount - amount_paid), 0) AS due
         FROM fee_invoices
        WHERE student_id = ? AND status IN ('UNPAID','PARTIAL')`,
      [studentId]
    );
    const totalDue = Number(rows[0].due);

    if (totalDue === 0 && !isOffline) {
      conn.release();
      return res.status(400).json({ success: false, message: 'No outstanding dues' });
    }

    await conn.beginTransaction();

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = isOffline ? 'PENDING' : 'PAID';
    const note = isOffline
      ? 'Student-initiated offline payment — awaiting accounts confirmation'
      : null;

    const [ins] = await conn.query(
      `INSERT INTO fee_receipts
         (receipt_number, student_id, amount, payment_status, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [receiptNumber, studentId, amt, status, method, note]
    );
    const receiptId = ins.insertId;

    let invoicesFullyPaid = 0;
    let invoicesPartiallyPaid = 0;
    let remaining = amt;

    // Only allocate against invoices for ONLINE payments
    if (!isOffline) {
      const [invoices] = await conn.query(
        `SELECT id, amount, amount_paid
           FROM fee_invoices
          WHERE student_id = ? AND status IN ('UNPAID','PARTIAL')
          ORDER BY due_date IS NULL, due_date, id`,
        [studentId]
      );

      for (const inv of invoices) {
        if (remaining <= 0) break;
        const owed = Number(inv.amount) - Number(inv.amount_paid);
        if (owed <= 0) continue;

        if (remaining >= owed) {
          await conn.query(
            `UPDATE fee_invoices SET amount_paid = amount, status = 'PAID' WHERE id = ?`,
            [inv.id]
          );
          remaining -= owed;
          invoicesFullyPaid++;
        } else {
          await conn.query(
            `UPDATE fee_invoices SET amount_paid = amount_paid + ?, status = 'PARTIAL' WHERE id = ?`,
            [remaining, inv.id]
          );
          remaining = 0;
          invoicesPartiallyPaid++;
        }
      }
    }

    await conn.commit();
    conn.release();

    const parts = [];
    if (invoicesFullyPaid > 0)  parts.push(`${invoicesFullyPaid} invoice${invoicesFullyPaid === 1 ? '' : 's'} paid`);
    if (invoicesPartiallyPaid > 0) parts.push(`${invoicesPartiallyPaid} partially paid`);
    if (remaining > 0 && !isOffline) parts.push(`NPR ${remaining.toLocaleString('en-IN')} kept as credit`);

    const message = isOffline
      ? 'Offline payment recorded — awaiting confirmation from the accounts office'
      : `Payment recorded${parts.length ? '. ' + parts.join(', ') + '.' : '.'}`;

    res.json({
      success: true,
      message,
      data: {
        receiptId,
        receiptNumber,
        amount: amt,
        method,
        status,
        invoicesFullyPaid,
        invoicesPartiallyPaid,
        credit: isOffline ? 0 : remaining
      }
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
      `SELECT id, credential_uuid, verify_code, title, issue_date,
              document_hash, is_anchored, created_at
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
      `SELECT c.id, c.credential_uuid, c.verify_code, c.title, c.issue_date,
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
      `SELECT id, title, message, audience, published_at
         FROM notices
        WHERE status = 'SENT'
          AND audience IN ('ALL','STUDENTS')
        ORDER BY published_at DESC`
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
      `SELECT id, title, message, audience, published_at,
              (SELECT full_name FROM users WHERE id = published_by) AS published_by_name
         FROM notices
        WHERE id = ?
          AND status = 'SENT'
          AND audience IN ('ALL','STUDENTS')
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

/**
 * GET /api/student/attendance/calendar?month=YYYY-MM
 * Returns day-by-day status for one month + subject-wise totals.
 * If a day has multiple subject rows, we merge into a single day
 * status: if ANY subject is ABSENT → ABSENT; else if ANY LATE → LATE;
 * else if ANY PRESENT → PRESENT; else if all LEAVE → LEAVE; else NO_DATA.
 */
export async function getAttendanceCalendar(req, res, next) {
  try {
    const studentId = req.user.id;
    const monthParam = req.query.month || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(monthParam)) {
      return res.status(400).json({ success: false, message: 'month must be YYYY-MM' });
    }

    const [y, m] = monthParam.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay  = new Date(y, m, 0);

    const [rows] = await pool.query(
      `SELECT attendance_date, status,
              s.name AS subject,
              s.id AS subject_id
         FROM attendance a
         LEFT JOIN subjects s ON s.id = a.subject_id
        WHERE a.student_id = ?
          AND YEAR(a.attendance_date) = ?
          AND MONTH(a.attendance_date) = ?
        ORDER BY a.attendance_date, s.name`,
      [studentId, y, m]
    );

    // Group by day
    const byDay = {};
    for (const r of rows) {
      const key = String(r.attendance_date).slice(0, 10);
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(r);
    }

    function pickDayStatus(statuses) {
      if (statuses.includes('ABSENT'))  return 'ABSENT';
      if (statuses.includes('LATE'))    return 'LATE';
      if (statuses.includes('PRESENT')) return 'PRESENT';
      if (statuses.every((s) => s === 'LEAVE')) return 'LEAVE';
      return 'NO_DATA';
    }

    const days = [];
    const totalDaysInMonth = lastDay.getDate();
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(y, m - 1, d);
      const key = date.toISOString().slice(0, 10);
      const dow = date.getDay(); // 0=Sun, 6=Sat

      const entries = byDay[key] || [];
      const statuses = entries.map((e) => e.status);
      const status = entries.length === 0
        ? (dow === 0 || dow === 6 ? 'HOLIDAY' : 'NO_DATA')
        : pickDayStatus(statuses);

      days.push({
        date: key,
        day: d,
        dow,
        status,
        hasData: entries.length > 0,
        subjects: entries.map((e) => ({ subject: e.subject, status: e.status }))
      });
    }

    // Month summary
    const statusCount = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, NO_DATA: 0, HOLIDAY: 0 };
    for (const d of days) statusCount[d.status] = (statusCount[d.status] || 0) + 1;

    // Subject-wise totals (whole academic year up to now)
    const [subjectTotals] = await pool.query(
      `SELECT s.id AS subject_id, s.name AS subject, s.code,
              COUNT(*) AS total,
              SUM(a.status='PRESENT') AS present,
              SUM(a.status='LATE')    AS late,
              SUM(a.status='ABSENT')  AS absent,
              SUM(a.status='LEAVE')   AS leave_count
         FROM attendance a
         JOIN subjects s ON s.id = a.subject_id
        WHERE a.student_id = ?
        GROUP BY s.id, s.name, s.code
        ORDER BY s.name`,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        month: monthParam,
        days,
        monthSummary: statusCount,
        subjectTotals
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/student/exams
 * All exams the student has marks for, grouped.
 * Each exam includes all subjects (across the exam).
 * Returns exams sorted newest first.
 */
/**
 * GET /api/student/exams
 * Groups marks by exam_name so one exam (e.g. "Mid-term 2083")
 * shows ALL subjects together. Also infers the exam type from its name.
 */
export async function getAllExams(req, res, next) {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT e.id AS exam_row_id, e.name AS exam_name,
              e.exam_date, e.full_marks,
              s.name AS subject, s.code AS subject_code,
              m.marks_obtained, m.grade, m.submitted_at
         FROM exam_marks m
         JOIN exams    e ON e.id = m.exam_id
         JOIN subjects s ON s.id = e.subject_id
        WHERE m.student_id = ? AND m.submitted_at IS NOT NULL
        ORDER BY e.exam_date ASC, e.id, s.name`,
      [studentId]
    );

    // Group by exam_name — one exam = many subjects
    const byName = {};
    for (const r of rows) {
      const key = r.exam_name;
      if (!byName[key]) {
        byName[key] = {
          exam_name: r.exam_name,
          exam_date: r.exam_date,
          exam_type: inferExamType(r.exam_name),
          subjects: []
        };
      }
      byName[key].subjects.push({
        subject: r.subject,
        subject_code: r.subject_code,
        full_marks: Number(r.full_marks),
        marks_obtained: Number(r.marks_obtained),
        grade: r.grade
      });
    }

    // Compute aggregate per exam
    const exams = Object.values(byName).map((ex) => {
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

    // Newest first for the report-card switcher
    exams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));

    res.json({ success: true, data: { exams } });
  } catch (err) {
    next(err);
  }
}

/**
 * Nepal-common exam type inference from name.
 * Doesn't require a schema change.
 */
function inferExamType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('internal'))                        return 'Internal';
  if (n.includes('monthly') || n.includes('unit'))   return 'Monthly';
  if (n.includes('mid'))                             return 'Mid-Term';
  if (n.includes('pre-board') || n.includes('preboard')) return 'Pre-Board';
  if (n.includes('final') || n.includes('annual'))   return 'Final';
  return 'Assessment';
}