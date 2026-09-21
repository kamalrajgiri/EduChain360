/**
 * Dev seed for the Student role.
 * Run AFTER the base seed (npm run seed) which creates the 8 user logins.
 *
 * Creates for Rajan Thapa (student@fwu.edu.np):
 *   • Class "Grade 11 Science A" + subjects + timetable (Mon–Fri)
 *   • Enrollment (roll 14)
 *   • Attendance for the last 30 days
 *   • One exam ("Mid-term 2083") with submitted marks
 *   • Fee invoices (Term 2) + receipts (2 past payments)
 *   • Certificates (Grade 10 transcript + character certificate)
 *   • Books + a borrowed book
 *   • Notices (shared with other roles)
 *
 * Run: npm run seed:student
 */
import { pool } from '../config/db.js';

const SUBJECTS = [
  { name: 'Physics',          code: 'PHY101' },
  { name: 'Mathematics',      code: 'MTH101' },
  { name: 'Chemistry',        code: 'CHM101' },
  { name: 'English',          code: 'ENG101' },
  { name: 'Computer Science', code: 'CSC101' }
];

const BOOKS = [
  { title: 'Concepts of Physics Vol 1',       author: 'H. C. Verma',    category: 'Physics',   copies: 5 },
  { title: 'Organic Chemistry for Grade 11',  author: 'P. Bahadur',     category: 'Chemistry', copies: 3 },
  { title: 'Advanced Organic Chemistry',      author: 'R. T. Morrison', category: 'Chemistry', copies: 2 },
  { title: 'Higher Algebra',                  author: 'Hall & Knight',  category: 'Mathematics', copies: 4 }
];

const NOTICES = [
  { title: 'Entrance exam admit cards published', message: 'Admit cards for Grade 11 entrance are now available.', audience: 'ALL' },
  { title: 'Mid-term fee deadline: Sep 15',       message: 'All outstanding term fees must be paid by Sep 15, 2026.', audience: 'STUDENTS' },
  { title: 'Science fair registration open',      message: 'Register with your class teacher by end of this month.', audience: 'STUDENTS' }
];

// ---------- helpers ----------
async function getUserIdByEmail(email) {
  const [r] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  return r[0]?.id || null;
}

async function ensureClass(name, year) {
  const [r] = await pool.query(
    'SELECT id FROM classes WHERE name = ? AND academic_year = ? LIMIT 1',
    [name, year]
  );
  if (r.length) return r[0].id;
  const [ins] = await pool.query(
    'INSERT INTO classes (name, academic_year) VALUES (?, ?)',
    [name, year]
  );
  return ins.insertId;
}

async function ensureSubject(name, code) {
  const [r] = await pool.query('SELECT id FROM subjects WHERE code = ? LIMIT 1', [code]);
  if (r.length) return r[0].id;
  const [ins] = await pool.query(
    'INSERT INTO subjects (name, code, full_marks) VALUES (?, ?, 100)',
    [name, code]
  );
  return ins.insertId;
}

async function ensureBook(b) {
  const [r] = await pool.query('SELECT id FROM books WHERE title = ? LIMIT 1', [b.title]);
  if (r.length) return r[0].id;
  const [ins] = await pool.query(
    'INSERT INTO books (title, author, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)',
    [b.title, b.author, b.category, b.copies, b.copies]
  );
  return ins.insertId;
}

async function ensureNotice(n, adminId) {
  const [r] = await pool.query('SELECT id FROM notices WHERE title = ? LIMIT 1', [n.title]);
  if (r.length) return;
  await pool.query(
    `INSERT INTO notices (title, description)
     VALUES (?, ?)`,
    [n.title, n.message]
  );
}

