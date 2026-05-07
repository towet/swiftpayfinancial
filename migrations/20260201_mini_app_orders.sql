CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS mini_app_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mini_app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  product_id UUID REFERENCES mini_app_products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  phone_number TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  mpesa_request_id TEXT,
  checkout_request_id TEXT,
  mpesa_receipt_number TEXT,
  mpesa_response JSONB,
  callback_data JSONB,
  result_code INTEGER,
  result_desc TEXT,
  stock_deducted BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mini_app_orders_mini_app_id ON mini_app_orders(mini_app_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_orders_product_id ON mini_app_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_orders_status ON mini_app_orders(status);
CREATE INDEX IF NOT EXISTS idx_mini_app_orders_created_at ON mini_app_orders(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mini_app_orders_checkout_request_id
  ON mini_app_orders(checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS mini_app_order_id UUID REFERENCES mini_app_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_mini_app_order_id ON transactions(mini_app_order_id);

ALTER TABLE IF EXISTS wallet_stk_deposits
  ADD COLUMN IF NOT EXISTS mini_app_order_id UUID REFERENCES mini_app_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_stk_deposits_mini_app_order_id ON wallet_stk_deposits(mini_app_order_id);
