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