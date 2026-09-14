/**
 * Role-based gate. Usage:
 *   router.get('/admin-only', authenticate, requireRole('Admin'), handler);
 *   router.get('/shared',   authenticate, requireRole('Admin', 'HR'), handler);
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
}