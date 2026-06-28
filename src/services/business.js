const pool = require('../db/pool');

async function getAll() {
  const { rows } = await pool.query(
    'SELECT * FROM businesses ORDER BY name'
  );
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query('SELECT * FROM businesses WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getBySlug(slug) {
  const { rows } = await pool.query('SELECT * FROM businesses WHERE slug = $1', [slug]);
  return rows[0] || null;
}

async function getByDomain(domain) {
  const normalized = domain.split(':')[0].toLowerCase();
  const { rows } = await pool.query(
    'SELECT * FROM businesses WHERE LOWER(domain) = $1',
    [normalized]
  );
  return rows[0] || null;
}

async function create({ name, slug, domain, settings = {} }) {
  const { rows } = await pool.query(
    `INSERT INTO businesses (name, slug, domain, settings)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, slug, domain || null, JSON.stringify(settings)]
  );
  return rows[0];
}

async function update(id, { name, slug, domain, settings }) {
  const { rows } = await pool.query(
    `UPDATE businesses
     SET name = COALESCE($2, name),
         slug = COALESCE($3, slug),
         domain = $4,
         settings = COALESCE($5, settings),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, name, slug, domain, settings ? JSON.stringify(settings) : null]
  );
  return rows[0] || null;
}

async function remove(id) {
  await pool.query('DELETE FROM businesses WHERE id = $1', [id]);
}

module.exports = {
  getAll,
  getById,
  getBySlug,
  getByDomain,
  create,
  update,
  remove,
};
