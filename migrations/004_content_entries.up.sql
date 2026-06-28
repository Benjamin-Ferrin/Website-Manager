CREATE TYPE content_field_type AS ENUM (
  'text',
  'multiline',
  'image',
  'link',
  'html',
  'json',
  'file'
);

CREATE TABLE IF NOT EXISTS content_entries (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  page_id INTEGER REFERENCES pages (id) ON DELETE CASCADE,
  field_key VARCHAR(255) NOT NULL,
  field_type content_field_type NOT NULL DEFAULT 'text',
  value_text TEXT,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_content_entries_business_global
  ON content_entries (business_id, field_key)
  WHERE page_id IS NULL;

CREATE UNIQUE INDEX idx_content_entries_business_page
  ON content_entries (business_id, page_id, field_key)
  WHERE page_id IS NOT NULL;

CREATE INDEX idx_content_entries_business ON content_entries (business_id);
CREATE INDEX idx_content_entries_page ON content_entries (page_id) WHERE page_id IS NOT NULL;
