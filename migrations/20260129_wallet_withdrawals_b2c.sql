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

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_originator_conversation_id TEXT;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_conversation_id TEXT;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_response JSONB;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_result JSONB;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_result_code INTEGER;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_result_desc TEXT;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_transaction_id TEXT;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_transaction_receipt TEXT;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_initiated_at TIMESTAMPTZ;

ALTER TABLE wallet_withdrawal_requests
  ADD COLUMN IF NOT EXISTS payout_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_requests_wallet_id
  ON wallet_withdrawal_requests(wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_withdrawal_requests_payout_originator
  ON wallet_withdrawal_requests(payout_originator_conversation_id);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_wallet_withdrawal_requests_payout_originator
  ON wallet_withdrawal_requests(payout_originator_conversation_id)
  WHERE payout_originator_conversation_id IS NOT NULL;
