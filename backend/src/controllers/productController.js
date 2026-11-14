import jwt from 'jsonwebtoken';
import * as P from '../models/productModel.js';
import { recordView } from '../utils/analytics.js';
const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const guardOwner = async (req, res) => {
  const o = await P.owner(req.params.id);
  if (!o) { res.status(404).json({ error: 'Listing not found.' }); return false; }
  if (o !== req.user.id) { res.status(403).json({ error: 'You can only change your own listings.' }); return false; }
  return true;
};
export const list = wrap(async (req, res) => res.json(await P.list(req.query)));
export const categories = wrap(async (req, res) => res.json(await P.categories()));
export const get = wrap(async (req, res) => {
  let authed = false;
  try { jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), process.env.JWT_SECRET); authed = true; } catch {}
  const p = await P.getById(req.params.id, authed);
  if (p) recordView(req, p);
  p ? res.json(p) : res.status(404).json({ error: 'Listing not found.' });
});
export const create = wrap(async (req, res) => res.status(201).json(await P.getById(await P.create(req.user.id, req.body))));
export const update = wrap(async (req, res) => {
  if (!(await guardOwner(req, res))) return;
  await P.update(req.params.id, req.body);
  res.json(await P.getById(req.params.id));
});
export const remove = wrap(async (req, res) => {
  if (!(await guardOwner(req, res))) return;
  await P.remove(req.params.id);
  res.status(204).end();
});
export const mine = wrap(async (req, res) => res.json(await P.mine(req.user.id)));
export const favorites = wrap(async (req, res) => res.json(await P.favorites(req.user.id)));
export const addFav = wrap(async (req, res) => { await P.addFav(req.user.id, req.params.id); res.status(204).end(); });
export const removeFav = wrap(async (req, res) => { await P.removeFav(req.user.id, req.params.id); res.status(204).end(); });
