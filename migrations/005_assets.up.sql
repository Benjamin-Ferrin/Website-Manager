CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(127) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_business_id ON assets (business_id);
CREATE INDEX idx_assets_mime_type ON assets (business_id, mime_type);
