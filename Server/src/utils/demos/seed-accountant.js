/**
 * Dev seed for the Accountant role.
 * Run AFTER: npm run seed && npm run seed:student
 *
 * Creates:
 *   • 6 more students enrolled in Grade 11 Science A
 *   • Fee invoices for those students (matching Rajan's term/heads)
 *   • Paid receipts from multiple students across methods
 *   • Fee structure entries for Grade 11 Science A
 *
 * Run: npm run seed:accountant
 */
import { pool } from '../config/db.js';

const STUDENTS = [
  { name: 'Anisha Joshi',   email: 'anisha@fwu.edu.np',   sid: 'STU-001' },
  { name: 'Manish Bohara',  email: 'manish@fwu.edu.np',   sid: 'STU-003' },
  { name: 'Priya Chand',    email: 'priya@fwu.edu.np',    sid: 'STU-004' },
  { name: 'Sujata Bhandari',email: 'sujata@fwu.edu.np',   sid: 'STU-005' },
  { name: 'Bikash Rawal',   email: 'bikash@fwu.edu.np',   sid: 'STU-006' },
  { name: 'Nabin Bam',      email: 'nabin@fwu.edu.np',    sid: 'STU-007' }
];

const INVOICES_TEMPLATE = [
  { head: 'Tuition fee',     amount: 3500, due: '2026-09-15' },
  { head: 'Examination fee', amount: 500,  due: '2026-09-15' },
  { head: 'Library fee',     amount: 200,  due: '2026-07-01' },
  { head: 'Lab fee',         amount: 300,  due: '2026-09-15' }
];

const METHODS = ['eSewa', 'Khalti', 'Bank transfer'];

const FEE_STRUCTURE = [
  { fee_head: 'Tuition fee',     amount: 3500, is_mandatory: true  },
  { fee_head: 'Examination fee', amount: 500,  is_mandatory: true  },
  { fee_head: 'Library fee',     amount: 200,  is_mandatory: true  },
  { fee_head: 'Lab fee',         amount: 300,  is_mandatory: true  }
];

async function getRoleId(name) {
  const [r] = await pool.query('SELECT id FROM roles WHERE name = ?', [name]);
  return r[0]?.id;
}

async function upsertStudent(s) {
  // Look up by school_id_number OR email (either may already exist)
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE school_id_number = ? OR email = ? LIMIT 1',
    [s.sid, s.email]
  );
  if (existing.length) return existing[0].id;

  const roleId = await getRoleId('Student');
  const [res] = await pool.query(
    `INSERT INTO users (school_id_number, full_name, email, password_hash, role_id)
     VALUES (?, ?, ?, ?, ?)`,
    [s.sid, s.name, s.email, 'student123', roleId]
  );
  return res.insertId;
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  try {
    console.log('🌱 Seeding accountant data...');

    // 1. Class
    const [classRow] = await pool.query(
      `SELECT id FROM classes WHERE name = 'Grade 11 Science A' LIMIT 1`
    );
    if (classRow.length === 0) {
      console.error('❌ Run `npm run seed:student` first (creates the class).');
      process.exit(1);
    }
    const classId = classRow[0].id;

    // 2. Upsert students + enroll (roll 15+)
    let roll = 15;
    const studentIds = [];
    for (const s of STUDENTS) {
      const id = await upsertStudent(s);
      studentIds.push(id);

      const [exists] = await pool.query(
        'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?',
        [id, classId]
      );
      if (exists.length === 0) {
        await pool.query(
          'INSERT INTO enrollments (student_id, class_id, roll_number) VALUES (?, ?, ?)',
          [id, classId, roll++]
        );
      }
    }

    // 3. Fee structure
    const [fsCount] = await pool.query(
      `SELECT COUNT(*) AS c FROM fee_structure
        WHERE class_id = ? AND academic_year = '2083/2084' AND term = 'Term 2, 2083/2084'`,
      [classId]
    );
    if (Number(fsCount[0].c) === 0) {
      for (const f of FEE_STRUCTURE) {
        await pool.query(
          `INSERT IGNORE INTO fee_structure
             (class_id, academic_year, term, fee_head, amount, is_mandatory)
           VALUES (?, '2083/2084', 'Term 2, 2083/2084', ?, ?, ?)`,
          [classId, f.fee_head, f.amount, f.is_mandatory]
        );
      }
      console.log(`   • ${FEE_STRUCTURE.length} fee structure entries`);
    }

    // 4. Invoices + receipts for each new student
    let receiptsCreated = 0;
    for (const studentId of studentIds) {
      // Check if already has invoices
      const [invExists] = await pool.query(
        `SELECT id FROM fee_invoices
          WHERE student_id = ? AND term = 'Term 2, 2083/2084' LIMIT 1`,
        [studentId]
      );

      // ~70% of students pay in full; the rest leave some unpaid
      const willPay = Math.random() < 0.7;
      const partial = !willPay && Math.random() < 0.5;

      if (invExists.length === 0) {
        for (const inv of INVOICES_TEMPLATE) {
          const paid = willPay || (partial && Math.random() < 0.5);
          await pool.query(
            `INSERT IGNORE INTO fee_invoices
               (student_id, term, fee_head, amount, due_date, status)
             VALUES (?, 'Term 2, 2083/2084', ?, ?, ?, ?)`,
            [studentId, inv.head, inv.amount, inv.due, paid ? 'PAID' : 'UNPAID']
          );
        }
      }

      // Create a receipt if student paid
      const [existingReceipt] = await pool.query(
        'SELECT id FROM fee_receipts WHERE student_id = ? LIMIT 1',
        [studentId]
      );

      if (existingReceipt.length === 0 && (willPay || partial)) {
        const amount = willPay ? 4500 : randBetween(1000, 3500);
        const method = METHODS[randBetween(0, METHODS.length - 1)];
        const daysAgo = randBetween(1, 30);
        const receiptNum = `RCPT-2083-${randBetween(1000, 9999)}`;

        await pool.query(
          `INSERT IGNORE INTO fee_receipts
             (receipt_number, student_id, amount, payment_status, payment_method, created_at)
           VALUES (?, ?, ?, 'PAID', ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
          [receiptNum, studentId, amount, method, daysAgo]
        );
        receiptsCreated++;
      }
    }

    console.log('✅ Accountant seed complete:');
    console.log(`   • ${STUDENTS.length} additional students enrolled`);
    console.log(`   • ${FEE_STRUCTURE.length} fee structure entries`);
    console.log(`   • ${receiptsCreated} receipts created`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Accountant seed failed:', err);
    process.exit(1);
  }
}

main();