const pool = require('../db/pool');
const pdfConverter = require('./pdf/index');

async function processPdfUpload(businessId, asset) {
  const publicUrl = `/uploads/${businessId}/${asset.filename}`;

  const { rows } = await pool.query(
    `INSERT INTO pdf_documents (business_id, asset_id, title, conversion_status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [businessId, asset.id, asset.original_name]
  );

  const doc = rows[0];

  try {
    const result = await pdfConverter.convertPdfToHtml(asset.file_path, { publicUrl });

    const status = result.status === 'failed' ? 'failed' : 'success';
    const error = result.status === 'failed' ? 'Used fallback embed converter' : null;

    const { rows: updated } = await pool.query(
      `UPDATE pdf_documents
       SET generated_html = $1, conversion_status = $2, conversion_error = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [result.html, status, error, doc.id]
    );

    return updated[0];
  } catch (err) {
    const fallback = await pdfConverter.converters[pdfConverter.converters.length - 1].convert(
      asset.file_path,
      { publicUrl }
    );

    const { rows: updated } = await pool.query(
      `UPDATE pdf_documents
       SET generated_html = $1, conversion_status = 'failed', conversion_error = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [fallback.html, err.message, doc.id]
    );

    return updated[0];
  }
}

async function getPdfDocuments(businessId) {
  const { rows } = await pool.query(
    `SELECT pd.*, a.filename, a.original_name, a.mime_type
     FROM pdf_documents pd
     JOIN assets a ON a.id = pd.asset_id
     WHERE pd.business_id = $1
     ORDER BY pd.created_at DESC`,
    [businessId]
  );
  return rows.map((row) => ({
    ...row,
    public_url: `/uploads/${businessId}/${row.filename}`,
  }));
}

async function getPdfDocument(businessId, pdfId) {
  const { rows } = await pool.query(
    `SELECT pd.*, a.filename, a.original_name, a.mime_type, a.file_path
     FROM pdf_documents pd
     JOIN assets a ON a.id = pd.asset_id
     WHERE pd.id = $1 AND pd.business_id = $2`,
    [pdfId, businessId]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    public_url: `/uploads/${businessId}/${rows[0].filename}`,
  };
}

module.exports = {
  processPdfUpload,
  getPdfDocuments,
  getPdfDocument,
};
