const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { ALLOWED_IMAGE_TYPES, ALLOWED_PDF_TYPES } = require('../services/assets');

fs.mkdirSync(config.uploadDir, { recursive: true });

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tmp = path.join(config.uploadDir, '_tmp');
    fs.mkdirSync(tmp, { recursive: true });
    cb(null, tmp);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const allowedMimes = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES]);

function fileFilter(req, file, cb) {
  if (!allowedMimes.has(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
}

const upload = multer({
  storage: tempStorage,
  limits: { fileSize: config.maxUploadBytes },
  fileFilter,
});

module.exports = { upload };
