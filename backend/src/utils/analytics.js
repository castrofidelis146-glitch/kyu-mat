import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { query } from '../config/db.js';

const BOT = /bot|crawl|spider|slurp|curl|wget|python|headless|preview|monitor/i;

export const viewerId = (req) => {
  try { return jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), process.env.JWT_SECRET).id; }
  catch { return null; }
};

// One view per person per ad per day (Nairobi time). Only a hash is stored, never the raw IP address.
export function recordView(req, p) {
  try {
    const ua = req.headers['user-agent'] || '';
    if (!ua || BOT.test(ua)) return;
    const uid = viewerId(req);
    if (uid && uid === p.seller_id) return; // sellers viewing their own ads do not count
    const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const key = uid ? `u:${uid}` : 'a:' + createHash('sha256').update(`${ip}|${ua}|${process.env.JWT_SECRET}`).digest('hex').slice(0, 32);
    query("INSERT INTO product_views (product_id, viewer_key, view_date) VALUES ($1,$2,(now() AT TIME ZONE 'Africa/Nairobi')::date) ON CONFLICT DO NOTHING",
      [p.id, key]).catch((e) => console.error('view not recorded:', e.message));
  } catch (e) { console.error(e.message); }
}
