CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  parent_id INTEGER REFERENCES menu_items (id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_business ON menu_items (business_id);
CREATE INDEX idx_menu_items_parent ON menu_items (parent_id) WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
