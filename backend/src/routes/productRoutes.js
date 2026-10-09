import { Router } from 'express';
import * as c from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';
import { require_ } from '../middleware/validate.js';
const r = Router();
r.get('/categories', c.categories);
r.get('/', c.list);               // ?category=slug&type=FOR_SALE&q=laptop&sort=newest|price_asc|price_desc
r.get('/mine', requireAuth, c.mine);
r.get('/favorites', requireAuth, c.favorites);
r.post('/:id/favorite', requireAuth, c.addFav);
r.delete('/:id/favorite', requireAuth, c.removeFav);
r.get('/:id', c.get);
r.post('/', requireAuth, require_('title', 'category_id'), c.create);
r.put('/:id', requireAuth, c.update);
r.delete('/:id', requireAuth, c.remove);
export default r;
