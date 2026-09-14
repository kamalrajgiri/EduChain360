import { pool } from '../config/db.js';

function todayCode() {
  const map = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return map[new Date().getDay()];
}

/** Returns the student's single enrollment (class + roll) or null. */
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

/** Compute letter grade from percentage. */
function gradeFromPct(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

/**
 * GET /api/student/dashboard
 * Single round-trip: KPIs + today's timetable + recent notices + cert preview.
 */
export async function getDashboard(req, res, next) {
  try {
    const studentId = req.user.id;
    const enrollment = await getEnrollment(studentId);

    // --- Attendance this month ---
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

    // --- Latest submitted exam aggregate ---
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

    // --- Fee due ---
    const [feeRows] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status='UNPAID' THEN amount ELSE 0 END), 0) AS due,
         MIN(CASE WHEN status='UNPAID' THEN due_date END) AS next_due_date
       FROM fee_invoices
       WHERE student_id = ?`,
      [studentId]
    );

    // --- Certificate count ---
    const [certCntRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM academic_credentials WHERE student_id = ?`,
      [studentId]
    );

    // --- Recent certificates preview ---
    const [recentCerts] = await pool.query(
      `SELECT credential_uuid, title, issue_date, is_anchored
         FROM academic_credentials
        WHERE student_id = ?
        ORDER BY issue_date DESC
        LIMIT 2`,
      [studentId]
    );

    // --- Today's timetable ---
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

    // --- Recent notices (students see ALL + STUDENTS) ---
    const [noticeRows] = await pool.query(
      `SELECT id, title, audience, published_at
         FROM notices
        WHERE status = 'SENT'
          AND audience IN ('ALL','STUDENTS')
        ORDER BY published_at DESC
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

/**
 * GET /api/student/attendance
 * Monthly summary + last 30 entries + weekly timetable snapshot.
 */
export async function getAttendance(req, res, next) {
  try {
    const studentId = req.user.id;
    const enrollment = await getEnrollment(studentId);

    // Monthly summary
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

    // History — last 30 records, newest first
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

    // Weekly timetable snapshot (MON–FRI)
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

/**
 * GET /api/student/results
 * Exam results grouped by exam (latest first) + aggregate + class rank.
 */
export async function getResults(req, res, next) {
  try {
    const studentId = req.user.id;

    // All submitted marks with exam + subject
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

    // Group by exam
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

    // Class rank (based on the latest exam aggregate) — if enrolled
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

/**
 * GET /api/student/fees
 * Current term structure (invoices) + payment history (receipts).
 */
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

/**
 * GET /api/student/fees/receipts/:id
 * Single receipt detail (for the printable receipt page).
 * Row-level: 404 if the receipt doesn't belong to this student.
 */
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
 * GET /api/student/certificates
 */
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

/**
 * GET /api/student/certificates/:uuid
 * Single certificate detail for the QR view page.
 */
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

/**
 * GET /api/student/library
 * My borrowed books + catalog search (?q=...).
 */
export async function getLibrary(req, res, next) {
  try {
    const studentId = req.user.id;
    const query = (req.query.q || '').trim();

    // My issues (currently issued + history)
    const [myIssues] = await pool.query(
      `SELECT bi.id, bi.issued_on, bi.due_date, bi.returned_on, bi.status,
              b.title, b.author
         FROM book_issues bi
         JOIN books b ON b.id = bi.book_id
        WHERE bi.student_id = ?
        ORDER BY bi.issued_on DESC`,
      [studentId]
    );

    // Catalog search
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