import 'dotenv/config';
import { pool } from './db.js';
const email = process.env.PROMOTE_EMAIL;
if (email) {
  const { rowCount } = await pool.query('UPDATE users SET is_admin = true WHERE email = $1', [email.toLowerCase()]);
  console.log(rowCount ? `Promoted ${email} to admin` : `No account found for ${email}. Register it first.`);
}
await pool.end();
