import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads', import.meta.url));
mkdirSync(UPLOAD_DIR, { recursive: true });

const OK = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, randomUUID() + (OK[file.mimetype] || extname(file.originalname))),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) =>
    OK[file.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only JPG, PNG or WebP photos are allowed.'), { status: 400 })),
});
