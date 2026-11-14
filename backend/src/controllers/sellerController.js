import { query } from '../config/db.js';
import { viewerId } from '../utils/analytics.js';

const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const owned = 'FROM product_views v JOIN products p ON p.id = v.product_id WHERE p.user_id = $1';
const NAIROBI = "now() AT TIME ZONE 'Africa/Nairobi'";

export const stats = wrap(async (req, res) => {
  const id = req.user.id;
  const [t, daily, hourly, ads, reviews] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) ${owned})::int AS views_total,
      (SELECT COUNT(*) ${owned} AND v.created_at > now() - interval '24 hours')::int AS views_24h,
      (SELECT COUNT(*) ${owned} AND v.created_at > now() - interval '7 days')::int AS views_7d,
      (SELECT COUNT(DISTINCT v.viewer_key) ${owned})::int AS visitors_total,
      (SELECT COUNT(DISTINCT v.viewer_key) ${owned} AND v.created_at > now() - interval '24 hours')::int AS visitors_24h,
      (SELECT MAX(v.created_at) ${owned}) AS last_view_at,
      (SELECT COUNT(*) FROM favorites f JOIN products p ON p.id = f.product_id WHERE p.user_id = $1)::int AS saves,
      (SELECT COUNT(*) FROM products WHERE user_id = $1 AND status = 'AVAILABLE')::int AS active_ads,
      (SELECT COUNT(*) FROM products WHERE user_id = $1 AND status = 'SOLD')::int AS sold_ads,
      (SELECT ROUND(AVG(rating), 1)::float FROM seller_ratings WHERE seller_id = $1) AS rating,
      (SELECT COUNT(*) FROM seller_ratings WHERE seller_id = $1)::int AS rating_count`, [id]),
    query(`SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(v.id)::int AS count
      FROM generate_series((${NAIROBI})::date - 13, (${NAIROBI})::date, '1 day') d
      LEFT JOIN (SELECT v.id, v.view_date ${owned}) v ON v.view_date = d::date
      GROUP BY d ORDER BY d`, [id]),
    query(`SELECT to_char(h, 'HH24:00') AS hour, COUNT(v.id)::int AS count
      FROM generate_series(date_trunc('hour', ${NAIROBI}) - interval '23 hours', date_trunc('hour', ${NAIROBI}), '1 hour') h
      LEFT JOIN (SELECT v.id, date_trunc('hour', v.created_at AT TIME ZONE 'Africa/Nairobi') AS hr ${owned}) v ON v.hr = h
      GROUP BY h ORDER BY h`, [id]),
    query(`SELECT p.id, p.title, p.status, p.price, COUNT(v.id)::int AS views, COUNT(DISTINCT v.viewer_key)::int AS visitors,
      (SELECT COUNT(*) FROM favorites f WHERE f.product_id = p.id)::int AS saves
      FROM products p LEFT JOIN product_views v ON v.product_id = p.id
      WHERE p.user_id = $1 GROUP BY p.id ORDER BY views DESC, p.created_at DESC`, [id]),
    query(`SELECT r.rating, r.comment, r.created_at, split_part(u.full_name, ' ', 1) AS reviewer
      FROM seller_ratings r JOIN users u ON u.id = r.rater_id WHERE r.seller_id = $1 ORDER BY r.created_at DESC LIMIT 5`, [id]),
  ]);
  res.json({ totals: t.rows[0], daily: daily.rows, hourly: hourly.rows, ads: ads.rows, reviews: reviews.rows, server_time: new Date().toISOString() });
});

export const profile = wrap(async (req, res) => {
  const id = req.params.id;
  const { rows: [u] } = await query('SELECT id, full_name, created_at FROM users WHERE id = $1 AND is_banned = false', [id]);
  if (!u) return res.status(404).json({ error: 'Seller not found.' });
  const me = viewerId(req);
  const [agg, dist, reviews, mine, counts] = await Promise.all([
    query('SELECT ROUND(AVG(rating), 1)::float AS avg, COUNT(*)::int AS count FROM seller_ratings WHERE seller_id = $1', [id]),
    query('SELECT rating, COUNT(*)::int AS n FROM seller_ratings WHERE seller_id = $1 GROUP BY rating', [id]),
    query(`SELECT r.rating, r.comment, r.created_at, split_part(u.full_name, ' ', 1) AS reviewer
      FROM seller_ratings r JOIN users u ON u.id = r.rater_id WHERE r.seller_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [id]),
    me ? query('SELECT rating, comment FROM seller_ratings WHERE seller_id = $1 AND rater_id = $2', [id, me]) : { rows: [] },
    query(`SELECT COUNT(*) FILTER (WHERE status = 'AVAILABLE')::int AS active, COUNT(*) FILTER (WHERE status = 'SOLD')::int AS sold FROM products WHERE user_id = $1`, [id]),
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dist.rows.forEach((r) => { distribution[r.rating] = r.n; });
  res.json({ id: u.id, name: u.full_name, member_since: u.created_at, rating: agg.rows[0].avg, rating_count: agg.rows[0].count,
    distribution, reviews: reviews.rows, my_rating: mine.rows[0] || null, active_ads: counts.rows[0].active, sold_ads: counts.rows[0].sold });
});

export const rate = wrap(async (req, res) => {
  const seller = req.params.id, me = req.user.id;
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || '').trim().slice(0, 500) || null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Choose 1 to 5 stars.' });
  if (seller === me) return res.status(400).json({ error: 'You cannot rate yourself.' });
  const { rows: [s] } = await query('SELECT id FROM users WHERE id = $1', [seller]);
  if (!s) return res.status(404).json({ error: 'Seller not found.' });
  const seen = await query('SELECT 1 FROM product_views v JOIN products p ON p.id = v.product_id WHERE p.user_id = $1 AND v.viewer_key = $2 LIMIT 1', [seller, `u:${me}`]);
  if (!seen.rowCount) return res.status(400).json({ error: "Open one of this seller's listings while logged in before rating them." });
  await query(`INSERT INTO seller_ratings (seller_id, rater_id, rating, comment) VALUES ($1,$2,$3,$4)
    ON CONFLICT (seller_id, rater_id) DO UPDATE SET rating = $3, comment = $4, updated_at = now()`, [seller, me, rating, comment]);
  res.status(204).end();
});
