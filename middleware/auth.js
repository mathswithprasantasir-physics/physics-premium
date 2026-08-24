import { getUserFromRequest } from '../lib/auth.js';

export function requireAuth(handler) {
  return async (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.user = user;
    return handler(req, res);
  };
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const user = getUserFromRequest(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    return handler(req, res);
  };
}