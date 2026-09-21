import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

/**
 * Verifies the JWT from the Authorization header.
 * On success, attaches req.user = { id, role, full_name, email, school_id_number }.
 *
 * NOTE: role is ALWAYS read from the signed token — never from the client body.
 * This is the security rule from the proposal (Section 3.2.2).
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, full_name, email, school_id_number }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}