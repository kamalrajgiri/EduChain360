/**
 * ═══════════════════════════════════════════════════════════════
 * EduChain360 — Test Users
 * ═══════════════════════════════════════════════════════════════
 *
 * Creates 3 test accounts for development / QA:
 *   • 1 Teacher     (with teachers profile row)
 *   • 1 Student
 *   • 1 Accountant
 *
 * The Admin account already exists from `npm run bootstrap`.
 *
 * Idempotent — safe to run repeatedly. Existing rows are updated,
 * never duplicated.
 *
 * Run: npm run test:users
 *
 * DELETE THIS FILE before any public/demo deployment.
 * ═══════════════════════════════════════════════════════════════
 */
import { pool } from '../config/db.js';

const TEST_USERS = [
  {
    role: 'Teacher',
    school_id_number: 'TCH-001',
    full_name: 'Test Teacher',
    email: 'teacher@fwu.edu.np',
    password: 'teacher123',
    phone: '+977-9800000001',
    // Extra: teacher profile
    teacher_profile: {
      employee_code: 'EMP-TCH-001',
      department: 'Academics'
    }
  },
  {
    role: 'Student',
    school_id_number: 'STU-001',
    full_name: 'Test Student',
    email: 'student@fwu.edu.np',
    password: 'student123',
    phone: '+977-9800000002'
  },
  {
    role: 'Accountant',
    school_id_number: 'ACC-001',
    full_name: 'Test Accountant',
    email: 'accountant@fwu.edu.np',
    password: 'acc123',
    phone: '+977-9800000003'
  }
];

async function getRoleId(name) {
  const [rows] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [name]);
  if (rows.length === 0) {
    throw new Error(`Role "${name}" not found. Run \`npm run bootstrap\` first.`);
  }
  return rows[0].id;
}

async function upsertUser(u) {
  const roleId = await getRoleId(u.role);

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR school_id_number = ? LIMIT 1',
    [u.email, u.school_id_number]
  );

  let userId;
  if (existing.length > 0) {
    userId = existing[0].id;
    await pool.query(
      `UPDATE users
          SET school_id_number = ?,
              full_name = ?,
              email = ?,
              password_hash = ?,
              role_id = ?,
              phone_number = ?,
              is_active = TRUE
        WHERE id = ?`,
      [u.school_id_number, u.full_name, u.email, u.password, roleId, u.phone, userId]
    );
    console.log(`   ↻ Updated ${u.role.padEnd(11)} ${u.email}`);
  } else {
    const [res] = await pool.query(
      `INSERT INTO users
         (school_id_number, full_name, email, password_hash, role_id, phone_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [u.school_id_number, u.full_name, u.email, u.password, roleId, u.phone]
    );
    userId = res.insertId;
    console.log(`   ✓ Created ${u.role.padEnd(11)} ${u.email}`);
  }

  // Teacher needs a `teachers` profile row
  if (u.role === 'Teacher' && u.teacher_profile) {
    const [tRows] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (tRows.length > 0) {
      await pool.query(
        `UPDATE teachers SET employee_code = ?, department = ? WHERE user_id = ?`,
        [u.teacher_profile.employee_code, u.teacher_profile.department, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO teachers (user_id, employee_code, department) VALUES (?, ?, ?)`,
        [userId, u.teacher_profile.employee_code, u.teacher_profile.department]
      );
    }
  }

  return userId;
}

async function main() {
  try {
    console.log('\n🧪 Creating test users...\n');

    for (const u of TEST_USERS) {
      await upsertUser(u);
    }

    console.log('\n✅ Test users ready.\n');
    console.log('   Login credentials:');
    console.log('   ┌────────────┬─────────────────────────────┬──────────────┐');
    console.log('   │ Role       │ Email                       │ Password     │');
    console.log('   ├────────────┼─────────────────────────────┼──────────────┤');
    TEST_USERS.forEach((u) => {
      console.log(`   │ ${u.role.padEnd(10)} │ ${u.email.padEnd(27)} │ ${u.password.padEnd(12)} │`);
    });
    console.log('   └────────────┴─────────────────────────────┴──────────────┘\n');

    console.log('   ⚠️  These are TEST accounts. Delete this file and');
    console.log('       the corresponding DB rows before any public deploy.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
  }
}

main();