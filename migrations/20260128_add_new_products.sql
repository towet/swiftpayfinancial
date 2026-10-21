-- ============================================
-- NEW PRODUCTS SCHEMA: MINI-APPS, ESCROW, LENDING
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Mini-Apps Table
CREATE TABLE IF NOT EXISTS mini_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  theme_config JSONB DEFAULT '{"primaryColor": "#2563eb", "layout": "grid"}'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mini-App Products Table
CREATE TABLE IF NOT EXISTS mini_app_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mini_app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Escrow Transactions Table (Extends existing transactions)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_escrow BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(20); -- 'held', 'released', 'disputed'
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS release_code VARCHAR(10);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(20); -- 'pending', 'shipped', 'delivered'

-- 4. Merchant Loans (Float-Flow)
CREATE TABLE IF NOT EXISTS merchant_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  total_repayable DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'cleared', 'defaulted'
  disbursed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cleared_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mini_apps_user_id ON mini_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_mini_apps_slug ON mini_apps(slug);
CREATE INDEX IF NOT EXISTS idx_merchant_loans_user_id ON merchant_loans(user_id);

CREATE TABLE IF NOT EXISTS admin_notification_settings (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  emails TEXT[] NOT NULL DEFAULT '{}'::text[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  phone_number TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_requests_user_id ON wallet_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_requests_status ON wallet_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_requests_created_at ON wallet_withdrawal_requests(created_at);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  entry_type VARCHAR(10) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'KES',
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  reference TEXT,
  phone_number TEXT,
  mpesa_receipt_number TEXT,
  checkout_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created_at ON wallet_ledger(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_wallet_ledger_checkout_request_id
  ON wallet_ledger(checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS wallet_stk_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  phone_number TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  mpesa_request_id TEXT,
  checkout_request_id TEXT,
  mpesa_response JSONB,
  callback_data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_stk_deposits_wallet_id ON wallet_stk_deposits(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_stk_deposits_status ON wallet_stk_deposits(status);
CREATE INDEX IF NOT EXISTS idx_wallet_stk_deposits_created_at ON wallet_stk_deposits(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_wallet_stk_deposits_checkout_request_id
  ON wallet_stk_deposits(checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;
