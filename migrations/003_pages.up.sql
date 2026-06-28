CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  template_path VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_home BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, slug)
);

CREATE INDEX idx_pages_business_id ON pages (business_id);
CREATE INDEX idx_pages_business_home ON pages (business_id, is_home) WHERE is_home = TRUE;
