import { registerAs } from '@nestjs/config';

const DEFAULT_ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default registerAs('upload', () => ({
  dir: process.env.UPLOAD_DIR || './uploads',
  maxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '5', 10),
  allowedMimetypes: process.env.UPLOAD_ALLOWED_MIMETYPES
    ? process.env.UPLOAD_ALLOWED_MIMETYPES.split(',').map((m) => m.trim())
    : DEFAULT_ALLOWED_MIMETYPES,
}));
