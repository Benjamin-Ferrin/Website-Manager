CREATE TYPE pdf_conversion_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE IF NOT EXISTS pdf_documents (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  generated_html TEXT,
  conversion_status pdf_conversion_status NOT NULL DEFAULT 'pending',
  conversion_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_documents_business ON pdf_documents (business_id);
CREATE INDEX idx_pdf_documents_asset ON pdf_documents (asset_id);
