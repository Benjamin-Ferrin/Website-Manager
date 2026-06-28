const pool = require('../db/pool');

async function getMenuItems(businessId) {
  const { rows } = await pool.query(
    `SELECT * FROM menu_items WHERE business_id = $1 ORDER BY sort_order, id`,
    [businessId]
  );
  return rows;
}

async function replaceMenu(businessId, items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM menu_items WHERE business_id = $1', [businessId]);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await client.query(
        `INSERT INTO menu_items (business_id, label, url, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [businessId, item.label, item.url, item.sort_order ?? i]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getMenuItems,
  replaceMenu,
};
