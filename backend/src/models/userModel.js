import { query } from '../config/db.js';
import { normalizePhone } from '../utils/phone.js';
const cols = 'id, full_name, email, phone_number, campus_location, profile_image_url';
export const createUser = async ({ full_name, email, phone_number, password_hash }) =>
  (await query(`INSERT INTO users (full_name,email,phone_number,password_hash) VALUES ($1,$2,$3,$4) RETURNING ${cols}`,
    [full_name, email.toLowerCase(), phone_number, password_hash])).rows[0];
export const findByIdentifier = async (id) =>
  (await query('SELECT * FROM users WHERE email=$1 OR phone_number=$2', [id.toLowerCase(), (!id.includes('@') && normalizePhone(id)) || id])).rows[0];
