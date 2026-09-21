/**
 * ═══════════════════════════════════════════════════════════════
 * EduChain360 — Bootstrap
 * ═══════════════════════════════════════════════════════════════
 *
 * Idempotent: safe to run many times.
 *
 * Creates ONLY:
 *   • 8 role rows (Admin, Teacher, Student, Parent, Accountant,
 *     Librarian, HR, Lab Assistant)
 *   • 1 admin user (from .env)
 *
 * Every other entity — teachers, students, parents, classes,
 * subjects, enrollments, exams, invoices — is created through the
 * Admin dashboard after first login.
 *
 * Run: npm run bootstrap
 * ═══════════════════════════════════════════════════════════════
 */
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const ROLE_NAMES = [
  'Admin',
  'Teacher',
  'Student',
  'Parent',
  'Accountant',
  'Librarian',
  'HR',
  'Lab Assistant'
];

async function ensureRoles() {
  for (const name of ROLE_NAMES) {
    await pool.query('INSERT IGNORE INTO roles (name) VALUES (?)', [name]);
  }
  const [rows] = await pool.query('SELECT id, name FROM roles ORDER BY id');
  console.log(`   ✓ ${rows.length} roles ready`);
  return rows;
}

async function ensureAdmin(roles) {
  const email    = (process.env.ADMIN_EMAIL    || 'admin@educhain360.local').trim();
  const password = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  const name     = (process.env.ADMIN_NAME     || 'System Administrator').trim();
  const schoolId = (process.env.ADMIN_SCHOOL_ID|| 'ADM-001').trim();

  const adminRole = roles.find((r) => r.name === 'Admin');
  if (!adminRole) throw new Error('Admin role missing — schema.sql must run first');

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? OR school_id_number = ? LIMIT 1',
    [email, schoolId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE users
          SET full_name = ?,
              email = ?,
              school_id_number = ?,
              password_hash = ?,
              role_id = ?,
              is_active = TRUE
        WHERE id = ?`,
      [name, email, schoolId, password, adminRole.id, existing[0].id]
    );
    console.log(`   ↻ Admin user updated: ${email}`);
    return;
  }

  await pool.query(
    `INSERT INTO users
       (school_id_number, full_name, email, password_hash, role_id)
     VALUES (?, ?, ?, ?, ?)`,
    [schoolId, name, email, password, adminRole.id]
  );
  console.log(`   ✓ Admin user created: ${email}`);
}

async function main() {
  try {
    console.log('\n🚀 Bootstrapping EduChain360...\n');

    console.log('📋 Roles');
    const roles = await ensureRoles();

    console.log('\n👤 Admin account');
    await ensureAdmin(roles);

    const email    = process.env.ADMIN_EMAIL    || 'admin@educhain360.local';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('\n✅ Bootstrap complete.\n');
    console.log('   Login credentials:');
    console.log(`     Email:    ${email}`);
    console.log(`     Password: ${password}`);
    console.log('\n   ⚠️  Change the password after first login.');
    console.log('   ⚠️  If ADMIN_PASSWORD is still "admin123", set a real one in .env.\n');
    console.log('   Next: log in as Admin and create users, classes, and subjects');
    console.log('         through the Admin dashboard.\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Bootstrap failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main();