// ---------- main ----------
async function main() {
  try {
    console.log('🌱 Seeding student data...');

    // 1. Student + admin
    const studentId = await getUserIdByEmail('student@fwu.edu.np');
    if (!studentId) {
      console.error('❌ Run `npm run seed` first (creates the 8 role logins).');
      process.exit(1);
    }
    const adminId = await getUserIdByEmail('admin@fwu.edu.np');

    // 2. Class + subjects
    const classId = await ensureClass('Grade 11 Science A', '2083/2084');
    const subjectIds = {};
    for (const s of SUBJECTS) subjectIds[s.code] = await ensureSubject(s.name, s.code);

    // 3. Enroll Rajan (roll 14) if not already
    const [enr] = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? LIMIT 1',
      [studentId, classId]
    );
    if (enr.length === 0) {
      await pool.query(
        'INSERT INTO enrollments (student_id, class_id, roll_number) VALUES (?, ?, ?)',
        [studentId, classId, 14]
      );
    }

    // 4. Assign a teacher to Physics for this class (use Deepak if present)
    const teacherId = (await pool.query(
      `SELECT t.id FROM teachers t JOIN users u ON u.id = t.user_id
        WHERE u.email = 'teacher@fwu.edu.np' LIMIT 1`
    ))[0][0]?.id || null;

    const codesForClass = ['PHY101','MTH101','CHM101','ENG101','CSC101'];
    for (const code of codesForClass) {
      await pool.query(
        `INSERT IGNORE INTO class_subjects (class_id, subject_id, teacher_id)
         VALUES (?, ?, ?)`,
        [classId, subjectIds[code], teacherId]
      );
    }

    // 5. Timetable (Mon–Fri, 4 periods)
    await pool.query('DELETE FROM timetable_entries WHERE class_id = ?', [classId]);
    const days = ['MON','TUE','WED','THU','FRI'];
    const periods = [
      { start: '10:00:00', end: '10:45:00' },
      { start: '10:45:00', end: '11:30:00' },
      { start: '11:45:00', end: '12:30:00' },
      { start: '13:15:00', end: '14:00:00' }
    ];
    const rot = ['PHY101','MTH101','CHM101','ENG101'];
    for (const day of days) {
      for (let i = 0; i < 4; i++) {
        await pool.query(
          `INSERT INTO timetable_entries
             (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [classId, subjectIds[rot[i]], teacherId, day,
           periods[i].start, periods[i].end, `Room ${14 + i}`]
        );
      }
    }

    // 6. Attendance — last 30 days, mostly present
    await pool.query('DELETE FROM attendance WHERE student_id = ?', [studentId]);
    const today = new Date();
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dow = date.getDay(); // 0=Sun, 6=Sat
      if (dow === 0 || dow === 6) continue; // skip weekends
      const iso = date.toISOString().slice(0, 10);
      // 90% present, 5% late, 5% absent pattern
      const rnd = Math.random();
      const status = rnd < 0.9 ? 'PRESENT' : rnd < 0.95 ? 'LATE' : 'ABSENT';
      await pool.query(
        `INSERT INTO attendance
           (student_id, class_id, subject_id, attendance_date, status, marked_by_teacher_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, classId, subjectIds.PHY101, iso, status, teacherId]
      );
    }

    // 7. Exam + submitted marks
    const [examExist] = await pool.query(
      `SELECT id FROM exams WHERE name = 'Mid-term 2083' AND class_id = ? LIMIT 1`,
      [classId]
    );
    let examId;
    if (examExist.length) {
      examId = examExist[0].id;
    } else {
      const [ins] = await pool.query(
        `INSERT INTO exams (name, class_id, subject_id, full_marks, exam_date, created_by_teacher_id)
         VALUES ('Mid-term 2083', ?, ?, 100, CURDATE(), ?)`,
        [classId, subjectIds.PHY101, teacherId]
      );
      examId = ins.insertId;
    }

    // Marks per subject — I'll create one exam row per subject for realism
    const subjectMarks = {
      PHY101: 89, MTH101: 91, CHM101: 84, ENG101: 78, CSC101: 85
    };
    for (const code of Object.keys(subjectMarks)) {
      const [exist] = await pool.query(
        `SELECT id FROM exams WHERE name = 'Mid-term 2083' AND class_id = ? AND subject_id = ? LIMIT 1`,
        [classId, subjectIds[code]]
      );
      let eid;
      if (exist.length) {
        eid = exist[0].id;
      } else {
        const [ins] = await pool.query(
          `INSERT INTO exams (name, class_id, subject_id, full_marks, exam_date, created_by_teacher_id)
           VALUES ('Mid-term 2083', ?, ?, 100, CURDATE(), ?)`,
          [classId, subjectIds[code], teacherId]
        );
        eid = ins.insertId;
      }
      await pool.query(
        `INSERT INTO exam_marks (exam_id, student_id, marks_obtained, grade, submitted_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained),
                                 grade = VALUES(grade),
                                 submitted_at = VALUES(submitted_at)`,
        [eid, studentId, subjectMarks[code], gradeFromPct(subjectMarks[code])]
      );
    }

    // 8. Fee invoices (Term 2, 2083/2084)
    await pool.query('DELETE FROM fee_invoices WHERE student_id = ? AND term = ?',
      [studentId, 'Term 2, 2083/2084']);
    const invoices = [
      { head: 'Tuition fee',    amount: 3500, due: '2026-09-15', status: 'UNPAID' },
      { head: 'Examination fee',amount: 500,  due: '2026-09-15', status: 'UNPAID' },
      { head: 'Library fee',    amount: 200,  due: '2026-07-01', status: 'PAID'   },
      { head: 'Lab fee',        amount: 300,  due: '2026-09-15', status: 'UNPAID' }
    ];
    for (const inv of invoices) {
      await pool.query(
        `INSERT INTO fee_invoices (student_id, term, fee_head, amount, due_date, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, 'Term 2, 2083/2084', inv.head, inv.amount, inv.due, inv.status]
      );
    }

    // 9. Fee receipts (2 past payments)
    const [rcExist] = await pool.query(
      'SELECT id FROM fee_receipts WHERE student_id = ? LIMIT 1', [studentId]
    );
    if (rcExist.length === 0) {
      const receipts = [
        { num: 'RCPT-2083-1187', amount: 4200, method: 'eSewa',    date: '2026-07-02' },
        { num: 'RCPT-2083-0942', amount: 4200, method: 'Khalti',   date: '2026-04-05' }
      ];
      for (const r of receipts) {
        await pool.query(
          `INSERT INTO fee_receipts
             (receipt_number, student_id, amount, payment_status, payment_method, created_at)
           VALUES (?, ?, ?, 'PAID', ?, ?)`,
          [r.num, studentId, r.amount, r.method, r.date]
        );
      }
    }

    // 10. Certificates
    const certs = [
      { uuid: 'CERT-2083-3391', title: 'Grade 10 Academic Transcript',   date: '2026-09-02' },
      { uuid: 'CERT-2083-2840', title: 'Character Certificate',          date: '2026-08-15' }
    ];
    for (const c of certs) {
      const [ex] = await pool.query(
        'SELECT id FROM academic_credentials WHERE credential_uuid = ? LIMIT 1', [c.uuid]
      );
      if (ex.length === 0) {
        await pool.query(
          `INSERT INTO academic_credentials
             (credential_uuid, student_id, title, issue_date, document_hash, is_anchored)
           VALUES (?, ?, ?, ?, NULL, 0)`,
          [c.uuid, studentId, c.title, c.date]
        );
      }
    }

    // 11. Books + one issue
    const bookIds = {};
    for (const b of BOOKS) bookIds[b.title] = await ensureBook(b);

    const [issueExist] = await pool.query(
      'SELECT id FROM book_issues WHERE student_id = ? AND returned_on IS NULL LIMIT 1',
      [studentId]
    );
    if (issueExist.length === 0) {
      await pool.query(
        `INSERT INTO book_issues (book_id, student_id, issued_on, due_date, status)
         VALUES (?, ?, ?, ?, 'ISSUED')`,
        [bookIds['Concepts of Physics Vol 1'], studentId, '2026-09-01', '2026-09-15']
      );
      await pool.query(
        `UPDATE books SET available_copies = available_copies - 1
          WHERE id = ? AND available_copies > 0`,
        [bookIds['Concepts of Physics Vol 1']]
      );
    }

    // 12. Notices
    for (const n of NOTICES) await ensureNotice(n, adminId);

    console.log('✅ Student seed complete:');
    console.log('   • Class: Grade 11 Science A (2083/2084)');
    console.log('   • Rajan enrolled as Roll 14');
    console.log('   • Attendance for last 30 days');
    console.log('   • Mid-term exam with submitted marks (5 subjects)');
    console.log('   • Fee invoices (4) + receipts (2)');
    console.log('   • Certificates (2)');
    console.log('   • Books + 1 active issue');
    console.log('   • Notices (3)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Student seed failed:', err);
    process.exit(1);
  }
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

main();