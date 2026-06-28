require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE_MS || '86400000', 10),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './public/uploads'),
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '10485760', 10),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  templatesDir: path.resolve('./templates'),
};
