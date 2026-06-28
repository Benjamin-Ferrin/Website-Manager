const pool = require('../db/pool');

async function getPages(businessId) {
  const { rows } = await pool.query(
    'SELECT * FROM pages WHERE business_id = $1 ORDER BY sort_order, title',
    [businessId]
  );
  return rows;
}

async function getPage(businessId, pageId) {
  const { rows } = await pool.query(
    'SELECT * FROM pages WHERE id = $1 AND business_id = $2',
    [pageId, businessId]
  );
  return rows[0] || null;
}

async function getPageBySlug(businessId, slug) {
  const { rows } = await pool.query(
    'SELECT * FROM pages WHERE business_id = $1 AND slug = $2',
    [businessId, slug]
  );
  return rows[0] || null;
}

async function getHomePage(businessId) {
  const { rows } = await pool.query(
    'SELECT * FROM pages WHERE business_id = $1 AND is_home = TRUE LIMIT 1',
    [businessId]
  );
  if (rows[0]) return rows[0];

  const fallback = await pool.query(
    'SELECT * FROM pages WHERE business_id = $1 ORDER BY sort_order LIMIT 1',
    [businessId]
  );
  return fallback.rows[0] || null;
}

async function createPage(businessId, data) {
  const { rows } = await pool.query(
    `INSERT INTO pages (business_id, slug, title, template_path, sort_order, is_home)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      businessId,
      data.slug,
      data.title,
      data.template_path,
      data.sort_order ?? 0,
      data.is_home ?? false,
    ]
  );
  return rows[0];
}

async function updatePage(businessId, pageId, data) {
  const { rows } = await pool.query(
    `UPDATE pages
     SET slug = COALESCE($3, slug),
         title = COALESCE($4, title),
         template_path = COALESCE($5, template_path),
         sort_order = COALESCE($6, sort_order),
         is_home = COALESCE($7, is_home),
         updated_at = NOW()
     WHERE id = $2 AND business_id = $1
     RETURNING *`,
    [
      businessId,
      pageId,
      data.slug,
      data.title,
      data.template_path,
      data.sort_order,
      data.is_home,
    ]
  );
  return rows[0] || null;
}

async function deletePage(businessId, pageId) {
  await pool.query('DELETE FROM pages WHERE id = $1 AND business_id = $2', [
    pageId,
    businessId,
  ]);
}

module.exports = {
  getPages,
  getPage,
  getPageBySlug,
  getHomePage,
  createPage,
  updatePage,
  deletePage,
};
