import { pool, query } from '../config/db.js';
const SELECT = `
SELECT p.id, p.title, p.description, p.price, p.listing_type, p.condition, p.location, p.status, p.created_at,
  c.name AS category, c.slug AS category_slug,
  u.id AS seller_id, u.full_name AS seller_name, u.profile_image_url AS seller_avatar,
  (SELECT ROUND(AVG(rating), 1)::float FROM seller_ratings sr WHERE sr.seller_id = u.id) AS seller_rating,
  (SELECT COUNT(*)::int FROM seller_ratings sr WHERE sr.seller_id = u.id) AS seller_rating_count,
  (SELECT COUNT(*)::int FROM product_views pv WHERE pv.product_id = p.id) AS views,
  (SELECT image_url FROM product_images i WHERE i.product_id=p.id ORDER BY is_primary DESC, id LIMIT 1) AS image_url
FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.user_id`;
const SORTS = { newest: 'p.created_at DESC', price_asc: 'p.price ASC NULLS LAST', price_desc: 'p.price DESC NULLS LAST' };

export const list = async ({ category, type, q, seller, sort = 'newest', limit = 24, offset = 0 }) => {
  const where = ["p.status='AVAILABLE'"], params = [];
  if (category) { params.push(category); where.push(`c.slug=$${params.length}`); }
  if (type) { params.push(type); where.push(`p.listing_type=$${params.length}`); }
  if (seller) { params.push(seller); where.push(`p.user_id=$${params.length}`); }
  if (q) { params.push(`%${q}%`); where.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`); }
  params.push(Math.min(+limit || 24, 100), +offset || 0);
  return (await query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${SORTS[sort] || SORTS.newest}
    LIMIT $${params.length - 1} OFFSET $${params.length}`, params)).rows;
};
export const getById = async (id, withPhone = false) => {
  const p = (await query(`${SELECT} WHERE p.id=$1`, [id])).rows[0];
  if (p) p.images = (await query('SELECT image_url,is_primary FROM product_images WHERE product_id=$1', [id])).rows;
  if (p && withPhone) p.seller_phone = (await query('SELECT phone_number FROM users WHERE id=$1', [p.seller_id])).rows[0]?.phone_number;
  return p;
};
export const owner = async (id) => (await query('SELECT user_id FROM products WHERE id=$1', [id])).rows[0]?.user_id;

export const create = async (userId, d) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [p] } = await client.query(
      `INSERT INTO products (user_id,category_id,title,description,price,listing_type,condition,location)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6::listing_type,'FOR_SALE'),COALESCE($7,'Good Condition'),COALESCE($8,'KYU Main Campus')) RETURNING id`,
      [userId, d.category_id, d.title, d.description, d.price ?? null, d.listing_type, d.condition, d.location]);
    for (const [i, url] of (d.images || []).entries())
      await client.query('INSERT INTO product_images (product_id,image_url,is_primary) VALUES ($1,$2,$3)', [p.id, url, i === 0]);
    await client.query('COMMIT');
    return p.id;
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
};
export const update = async (id, d) =>
  query(`UPDATE products SET title=COALESCE($2,title), description=COALESCE($3,description), price=COALESCE($4,price),
    listing_type=COALESCE($5,listing_type), condition=COALESCE($6,condition), location=COALESCE($7,location),
    status=COALESCE($8,status), category_id=COALESCE($9,category_id), updated_at=now() WHERE id=$1`,
    [id, d.title, d.description, d.price, d.listing_type, d.condition, d.location, d.status, d.category_id]);
export const remove = (id) => query('DELETE FROM products WHERE id=$1', [id]);
export const categories = async () => (await query('SELECT * FROM categories ORDER BY id')).rows;
export const mine = async (uid) => (await query(`${SELECT} WHERE p.user_id=$1 ORDER BY p.created_at DESC`, [uid])).rows;
export const favorites = async (uid) =>
  (await query(`${SELECT} JOIN favorites f ON f.product_id=p.id WHERE f.user_id=$1 ORDER BY f.created_at DESC`, [uid])).rows;
export const addFav = (uid, pid) => query('INSERT INTO favorites (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [uid, pid]);
export const removeFav = (uid, pid) => query('DELETE FROM favorites WHERE user_id=$1 AND product_id=$2', [uid, pid]);
