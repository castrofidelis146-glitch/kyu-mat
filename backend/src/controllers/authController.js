import bcrypt from 'bcryptjs';
import { normalizePhone } from '../utils/phone.js';
import jwt from 'jsonwebtoken';
import * as Users from '../models/userModel.js';
const sign = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
export const register = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;
    const phone_number = normalizePhone(req.body.phone_number);
    if (!phone_number) return res.status(400).json({ error: 'Enter a valid Kenyan phone number, e.g. +254 712 345 678.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    const user = await Users.createUser({ full_name, email, phone_number, password_hash: await bcrypt.hash(password, 10) });
    res.status(201).json({ user, token: sign(user) });
  } catch (e) { next(e); }
};
export const login = async (req, res, next) => {
  try {
    const u = await Users.findByIdentifier(req.body.identifier);
    if (!u || !(await bcrypt.compare(req.body.password, u.password_hash)))
      return res.status(401).json({ error: 'Wrong email/phone or password.' });
    if (u.is_banned) return res.status(403).json({ error: 'This account has been suspended.' });
    const { password_hash, ...user } = u;
    res.json({ user, token: sign(user) });
  } catch (e) { next(e); }
};
