import { query } from '../config/db.js';

const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const member = async (cid, uid) =>
  (await query('SELECT * FROM conversations WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)', [cid, uid])).rows[0];
const IMG = '(SELECT image_url FROM product_images i WHERE i.product_id=p.id ORDER BY is_primary DESC, id LIMIT 1)';

export const list = wrap(async (req, res) => {
  const { rows } = await query(`
    SELECT c.id, c.last_message_at, p.id AS product_id, p.title AS product_title, p.status AS product_status, ${IMG} AS product_image,
      o.id AS other_id, o.full_name AS other_name,
      (SELECT body FROM messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT sender_id FROM messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) AS last_sender,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id AND m.sender_id<>$1 AND m.read_at IS NULL)::int AS unread
    FROM conversations c
    LEFT JOIN products p ON p.id=c.product_id
    JOIN users o ON o.id = CASE WHEN c.buyer_id=$1 THEN c.seller_id ELSE c.buyer_id END
    WHERE (c.buyer_id=$1 OR c.seller_id=$1) AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id=c.id)
    ORDER BY c.last_message_at DESC LIMIT 100`, [req.user.id]);
  res.json(rows);
});

export const start = wrap(async (req, res) => {
  const me = req.user.id;
  const { rows: [p] } = await query('SELECT p.id, p.user_id, u.is_banned FROM products p JOIN users u ON u.id=p.user_id WHERE p.id=$1', [req.body.product_id]);
  if (!p) return res.status(404).json({ error: 'Listing not found.' });
  if (p.user_id === me) return res.status(400).json({ error: 'This is your own ad.' });
  if (p.is_banned) return res.status(400).json({ error: 'This seller is not available.' });
  const { rows: [c] } = await query(
    `INSERT INTO conversations (product_id, buyer_id, seller_id) VALUES ($1,$2,$3)
     ON CONFLICT (product_id, buyer_id) DO UPDATE SET product_id = EXCLUDED.product_id RETURNING id`, [p.id, me, p.user_id]);
  res.json({ id: c.id });
});

export const messages = wrap(async (req, res) => {
  const me = req.user.id;
  const c = await member(req.params.id, me);
  if (!c) return res.status(404).json({ error: 'Conversation not found.' });
  const after = Number(req.query.after) || 0;
  await query('UPDATE messages SET read_at=now() WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL', [c.id, me]);
  const [msgs, seen] = await Promise.all([
    query(`SELECT * FROM (SELECT id::int AS id, sender_id, body, created_at FROM messages WHERE conversation_id=$1 AND id>$2 ORDER BY id DESC LIMIT 200) t ORDER BY id`, [c.id, after]),
    query('SELECT COALESCE(MAX(id),0)::int AS n FROM messages WHERE conversation_id=$1 AND sender_id=$2 AND read_at IS NOT NULL', [c.id, me]),
  ]);
  const out = { messages: msgs.rows, seen_up_to: seen.rows[0].n };
  if (!after) {
    const { rows: [m] } = await query(`
      SELECT o.id AS other_id, o.full_name AS other_name, p.id AS product_id, p.title, p.price, p.status, ${IMG} AS image_url
      FROM conversations c JOIN users o ON o.id = CASE WHEN c.buyer_id=$2 THEN c.seller_id ELSE c.buyer_id END
      LEFT JOIN products p ON p.id=c.product_id WHERE c.id=$1`, [c.id, me]);
    out.conversation = { other: { id: m.other_id, name: m.other_name },
      product: m.product_id ? { id: m.product_id, title: m.title, price: m.price, status: m.status, image_url: m.image_url } : null };
  }
  res.json(out);
});

export const send = wrap(async (req, res) => {
  const me = req.user.id;
  const c = await member(req.params.id, me);
  if (!c) return res.status(404).json({ error: 'Conversation not found.' });
  const body = String(req.body.body || '').trim().slice(0, 1000);
  if (!body) return res.status(400).json({ error: 'Type a message first.' });
  const other = c.buyer_id === me ? c.seller_id : c.buyer_id;
  const { rows: [o] } = await query('SELECT is_banned FROM users WHERE id=$1', [other]);
  if (!o || o.is_banned) return res.status(400).json({ error: 'You can no longer message this person.' });
  const { rows: [{ n }] } = await query("SELECT COUNT(*)::int AS n FROM messages WHERE sender_id=$1 AND created_at > now() - interval '1 minute'", [me]);
  if (n >= 20) return res.status(429).json({ error: 'You are sending messages too fast. Wait a moment.' });
  const { rows: [m] } = await query('INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3) RETURNING id::int AS id, sender_id, body, created_at', [c.id, me, body]);
  await query('UPDATE conversations SET last_message_at=now() WHERE id=$1', [c.id]);
  res.status(201).json(m);
});

export const unread = wrap(async (req, res) => {
  const { rows: [r] } = await query(
    `SELECT COUNT(*)::int AS n FROM messages m JOIN conversations c ON c.id=m.conversation_id
     WHERE (c.buyer_id=$1 OR c.seller_id=$1) AND m.sender_id<>$1 AND m.read_at IS NULL`, [req.user.id]);
  res.json({ unread: r.n });
});
