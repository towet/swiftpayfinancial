-- ============================================================
-- SWIFTPAY TOKEN SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Token balance per user (prepaid credits)
CREATE TABLE IF NOT EXISTS token_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_topped_up NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_fees_charged NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_token_accounts_user_id ON token_accounts(user_id);

-- 2. Token ledger – every debit/credit (top-up or fee deduction)
CREATE TABLE IF NOT EXISTS token_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(12, 2) NOT NULL,
  source VARCHAR(60) NOT NULL,          -- 'topup_mpesa' | 'platform_fee' | 'manual_adjustment'
  reference TEXT,                       -- transaction_id, deposit_id, etc.
  description TEXT,
  transaction_amount NUMERIC(12, 2),    -- amount of the M-Pesa txn that triggered the fee
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_ledger_user_id ON token_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_token_ledger_created_at ON token_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_ledger_reference ON token_ledger(reference);

-- 3. Token top-up requests (M-Pesa STK Push)
CREATE TABLE IF NOT EXISTS token_topup_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  phone_number TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  mpesa_request_id TEXT,
  checkout_request_id TEXT,
  mpesa_response JSONB,
  callback_data JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_topup_user_id ON token_topup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_token_topup_checkout ON token_topup_requests(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_token_topup_mpesa ON token_topup_requests(mpesa_request_id);
CREATE INDEX IF NOT EXISTS idx_token_topup_status ON token_topup_requests(status);

-- 4. Add platform_fee and fee_charged columns to transactions table
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS fee_charged BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fee_ledger_id UUID REFERENCES token_ledger(id);

-- 5. Disable RLS for backend-managed tables
ALTER TABLE token_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_topup_requests DISABLE ROW LEVEL SECURITY;

-- 6. Seed a token_account for all existing users (balance = 0)
INSERT INTO token_accounts (user_id, balance, total_topped_up, total_fees_charged)
SELECT id, 0, 0, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT 
  (SELECT COUNT(*) FROM token_accounts) AS token_accounts,
  (SELECT COUNT(*) FROM token_ledger) AS token_ledger_rows,
  (SELECT COUNT(*) FROM token_topup_requests) AS topup_requests;
