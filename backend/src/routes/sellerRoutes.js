import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { stats, profile, rate } from '../controllers/sellerController.js';
const r = Router();
r.get('/stats', requireAuth, stats); // must stay above /:id
r.get('/:id', profile);
r.post('/:id/rating', requireAuth, rate);
export default r;
