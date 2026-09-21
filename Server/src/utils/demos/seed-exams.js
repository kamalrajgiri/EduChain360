/**
 * Dev seed — multiple exams for Grade 11 Science A
 * Run AFTER: npm run seed && npm run seed:student
 *
 * Run: npm run seed:exams
 */
import { pool } from '../config/db.js';

const EXAMS = [
  { name: 'First Internal',   date: '2026-06-10', scores: { PHY101: 18, MTH101: 17, CHM101: 16, ENG101: 15, CSC101: 17 } },
  { name: 'Monthly Test',     date: '2026-07-15', scores: { PHY101: 22, MTH101: 24, CHM101: 20, ENG101: 18, CSC101: 21 } },
  { name: 'Mid-term 2083',    date: '2026-09-03', scores: { PHY101: 89, MTH101: 91, CHM101: 84, ENG101: 78, CSC101: 85 } },
  { name: 'Second Internal',  date: '2026-09-18', scores: { PHY101: 19, MTH101: 20, CHM101: 18, ENG101: 17, CSC101: 19 } }
];

// Out of 25 for internal/monthly, out of 100 for mid-term
const FULL_MARKS = {
  'First Internal': 25,
  'Monthly Test': 25,
  'Mid-term 2083': 100,
  'Second Internal': 25
};

function gradeFromPct(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

async function main() {
  try {
    console.log('🌱 Seeding multiple exams...');

    // Get the student + class + subjects
    const [studentRow] = await pool.query(
      `SELECT u.id FROM users u WHERE u.email = 'student@fwu.edu.np' LIMIT 1`
    );
    if (studentRow.length === 0) {
      console.error('❌ Run `npm run seed:student` first.');
      process.exit(1);
    }
    const studentId = studentRow[0].id;

    const [classRow] = await pool.query(
      `SELECT id FROM classes WHERE name = 'Grade 11 Science A' LIMIT 1`
    );
    if (classRow.length === 0) {
      console.error('❌ Class not found. Run `npm run seed:student` first.');
      process.exit(1);
    }
    const classId = classRow[0].id;

    const [subjectRows] = await pool.query(
      `SELECT id, code FROM subjects WHERE code IN ('PHY101','MTH101','CHM101','ENG101','CSC101')`
    );
    const subjectByCode = Object.fromEntries(subjectRows.map((s) => [s.code, s.id]));

    const [teacherRows] = await pool.query(
      `SELECT t.id FROM teachers t JOIN users u ON u.id = t.user_id
        WHERE u.email = 'teacher@fwu.edu.np' LIMIT 1`
    );
    const teacherId = teacherRows[0]?.id || null;

    let examsCreated = 0;
    let marksCreated = 0;

    for (const ex of EXAMS) {
      for (const [code, obtained] of Object.entries(ex.scores)) {
        const subjectId = subjectByCode[code];
        if (!subjectId) continue;

        const full = FULL_MARKS[ex.name] || 100;

        // Upsert exam row
        const [existing] = await pool.query(
          `SELECT id FROM exams
            WHERE name = ? AND class_id = ? AND subject_id = ? LIMIT 1`,
          [ex.name, classId, subjectId]
        );

        let examId;
        if (existing.length > 0) {
          examId = existing[0].id;
          await pool.query(
            `UPDATE exams SET full_marks = ?, exam_date = ? WHERE id = ?`,
            [full, ex.date, examId]
          );
        } else {
          const [ins] = await pool.query(
            `INSERT INTO exams (name, class_id, subject_id, full_marks, exam_date, created_by_teacher_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ex.name, classId, subjectId, full, ex.date, teacherId]
          );
          examId = ins.insertId;
          examsCreated++;
        }

        // Upsert mark
        const pct = (obtained / full) * 100;
        const grade = gradeFromPct(pct);
        await pool.query(
          `INSERT INTO exam_marks (exam_id, student_id, marks_obtained, grade, submitted_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained),
                                   grade = VALUES(grade),
                                   submitted_at = VALUES(submitted_at)`,
          [examId, studentId, obtained, grade]
        );
        marksCreated++;
      }
    }

    console.log('✅ Exam seed complete:');
    console.log(`   • ${examsCreated} exams created (existing kept)`);
    console.log(`   • ${marksCreated} marks recorded`);
    console.log(`   • Exams: ${EXAMS.map((e) => e.name).join(', ')}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Exam seed failed:', err);
    process.exit(1);
  }
}

main();