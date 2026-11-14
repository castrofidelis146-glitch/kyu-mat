import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { query } from '../config/db.js';

const BOT = /bot|crawl|spider|slurp|curl|wget|python|headless|preview|monitor/i;
const last = new Map();
const NAIROBI = "now() AT TIME ZONE 'Africa/Nairobi'";

// Called on page load and every 30 seconds while the site is open.
// Only a hash is stored, never the raw IP address.
export function recordPing(req) {
  try {
    const ua = req.headers['user-agent'] || '';
    if (!ua || BOT.test(ua)) return;
    let uid = null;
    try { uid = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), process.env.JWT_SECRET).id; } catch {}
    const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const key = uid ? `u:${uid}` : 'a:' + createHash('sha256').update(`${ip}|${ua}|${process.env.JWT_SECRET}`).digest('hex').slice(0, 32);
    const now = Date.now();
    if (now - (last.get(key) || 0) < 15000) return;
    last.set(key, now);
    if (last.size > 5000) for (const [k, t] of last) if (now - t > 60000) last.delete(k);
    const fail = (e) => console.error('ping not recorded:', e.message);
    query('INSERT INTO site_online (viewer_key, last_seen) VALUES ($1, now()) ON CONFLICT (viewer_key) DO UPDATE SET last_seen = now()', [key]).catch(fail);
    query("INSERT INTO site_visits (viewer_key, hour_start) VALUES ($1, date_trunc('hour', now())) ON CONFLICT DO NOTHING", [key]).catch(fail);
    if (Math.random() < 0.02) query("DELETE FROM site_online WHERE last_seen < now() - interval '1 day'").catch(fail);
  } catch (e) { console.error(e.message); }
}

let cache = { at: 0, data: null };
export async function publicStats() {
  if (cache.data && Date.now() - cache.at < 5000) return cache.data; // 5 s cache protects the database
  const [t, hourly, daily, cats] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) FROM site_online WHERE last_seen > now() - interval '90 seconds')::int AS online_now,
      (SELECT COUNT(DISTINCT viewer_key) FROM site_visits WHERE (hour_start AT TIME ZONE 'Africa/Nairobi')::date = (${NAIROBI})::date)::int AS visitors_today,
      (SELECT COUNT(DISTINCT viewer_key) FROM site_visits WHERE hour_start > now() - interval '7 days')::int AS visitors_7d,
      (SELECT COUNT(*) FROM users WHERE is_banned = false)::int AS members,
      (SELECT COUNT(*) FROM products WHERE status = 'AVAILABLE')::int AS active_ads,
      (SELECT COUNT(*) FROM products WHERE status = 'SOLD')::int AS sold_ads,
      (SELECT COUNT(*) FROM products WHERE (created_at AT TIME ZONE 'Africa/Nairobi')::date = (${NAIROBI})::date)::int AS ads_today`),
    query(`SELECT to_char(h AT TIME ZONE 'Africa/Nairobi', 'HH24:00') AS label, COUNT(v.viewer_key)::int AS count
      FROM generate_series(date_trunc('hour', now()) - interval '23 hours', date_trunc('hour', now()), interval '1 hour') h
      LEFT JOIN site_visits v ON v.hour_start = h GROUP BY h ORDER BY h`),
    query(`SELECT to_char(d, 'MM-DD') AS label, COUNT(DISTINCT v.viewer_key)::int AS count
      FROM generate_series((${NAIROBI})::date - 13, (${NAIROBI})::date, interval '1 day') d
      LEFT JOIN site_visits v ON (v.hour_start AT TIME ZONE 'Africa/Nairobi')::date = d::date GROUP BY d ORDER BY d`),
    query(`SELECT c.name, COUNT(p.id)::int AS count FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'AVAILABLE' GROUP BY c.id ORDER BY count DESC, c.id`),
  ]);
  const data = { totals: t.rows[0], hourly: hourly.rows, daily: daily.rows, categories: cats.rows, server_time: new Date().toISOString() };
  cache = { at: Date.now(), data };
  return data;
}
