CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  till_id UUID REFERENCES tills(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  link TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  require_contact BOOLEAN NOT NULL DEFAULT false,
  require_email BOOLEAN NOT NULL DEFAULT false,
  custom_fields TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_payment_links_link ON payment_links(link);
CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON payment_links(user_id);

ALTER TABLE IF EXISTS payment_links
  ADD COLUMN IF NOT EXISTS till_id UUID REFERENCES tills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_links_till_id ON payment_links(till_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);
CREATE INDEX IF NOT EXISTS idx_payment_links_expires_at ON payment_links(expires_at);

ALTER TABLE IF EXISTS wallet_stk_deposits
  ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_stk_deposits_payment_link_id ON wallet_stk_deposits(payment_link_id);

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_link_id ON transactions(payment_link_id);
