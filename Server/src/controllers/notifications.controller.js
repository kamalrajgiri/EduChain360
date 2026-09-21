import { pool } from '../config/db.js';

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

function audiencesFor(role) {
  return AUDIENCES_BY_ROLE[role] || ['ALL'];
}

/**
 * Shared filter fragment — a notice is visible if:
 *   • it's addressed to me personally (recipient_id = me), OR
 *   • it's public (recipient_id IS NULL) AND audience matches my role
 */
function visibilityClause(role, userId) {
  const audiences = audiencesFor(role);
  const placeholders = audiences.map(() => '?').join(',');
  const sql = `(
    recipient_id = ?
    OR (recipient_id IS NULL AND audience IN (${placeholders}))
  )`;
  const params = [userId, ...audiences];
  return { sql, params };
}

/* ─── BELL: recent 10 ──────────────────────────────────── */

export async function getNotifications(req, res, next) {
  try {
    const { sql, params } = visibilityClause(req.user.role, req.user.id);

    const [rows] = await pool.query(
      `SELECT id, title, message, audience, recipient_id, published_at
         FROM notices
        WHERE status = 'SENT'
          AND ${sql}
        ORDER BY published_at DESC
        LIMIT 10`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* ─── FULL LIST ────────────────────────────────────────── */

export async function getMyNotices(req, res, next) {
  try {
    const { sql, params } = visibilityClause(req.user.role, req.user.id);

    const [rows] = await pool.query(
      `SELECT id, title, message, audience, recipient_id, published_at
         FROM notices
        WHERE status = 'SENT'
          AND ${sql}
        ORDER BY published_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* ─── DETAIL ───────────────────────────────────────────── */

export async function getMyNotice(req, res, next) {
  try {
    const noticeId = Number(req.params.id);
    const { sql, params } = visibilityClause(req.user.role, req.user.id);

    const [rows] = await pool.query(
      `SELECT id, title, message, audience, recipient_id, published_at,
              (SELECT full_name FROM users WHERE id = published_by) AS published_by_name
         FROM notices
        WHERE id = ?
          AND status = 'SENT'
          AND ${sql}
        LIMIT 1`,
      [noticeId, ...params]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}