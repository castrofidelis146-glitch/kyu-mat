import { query } from '../config/db.js';
import { snapshot } from '../middleware/metrics.js';
import * as P from '../models/productModel.js';

const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const daily = (table) => query(`
  SELECT to_char(d,'YYYY-MM-DD') AS day, COUNT(t.id)::int AS count
  FROM generate_series(current_date - 29, current_date, '1 day') d
  LEFT JOIN ${table} t ON t.created_at::date = d::date GROUP BY d ORDER BY d`);

export const analytics = wrap(async (req, res) => {
  const t0 = Date.now(); await query('SELECT 1'); const dbMs = Date.now() - t0;
  const [totals, signups, listings, cats, types, sellers] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) FROM users)::int AS users,
      (SELECT COUNT(*) FROM users WHERE created_at > now() - interval '7 days')::int AS new_users_7d,
      (SELECT COUNT(*) FROM users WHERE is_banned)::int AS banned,
      (SELECT COUNT(*) FROM products WHERE status='AVAILABLE')::int AS active_ads,
      (SELECT COUNT(*) FROM products WHERE status='SOLD')::int AS sold_ads,
      (SELECT COUNT(*) FROM products WHERE created_at > now() - interval '7 days')::int AS new_ads_7d,
      (SELECT COUNT(*) FROM favorites)::int AS favorites,
      (SELECT COALESCE(AVG(price),0)::int FROM products WHERE price IS NOT NULL) AS avg_price`),
    daily('users'), daily('products'),
    query(`SELECT c.name, COUNT(p.id)::int AS count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id ORDER BY count DESC`),
    query(`SELECT listing_type, COUNT(*)::int AS count FROM products GROUP BY 1`),
    query(`SELECT u.full_name, COUNT(p.id)::int AS ads, (COUNT(*) FILTER (WHERE p.status='SOLD'))::int AS sold
           FROM users u JOIN products p ON p.user_id=u.id GROUP BY u.id ORDER BY ads DESC LIMIT 5`),
  ]);
  res.json({ totals: totals.rows[0], signups: signups.rows, listings: listings.rows, categories: cats.rows,
    types: types.rows, sellers: sellers.rows, system: { ...snapshot(), dbMs } });
});

export const users = wrap(async (req, res) => res.json((await query(`
  SELECT u.id, u.full_name, u.email, u.phone_number, u.created_at, u.is_admin, u.is_banned,
         (SELECT COUNT(*) FROM products p WHERE p.user_id=u.id)::int AS ads
  FROM users u ORDER BY u.created_at DESC LIMIT 200`)).rows));

export const ban = wrap(async (req, res) => {
  const { rowCount } = await query('UPDATE users SET is_banned=$2 WHERE id=$1 AND is_admin=false AND id<>$3',
    [req.params.id, !!req.body.banned, req.user.id]);
  if (!rowCount) return res.status(400).json({ error: 'Admins cannot be suspended.' });
  res.status(204).end();
});

export const listings = wrap(async (req, res) => res.json((await query(`
  SELECT p.id, p.title, p.price, p.status, p.listing_type, p.created_at, u.full_name AS seller_name, u.email AS seller_email
  FROM products p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 200`)).rows));

export const removeListing = wrap(async (req, res) => { await P.remove(req.params.id); res.status(204).end(); });
