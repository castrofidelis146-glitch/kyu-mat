import { Router } from 'express';
import { recordPing, publicStats } from '../utils/siteStats.js';
const r = Router();
r.post('/ping', (req, res) => { recordPing(req); res.status(204).end(); });
r.get('/public', async (req, res, next) => {
  try { res.set('Cache-Control', 'no-store'); res.json(await publicStats()); } catch (e) { next(e); }
});
export default r;
