import { pool } from '../config/db.js';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

async function getTeacherByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT id, employee_code, department FROM teachers WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

function todayCode() {
  const map = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  return map[new Date().getDay()];
}

function localDateISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function teacherOwnsClass(teacherId, classId) {
  const [rows] = await pool.query(
    'SELECT 1 FROM class_subjects WHERE teacher_id = ? AND class_id = ? LIMIT 1',
    [teacherId, classId]
  );
  return rows.length > 0;
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
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const [classRows] = await pool.query(
      `SELECT c.id, c.name, c.academic_year,
              COUNT(DISTINCT e.student_id) AS student_count
         FROM class_subjects cs
         JOIN classes c ON c.id = cs.class_id
         LEFT JOIN enrollments e ON e.class_id = c.id
        WHERE cs.teacher_id = ?
        GROUP BY c.id, c.name, c.academic_year
        ORDER BY c.name`,
      [teacher.id]
    );

    const totalStudents = classRows.reduce((s, c) => s + Number(c.student_count || 0), 0);
    const day = todayCode();

    const [scheduleRows] = await pool.query(
      `SELECT tt.id, tt.start_time, tt.end_time, tt.room,
              s.name AS subject, c.name AS class_name
         FROM timetable_entries tt
         JOIN subjects s ON s.id = tt.subject_id
         JOIN classes c ON c.id = tt.class_id
        WHERE tt.teacher_id = ? AND tt.day_of_week = ?
        ORDER BY tt.start_time`,
      [teacher.id, day]
    );

    const [noticeRows] = await pool.query(
      `SELECT id, title, audience, published_at
         FROM notices
        WHERE status = 'SENT'
          AND audience IN ('ALL','STAFF','TEACHERS')
          AND (recipient_id IS NULL OR recipient_id = ?)
        ORDER BY published_at DESC
        LIMIT 5`,
      [req.user.id]
    );

    let pendingAttendance = 0;
    for (const c of classRows) {
      const [rows] = await pool.query(
        `SELECT 1 FROM attendance
          WHERE class_id = ? AND attendance_date = ? AND marked_by_teacher_id = ?
          LIMIT 1`,
        [c.id, localDateISO(), teacher.id]
      );
      if (rows.length === 0) pendingAttendance++;
    }

    res.json({
      success: true,
      data: {
        kpis: {
          assignedClasses: classRows.length,
          totalStudents,
          todaySessions: scheduleRows.length,
          pendingAttendance
        },
        classes: classRows,
        todaySchedule: scheduleRows,
        day,
        recentNotices: noticeRows
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CLASSES
   ═══════════════════════════════════════════════════════════════ */

export async function getMyClasses(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.academic_year,
              COUNT(DISTINCT e.student_id) AS student_count,
              GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS subjects
         FROM class_subjects cs
         JOIN classes c ON c.id = cs.class_id
         JOIN subjects s ON s.id = cs.subject_id
         LEFT JOIN enrollments e ON e.class_id = c.id
        WHERE cs.teacher_id = ?
        GROUP BY c.id, c.name, c.academic_year
        ORDER BY c.name`,
      [teacher.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getClassDetail(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const classId = Number(req.params.classId);
    if (!(await teacherOwnsClass(teacher.id, classId))) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this class' });
    }

    const [classRow] = await pool.query(
      'SELECT id, name, academic_year FROM classes WHERE id = ? LIMIT 1',
      [classId]
    );
    if (classRow.length === 0) return res.status(404).json({ success: false, message: 'Class not found' });

    const [subjects] = await pool.query(
      `SELECT s.id, s.name, s.code
         FROM class_subjects cs
         JOIN subjects s ON s.id = cs.subject_id
        WHERE cs.teacher_id = ? AND cs.class_id = ?
        ORDER BY s.name`,
      [teacher.id, classId]
    );

    const [roster] = await pool.query(
      `SELECT u.id AS student_id, u.full_name AS name, u.school_id_number,
              e.roll_number
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
        WHERE e.class_id = ?
        ORDER BY e.roll_number`,
      [classId]
    );

    res.json({
      success: true,
      data: { class: classRow[0], subjects, roster }
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
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const classId = Number(req.query.class_id);
    const subjectId = req.query.subject_id ? Number(req.query.subject_id) : null;
    const date = req.query.date || localDateISO();

    if (!classId) return res.status(400).json({ success: false, message: 'class_id required' });
    if (!(await teacherOwnsClass(teacher.id, classId))) {
      return res.status(403).json({ success: false, message: 'Not your class' });
    }

    const [roster] = await pool.query(
      `SELECT u.id AS student_id, u.full_name AS name, u.school_id_number,
              e.roll_number
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
        WHERE e.class_id = ?
        ORDER BY e.roll_number`,
      [classId]
    );

    const params = [classId, date];
    let sql = `SELECT student_id, status FROM attendance
                WHERE class_id = ? AND attendance_date = ?`;
    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }
    const [saved] = await pool.query(sql, params);

    const savedMap = {};
    for (const r of saved) savedMap[r.student_id] = r.status;

    res.json({
      success: true,
      data: { classId, subjectId, date, roster, saved: savedMap }
    });
  } catch (err) {
    next(err);
  }
}

export async function saveAttendance(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { class_id, subject_id, date, entries } = req.body;

    if (!class_id || !subject_id || !date || !Array.isArray(entries)) {
      conn.release();
      return res.status(400).json({ success: false, message: 'class_id, subject_id, date, entries required' });
    }
    if (!(await teacherOwnsClass(teacher.id, class_id))) {
      conn.release();
      return res.status(403).json({ success: false, message: 'Not your class' });
    }

    await conn.beginTransaction();

    await conn.query(
      `DELETE FROM attendance
        WHERE class_id = ? AND subject_id = ? AND attendance_date = ?`,
      [class_id, subject_id, date]
    );

    for (const e of entries) {
      if (!e.student_id || !['PRESENT','ABSENT','LATE','LEAVE'].includes(e.status)) continue;
      await conn.query(
        `INSERT INTO attendance
           (student_id, class_id, subject_id, attendance_date, status, marked_by_teacher_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [e.student_id, class_id, subject_id, date, e.status, teacher.id]
      );
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Attendance saved for ${entries.length} student${entries.length === 1 ? '' : 's'}`,
      data: { saved: entries.length }
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    conn.release();
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   EXAMS & MARKS
   ═══════════════════════════════════════════════════════════════ */

export async function getExams(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const [rows] = await pool.query(
      `SELECT e.id, e.name AS exam_name, e.exam_date, e.full_marks,
              e.class_id, c.name AS class_name,
              e.subject_id, s.name AS subject, s.code AS subject_code,
              (SELECT COUNT(*) FROM exam_marks m WHERE m.exam_id = e.id AND m.submitted_at IS NOT NULL) AS marks_count
         FROM exams e
         JOIN classes c ON c.id = e.class_id
         JOIN subjects s ON s.id = e.subject_id
        WHERE e.created_by_teacher_id = ?
        ORDER BY e.exam_date DESC, e.id DESC`,
      [teacher.id]
    );

    const byKey = {};
    for (const r of rows) {
      const key = `${r.exam_name}|${r.class_id}`;
      if (!byKey[key]) {
        byKey[key] = {
          exam_name: r.exam_name,
          class_id: r.class_id,
          class_name: r.class_name,
          exam_date: r.exam_date,
          subjects: [],
          total_subjects: 0,
          marks_recorded: 0
        };
      }
      byKey[key].subjects.push({
        exam_id: r.id,
        subject_id: r.subject_id,
        subject: r.subject,
        subject_code: r.subject_code,
        full_marks: Number(r.full_marks),
        marks_count: Number(r.marks_count)
      });
      byKey[key].total_subjects++;
      byKey[key].marks_recorded += Number(r.marks_count);
    }

    res.json({ success: true, data: { exams: Object.values(byKey) } });
  } catch (err) {
    next(err);
  }
}

export async function getExamMarks(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const examId = Number(req.params.examId);

    const [examRow] = await pool.query(
      `SELECT e.id, e.name, e.class_id, e.subject_id, e.full_marks, e.exam_date,
              s.name AS subject, c.name AS class_name
         FROM exams e
         JOIN subjects s ON s.id = e.subject_id
         JOIN classes c ON c.id = e.class_id
        WHERE e.id = ? AND e.created_by_teacher_id = ?
        LIMIT 1`,
      [examId, teacher.id]
    );
    if (examRow.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    const exam = examRow[0];

    const [roster] = await pool.query(
      `SELECT u.id AS student_id, u.full_name AS name, e.roll_number,
              m.marks_obtained, m.grade, m.submitted_at
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         LEFT JOIN exam_marks m ON m.student_id = u.id AND m.exam_id = ?
        WHERE e.class_id = ?
        ORDER BY e.roll_number`,
      [examId, exam.class_id]
    );

    res.json({ success: true, data: { exam, roster } });
  } catch (err) {
    next(err);
  }
}

export async function saveExams(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { class_id, exam_name, exam_date, subjects } = req.body;

    if (!class_id || !exam_name || !exam_date || !Array.isArray(subjects) || subjects.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'class_id, exam_name, exam_date, subjects required' });
    }
    if (!(await teacherOwnsClass(teacher.id, class_id))) {
      conn.release();
      return res.status(403).json({ success: false, message: 'Not your class' });
    }

    await conn.beginTransaction();

    let examsTouched = 0;
    let marksSaved = 0;

    for (const sub of subjects) {
      if (!sub.subject_id || !Array.isArray(sub.marks)) continue;
      const fullMarks = Number(sub.full_marks) || 100;

      const [existing] = await conn.query(
        `SELECT id FROM exams
          WHERE name = ? AND class_id = ? AND subject_id = ? LIMIT 1`,
        [exam_name, class_id, sub.subject_id]
      );

      let examId;
      if (existing.length > 0) {
        examId = existing[0].id;
        await conn.query(
          `UPDATE exams SET full_marks = ?, exam_date = ? WHERE id = ?`,
          [fullMarks, exam_date, examId]
        );
      } else {
        const [ins] = await conn.query(
          `INSERT INTO exams (name, class_id, subject_id, full_marks, exam_date, created_by_teacher_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [exam_name, class_id, sub.subject_id, fullMarks, exam_date, teacher.id]
        );
        examId = ins.insertId;
      }
      examsTouched++;

      for (const m of sub.marks) {
        if (!m.student_id) continue;
        const obtained = m.marks_obtained === '' || m.marks_obtained == null
          ? null
          : Number(m.marks_obtained);
        const pct = obtained == null ? 0 : (obtained / fullMarks) * 100;
        const grade = obtained == null ? null : gradeFromPct(pct);
        const submittedAt = obtained == null ? null : new Date();

        await conn.query(
          `INSERT INTO exam_marks (exam_id, student_id, marks_obtained, grade, submitted_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             marks_obtained = VALUES(marks_obtained),
             grade = VALUES(grade),
             submitted_at = VALUES(submitted_at)`,
          [examId, m.student_id, obtained, grade, submittedAt]
        );
        if (obtained != null) marksSaved++;
      }
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Exams saved: ${examsTouched} subject${examsTouched === 1 ? '' : 's'}, ${marksSaved} mark${marksSaved === 1 ? '' : 's'}`,
      data: { examsTouched, marksSaved }
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    conn.release();
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   TIMETABLE
   ═══════════════════════════════════════════════════════════════ */

export async function getTimetable(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const [rows] = await pool.query(
      `SELECT tt.id, tt.day_of_week, tt.start_time, tt.end_time, tt.room,
              s.name AS subject, c.name AS class_name
         FROM timetable_entries tt
         JOIN subjects s ON s.id = tt.subject_id
         JOIN classes c ON c.id = tt.class_id
        WHERE tt.teacher_id = ?
        ORDER BY FIELD(tt.day_of_week,'MON','TUE','WED','THU','FRI','SAT'), tt.start_time`,
      [teacher.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY FEED — recent teacher actions
   ═══════════════════════════════════════════════════════════════ */

export async function getActivity(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    // Recent exam saves (grouped by exam name + class)
    const [exams] = await pool.query(
      `SELECT e.name AS title, c.name AS class_name,
              MAX(m.submitted_at) AS when_at,
              COUNT(m.id) AS count
         FROM exams e
         JOIN classes c ON c.id = e.class_id
         LEFT JOIN exam_marks m ON m.exam_id = e.id AND m.submitted_at IS NOT NULL
        WHERE e.created_by_teacher_id = ?
        GROUP BY e.name, e.class_id, c.name
        HAVING MAX(m.submitted_at) IS NOT NULL
        ORDER BY when_at DESC
        LIMIT 5`,
      [teacher.id]
    );

    // Recent attendance dates marked by this teacher
    const [attendance] = await pool.query(
      `SELECT a.attendance_date AS when_at,
              c.name AS class_name, s.name AS subject,
              COUNT(*) AS marked
         FROM attendance a
         JOIN classes c ON c.id = a.class_id
         LEFT JOIN subjects s ON s.id = a.subject_id
        WHERE a.marked_by_teacher_id = ?
        GROUP BY a.attendance_date, a.class_id, a.subject_id, c.name, s.name
        ORDER BY a.attendance_date DESC
        LIMIT 5`,
      [teacher.id]
    );

    // Merge into a single chronological list
    const events = [];

    for (const e of exams) {
      events.push({
        when: e.when_at,
        type: 'marks',
        title: `Marks saved — ${e.title}`,
        subtitle: `${e.class_name} · ${e.count} mark${e.count === 1 ? '' : 's'}`
      });
    }

    for (const a of attendance) {
      events.push({
        when: a.when_at,
        type: 'attendance',
        title: `Attendance marked — ${a.subject || 'class'}`,
        subtitle: `${a.class_name} · ${a.marked} student${a.marked === 1 ? '' : 's'}`
      });
    }

    events.sort((a, b) => new Date(b.when) - new Date(a.when));

    res.json({ success: true, data: events.slice(0, 8) });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PER-STUDENT ATTENDANCE SUMMARY
   ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/teacher/students/:studentId/attendance
 * Per-subject totals for one student. Only allowed if the student is
 * enrolled in a class this teacher owns.
 */
export async function getStudentAttendance(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const studentId = Number(req.params.studentId);

    // Verify the student is in a class this teacher owns
    const [perm] = await pool.query(
      `SELECT 1 FROM class_subjects cs
         JOIN enrollments e ON e.class_id = cs.class_id
        WHERE cs.teacher_id = ? AND e.student_id = ?
        LIMIT 1`,
      [teacher.id, studentId]
    );
    if (perm.length === 0) {
      return res.status(403).json({ success: false, message: 'Not your student' });
    }

    // Get basic student info
    const [studentRows] = await pool.query(
      `SELECT u.id, u.full_name, u.school_id_number,
              c.name AS class_name, e.roll_number
         FROM users u
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE u.id = ? LIMIT 1`,
      [studentId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [totals] = await pool.query(
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
      data: { student: studentRows[0], subjectTotals: totals }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   REOPEN EXAM — by name + class
   ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/teacher/exams/detail?name=X&class_id=Y
 * Returns the exam meta, roster, and per-subject existing marks
 * for a saved marksheet (identified by name + class).
 */
export async function getExamDetailByName(req, res, next) {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const name = req.query.name;
    const classId = Number(req.query.class_id);
    if (!name || !classId) {
      return res.status(400).json({ success: false, message: 'name and class_id required' });
    }

    // Confirm this teacher is assigned to the class
    if (!(await teacherOwnsClass(teacher.id, classId))) {
      return res.status(403).json({ success: false, message: 'Not your class' });
    }

    // Get all exam rows for this name + class (one per subject)
    const [examRows] = await pool.query(
      `SELECT e.id, e.subject_id, e.full_marks, e.exam_date,
              s.name AS subject, s.code AS subject_code
         FROM exams e
         JOIN subjects s ON s.id = e.subject_id
        WHERE e.name = ? AND e.class_id = ? AND e.created_by_teacher_id = ?
        ORDER BY s.name`,
      [name, classId, teacher.id]
    );
    if (examRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Roster for the class
    const [roster] = await pool.query(
      `SELECT u.id AS student_id, u.full_name AS name, u.school_id_number,
              e.roll_number
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
        WHERE e.class_id = ?
        ORDER BY e.roll_number`,
      [classId]
    );

    // Fetch all marks for these exams
    const examIds = examRows.map((e) => e.id);
    const [marks] = await pool.query(
      `SELECT exam_id, student_id, marks_obtained
         FROM exam_marks
        WHERE exam_id IN (?) AND submitted_at IS NOT NULL`,
      [examIds]
    );

    // Build a lookup: `${studentId}:${subjectId}` → marks
    const subjectByExam = {};
    for (const r of examRows) subjectByExam[r.id] = r.subject_id;

    const markLookup = {};
    for (const m of marks) {
      const subjectId = subjectByExam[m.exam_id];
      if (!subjectId) continue;
      markLookup[`${m.student_id}:${subjectId}`] = Number(m.marks_obtained);
    }

    res.json({
      success: true,
      data: {
        exam_name: name,
        class_id: classId,
        exam_date: examRows[0].exam_date,
        subjects: examRows.map((e) => ({
          subject_id: e.subject_id,
          subject: e.subject,
          subject_code: e.subject_code,
          full_marks: Number(e.full_marks)
        })),
        roster,
        marks: markLookup
      }
    });
  } catch (err) {
    next(err);
  }
}