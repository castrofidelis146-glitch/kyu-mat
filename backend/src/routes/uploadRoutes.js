import { Router } from 'express';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { requireAuth } from '../middleware/auth.js';
import { upload, UPLOAD_DIR, EXT } from '../middleware/upload.js';

const useCloud = /^cloudinary:\/\//.test(process.env.CLOUDINARY_URL || '');
const cloudinary = useCloud ? (await import('cloudinary')).v2 : null;
if (!useCloud) console.warn('CLOUDINARY_URL missing or invalid: saving photos to local disk (they will be lost on redeploy).');
const toCloud = (buf) => new Promise((ok, fail) =>
  cloudinary.uploader.upload_stream({ folder: 'kyu-mart', resource_type: 'image' }, (e, r) => (e ? fail(e) : ok(r.secure_url))).end(buf));
const toDisk = async (f) => {
  const name = randomUUID() + EXT[f.mimetype];
  await writeFile(join(UPLOAD_DIR, name), f.buffer);
  return `/uploads/${name}`;
};

const r = Router();
r.post('/', requireAuth, upload.array('images', 4), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'Choose at least one photo.' });
    const urls = await Promise.all(req.files.map((f) => (useCloud ? toCloud(f.buffer) : toDisk(f))));
    res.status(201).json({ urls });
  } catch (e) { next(e); }
});
export default r;
