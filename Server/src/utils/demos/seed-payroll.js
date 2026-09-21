/**
 * Dev seed for payroll.
 * Assigns base salaries to the 6 staff accounts.
 *
 * Run: npm run seed:payroll
 */
import { pool } from '../config/db.js';

const SALARIES = [
  { email: 'admin@fwu.edu.np',      gross: 85000, tax: 12, pf: 6, other: 0 },
  { email: 'teacher@fwu.edu.np',    gross: 62000, tax: 10, pf: 5, other: 0 },
  { email: 'accountant@fwu.edu.np', gross: 55000, tax: 10, pf: 5, other: 0 },
  { email: 'librarian@fwu.edu.np',  gross: 45000, tax: 8,  pf: 5, other: 0 },
  { email: 'hr@fwu.edu.np',         gross: 58000, tax: 10, pf: 5, other: 0 },
  { email: 'lab@fwu.edu.np',        gross: 42000, tax: 8,  pf: 5, other: 0 }
];

async function main() {
  try {
    console.log('🌱 Seeding payroll data...');

    for (const s of SALARIES) {
      const [user] = await pool.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [s.email]
      );
      if (user.length === 0) {
        console.warn(`⚠️  User not found: ${s.email}`);
        continue;
      }
      const userId = user[0].id;

      const [existing] = await pool.query(
        'SELECT id FROM staff_salaries WHERE user_id = ? LIMIT 1',
        [userId]
      );

      if (existing.length > 0) {
        await pool.query(
          `UPDATE staff_salaries
              SET gross_salary = ?, tax_rate = ?, pf_rate = ?, other_deduction = ?
            WHERE user_id = ?`,
          [s.gross, s.tax, s.pf, s.other, userId]
        );
        console.log(`🔄 Updated salary for ${s.email}`);
      } else {
        await pool.query(
          `INSERT INTO staff_salaries
             (user_id, gross_salary, tax_rate, pf_rate, other_deduction, effective_from)
           VALUES (?, ?, ?, ?, ?, CURDATE())`,
          [userId, s.gross, s.tax, s.pf, s.other]
        );
        console.log(`✅ Added salary for ${s.email}`);
      }
    }

    console.log('\n🎉 Payroll seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Payroll seed failed:', err);
    process.exit(1);
  }
}

main();