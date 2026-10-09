import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export const requireAuth = async (req, res, next) => {
  let id;
  try { id = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), process.env.JWT_SECRET).id; }
  catch { return res.status(401).json({ error: 'Please log in to continue.' }); }
  try {
    const { rows: [u] } = await query('SELECT is_banned, is_admin FROM users WHERE id=$1', [id]);
    if (!u) return res.status(401).json({ error: 'Please log in to continue.' });
    if (u.is_banned) return res.status(403).json({ error: 'This account has been suspended.' });
    req.user = { id, is_admin: u.is_admin };
    next();
  } catch (e) { next(e); }
};
// Admin status is read from the database on every request, never trusted from the token.
export const requireAdmin = (req, res, next) =>
  req.user?.is_admin ? next() : res.status(403).json({ error: 'Admins only.' });
