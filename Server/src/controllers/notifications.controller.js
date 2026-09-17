import { pool } from '../config/db.js';

/**
 * Audience matrix — who sees which notice category.
 * Matches the ENUM on notices.audience: ALL, STUDENTS, PARENTS, STAFF, TEACHERS, APPLICANTS
 */
const AUDIENCES_BY_ROLE = {
  Admin:           ['ALL'],
  Teacher:         ['ALL', 'STAFF', 'TEACHERS'],
  Student:         ['ALL', 'STUDENTS'],
  Parent:          ['ALL', 'PARENTS'],
  Accountant:      ['ALL', 'STAFF'],
  Librarian:       ['ALL', 'STAFF'],
  HR:              ['ALL', 'STAFF'],
  'Lab Assistant': ['ALL', 'STAFF']
};

/**
 * GET /api/notifications
 * Returns the latest notices visible to the logged-in user's role.
 * Used by the topbar bell across every role.
 */
export async function getNotifications(req, res, next) {
  try {
    const role = req.user.role;
    const audiences = AUDIENCES_BY_ROLE[role] || ['ALL'];

    const placeholders = audiences.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT id, title, message, audience, published_at
         FROM notices
        WHERE status = 'SENT'
          AND audience IN (${placeholders})
        ORDER BY published_at DESC
        LIMIT 10`,
      audiences
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}