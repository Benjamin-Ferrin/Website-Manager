const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const config = require('../config');
const pdfService = require('./pdfDocuments');

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const ALLOWED_PDF_TYPES = new Set(['application/pdf']);

function ensureUploadDir(businessId) {
  const dir = path.join(config.uploadDir, String(businessId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function validateFile(file) {
  const allowed = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES]);
  if (!allowed.has(file.mimetype)) {
    throw new Error(`File type not allowed: ${file.mimetype}`);
  }
  if (file.size > config.maxUploadBytes) {
    throw new Error(`File too large. Max ${config.maxUploadBytes} bytes.`);
  }
}

async function saveAsset(businessId, file) {
  validateFile(file);
  const dir = ensureUploadDir(businessId);
  const ext = path.extname(file.originalname) || '';
  const filename = `${uuidv4()}${ext}`;
  const destPath = path.join(dir, filename);

  fs.renameSync(file.path, destPath);

  const relativePath = path.join(String(businessId), filename).replace(/\\/g, '/');
  const publicUrl = `/uploads/${relativePath}`;

  const { rows } = await pool.query(
    `INSERT INTO assets (business_id, filename, original_name, mime_type, file_path, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [businessId, filename, file.originalname, file.mimetype, destPath, file.size]
  );

  const asset = rows[0];
  asset.public_url = publicUrl;

  if (ALLOWED_PDF_TYPES.has(file.mimetype)) {
    asset.pdf_document = await pdfService.processPdfUpload(businessId, asset);
  }

  return asset;
}

async function getAssets(businessId) {
  const { rows } = await pool.query(
    `SELECT * FROM assets WHERE business_id = $1 ORDER BY created_at DESC`,
    [businessId]
  );
  return rows.map((row) => ({
    ...row,
    public_url: `/uploads/${path.basename(path.dirname(row.file_path))}/${row.filename}`.replace(/\\/g, '/'),
  }));
}

async function getAssetById(businessId, assetId) {
  const { rows } = await pool.query(
    `SELECT * FROM assets WHERE id = $1 AND business_id = $2`,
    [assetId, businessId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    public_url: `/uploads/${String(businessId)}/${row.filename}`,
  };
}

async function deleteAsset(businessId, assetId) {
  const asset = await getAssetById(businessId, assetId);
  if (!asset) return false;

  if (fs.existsSync(asset.file_path)) {
    fs.unlinkSync(asset.file_path);
  }

  await pool.query('DELETE FROM assets WHERE id = $1 AND business_id = $2', [
    assetId,
    businessId,
  ]);
  return true;
}

module.exports = {
  saveAsset,
  getAssets,
  getAssetById,
  deleteAsset,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_PDF_TYPES,
};
