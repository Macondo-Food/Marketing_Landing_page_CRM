import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_TYPES = [...IMAGE_TYPES, 'application/pdf', 'video/mp4'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;    // 20 MB

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'landings', req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const hash = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 50);
    cb(null, `${base}-${hash}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
  const maxSize = IMAGE_TYPES.includes(file.mimetype) ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
  if (file.size > maxSize) {
    const mb = maxSize / 1024 / 1024;
    return cb(new Error(`Archivo excede el límite de ${mb} MB`), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export { IMAGE_TYPES };
export default upload;
