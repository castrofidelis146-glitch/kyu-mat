import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../config/db.js';
import { recordPing, publicStats } from '../utils/siteStats.js';
const r = Router();

// Anonymous heartbeat: counts visitors, returns nothing.
r.post('/ping', (req, res) => { recordPing(req); res.status(204).end(); });

// Only sellers (anyone who has posted an ad) and admins can read the numbers.
const sellersOnly = async (req, res, next) => {
  try {
    if (req.user.is_admin) return next();
    const { rowCount } = await query('SELECT 1 FROM products WHERE user_id=$1 LIMIT 1', [req.user.id]);
    return rowCount ? next() : res.status(403).json({ error: 'Post an ad to see marketplace statistics.' });
  } catch (e) { next(e); }
};
r.get('/public', requireAuth, sellersOnly, async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await publicStats()); } catch (e) { next(e); }
});
export default r;
