const pool = require('../db/pool');
const { flattenObject, unflattenObject, inferFieldType } = require('../utils/nested');

function entryToValue(row) {
  if (!row) return null;
  if (row.value_json != null) return row.value_json;
  return row.value_text;
}

async function getContentMap(businessId, pageId = null) {
  const { rows } = await pool.query(
    pageId == null
      ? `SELECT field_key, field_type, value_text, value_json
         FROM content_entries
         WHERE business_id = $1 AND page_id IS NULL
         ORDER BY field_key`
      : `SELECT field_key, field_type, value_text, value_json
         FROM content_entries
         WHERE business_id = $1 AND page_id = $2
         ORDER BY field_key`,
    pageId == null ? [businessId] : [businessId, pageId]
  );

  const flat = {};
  for (const row of rows) {
    flat[row.field_key] = {
      field_type: row.field_type,
      value: entryToValue(row),
    };
  }
  return flat;
}

async function getContentTree(businessId, pageId = null) {
  const flat = await getContentMap(businessId, pageId);
  const values = {};
  for (const [key, entry] of Object.entries(flat)) {
    values[key] = entry.value;
  }
  return unflattenObject(values);
}

async function upsertEntry(businessId, pageId, fieldKey, fieldType, value) {
  const isJson = ['json', 'image', 'link', 'file', 'html'].includes(fieldType)
    || (typeof value === 'object' && value !== null);

  const valueText = isJson ? null : String(value ?? '');
  const valueJson = isJson ? (typeof value === 'object' ? value : { html: value }) : null;

  const existing = await pool.query(
    `SELECT id FROM content_entries
     WHERE business_id = $1 AND field_key = $2
       AND (page_id IS NOT DISTINCT FROM $3)`,
    [businessId, fieldKey, pageId]
  );

  if (existing.rows.length) {
    await pool.query(
      `UPDATE content_entries
       SET field_type = $1, value_text = $2, value_json = $3, updated_at = NOW()
       WHERE id = $4`,
      [fieldType, valueText, valueJson, existing.rows[0].id]
    );
  } else {
    await pool.query(
      `INSERT INTO content_entries (business_id, page_id, field_key, field_type, value_text, value_json)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [businessId, pageId, fieldKey, fieldType, valueText, valueJson]
    );
  }
}

async function upsertFromFlat(businessId, pageId, flatContent) {
  for (const [key, raw] of Object.entries(flatContent)) {
    let value = raw;
    let fieldType = inferFieldType(key, raw);

    if (raw && typeof raw === 'object' && raw.field_type) {
      fieldType = raw.field_type;
      value = raw.value ?? raw;
    }

    if (fieldType === 'html' && typeof value === 'string') {
      value = { html: value };
    }

    await upsertEntry(businessId, pageId, key, fieldType, value);
  }
}

async function syncFromObject(businessId, pageId, obj) {
  const flat = flattenObject(obj);
  await upsertFromFlat(businessId, pageId, flat);
}

async function updateContent(businessId, pageId, updates) {
  for (const [key, value] of Object.entries(updates)) {
    const fieldType = inferFieldType(key, value);
    await upsertEntry(businessId, pageId, key, fieldType, value);
  }
}

async function deleteEntry(businessId, pageId, fieldKey) {
  await pool.query(
    `DELETE FROM content_entries
     WHERE business_id = $1 AND field_key = $2
       AND (page_id IS NOT DISTINCT FROM $3)`,
    [businessId, fieldKey, pageId]
  );
}

module.exports = {
  getContentMap,
  getContentTree,
  upsertEntry,
  upsertFromFlat,
  syncFromObject,
  updateContent,
  deleteEntry,
  entryToValue,
};
