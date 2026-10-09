import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
const r = Router();
r.post('/', requireAuth, upload.array('images', 4), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Choose at least one photo.' });
  res.status(201).json({ urls: req.files.map((f) => `/uploads/${f.filename}`) });
});
export default r;
