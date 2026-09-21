import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role_name,
      full_name: user.full_name,
      email: user.email,
      school_id_number: user.school_id_number
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.school_id_number, u.full_name, u.email,
              u.password_hash, u.is_active, u.avatar_data,
              r.name AS role_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.email = ? OR u.school_id_number = ?
        LIMIT 1`,
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    if (user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        school_id_number: user.school_id_number,
        avatar_data: user.avatar_data,
        role: user.role_name
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.school_id_number, u.full_name, u.email,
              u.phone_number, u.id_card_photo_url, u.avatar_data, u.created_at,
              r.name AS role_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
        LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone_number: u.phone_number,
        id_card_photo_url: u.id_card_photo_url,
        avatar_data: u.avatar_data,
        school_id_number: u.school_id_number,
        role: u.role_name,
        created_at: u.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SHARED PROFILE — any authenticated user can edit their own
   ═══════════════════════════════════════════════════════════════ */

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { phone_number, full_name } = req.body;

    const sets = [];
    const values = [];

    if (typeof phone_number === 'string') {
      const cleaned = phone_number.trim();
      if (cleaned.length > 0 && !/^[+0-9\-\s]{7,20}$/.test(cleaned)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }
      sets.push('phone_number = ?');
      values.push(cleaned || null);
    }

    if (typeof full_name === 'string' && full_name.trim().length >= 2) {
      sets.push('full_name = ?');
      values.push(full_name.trim());
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    values.push(userId);

    await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone_number,
              u.school_id_number, u.avatar_data, r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.id = ?
        LIMIT 1`,
      [userId]
    );

    res.json({ success: true, message: 'Profile updated', data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // DEV ONLY — plaintext. Swap to bcrypt.compare later.
    if (rows[0].password_hash !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPassword, userId]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    const { dataUrl } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image data' });
    }
    if (dataUrl.length > 2_000_000) {
      return res.status(413).json({ success: false, message: 'Image too large (max ~1.5 MB)' });
    }

    await pool.query('UPDATE users SET avatar_data = ? WHERE id = ?', [dataUrl, req.user.id]);
    res.json({ success: true, message: 'Photo updated' });
  } catch (err) {
    next(err);
  }
}

export async function clearAvatar(req, res, next) {
  try {
    await pool.query('UPDATE users SET avatar_data = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Photo removed' });
  } catch (err) {
    next(err);
  }
}