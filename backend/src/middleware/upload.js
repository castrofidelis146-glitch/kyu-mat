import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads', import.meta.url));
mkdirSync(UPLOAD_DIR, { recursive: true });

export const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only JPG, PNG or WebP photos are allowed.'), { status: 400 })),
});
