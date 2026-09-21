/**
 * DEV SEED — creates one user per role so we can log in and test.
 * Plaintext passwords (dev only). Run with: npm run seed
 */
import { pool } from '../config/db.js';

const DEV_USERS = [
  { school_id_number: 'ADM-001', full_name: 'Kamal Raj Giri',  email: 'admin@fwu.edu.np',       password: 'admin123',   role: 'Admin',         phone: '+977-9800000001' },
  { school_id_number: 'TCH-001', full_name: 'Deepak Joshi',    email: 'teacher@fwu.edu.np',     password: 'teacher123', role: 'Teacher',       phone: '+977-9800000002' },
  { school_id_number: 'STU-014', full_name: 'Rajan Thapa',     email: 'student@fwu.edu.np',     password: 'student123', role: 'Student',       phone: '+977-9800000003' },
  { school_id_number: 'PAR-001', full_name: 'Gita Thapa',      email: 'parent@fwu.edu.np',      password: 'parent123',  role: 'Parent',        phone: '+977-9800000004' },
  { school_id_number: 'ACC-001', full_name: 'Bina Karki',      email: 'accountant@fwu.edu.np',  password: 'acc123',     role: 'Accountant',    phone: '+977-9800000005' },
  { school_id_number: 'LIB-001', full_name: 'Sarita Oli',      email: 'librarian@fwu.edu.np',   password: 'lib123',     role: 'Librarian',     phone: '+977-9800000006' },
  { school_id_number: 'HR-001',  full_name: 'Manisha KC',      email: 'hr@fwu.edu.np',          password: 'hr123',      role: 'HR',            phone: '+977-9800000007' },
  { school_id_number: 'LAB-001', full_name: 'Ramesh Bogati',   email: 'lab@fwu.edu.np',         password: 'lab123',     role: 'Lab Assistant', phone: '+977-9800000008' }
];

async function upsertUser(u, roleId) {
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR school_id_number = ? LIMIT 1',
    [u.email, u.school_id_number]
  );
  if (existing.length > 0) {
    await pool.query(
      `UPDATE users SET full_name=?, school_id_number=?, email=?, password_hash=?, role_id=?, phone_number=? WHERE id=?`,
      [u.full_name, u.school_id_number, u.email, u.password, roleId, u.phone, existing[0].id]
    );
    return { id: existing[0].id, action: 'updated' };
  }
  const [res] = await pool.query(
    `INSERT INTO users (school_id_number, full_name, email, password_hash, role_id, phone_number)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [u.school_id_number, u.full_name, u.email, u.password, roleId, u.phone]
  );
  return { id: res.insertId, action: 'created' };
}

async function ensureTeacherProfile(userId, employeeCode, department) {
  const [rows] = await pool.query('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [userId]);
  if (rows.length > 0) {
    await pool.query(
      'UPDATE teachers SET employee_code = ?, department = ? WHERE user_id = ?',
      [employeeCode, department, userId]
    );
    return rows[0].id;
  }
  const [res] = await pool.query(
    'INSERT INTO teachers (user_id, employee_code, department) VALUES (?, ?, ?)',
    [userId, employeeCode, department]
  );
  return res.insertId;
}

async function seed() {
  try {
    for (const u of DEV_USERS) {
      const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [u.role]);
      if (roleRows.length === 0) {
        console.warn(`⚠️  Role "${u.role}" missing in DB — run schema.sql first.`);
        continue;
      }
      const roleId = roleRows[0].id;

      const { id: userId, action } = await upsertUser(u, roleId);
      console.log(`${action === 'created' ? '✅ Created' : '🔄 Updated'} ${u.role}: ${u.email}`);

      if (u.role === 'Teacher') {
        const teacherId = await ensureTeacherProfile(userId, 'STF-0142', 'Academics');
        console.log(`   ↳ teachers.id = ${teacherId} (employee_code STF-0142)`);
      }
    }

    console.log('\n🎉 Seed complete. Login credentials (dev):');
    DEV_USERS.forEach(u => console.log(`   ${u.role.padEnd(14)} → ${u.email} / ${u.password}`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();