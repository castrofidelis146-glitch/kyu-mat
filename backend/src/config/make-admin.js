import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { normalizePhone } from '../utils/phone.js';
const [email, password, phoneRaw, name = 'Admin'] = process.argv.slice(2);
const phone = normalizePhone(phoneRaw);
if (!email || !password || !phone) { console.error('Usage: node src/config/make-admin.js EMAIL PASSWORD PHONE [NAME]'); process.exit(1); }
const hash = await bcrypt.hash(password, 10);
const { rows } = await pool.query(
  `INSERT INTO users (full_name,email,phone_number,password_hash,is_admin) VALUES ($1,$2,$3,$4,true)
   ON CONFLICT (email) DO UPDATE SET password_hash=$4, is_admin=true, is_banned=false RETURNING email, phone_number, is_admin`,
  [name, email.toLowerCase(), phone, hash]);
console.log(rows[0]);
await pool.end();
