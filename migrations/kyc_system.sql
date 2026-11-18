-- ============================================================
-- SWIFTPAY KYC SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. Add KYC columns to users table ──────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'unverified'
    CHECK (kyc_status IN ('unverified','submitted','verified','rejected')),
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS kyc_deadline    TIMESTAMP WITH TIME ZONE;

-- Set 24-hour deadline for ALL existing users (from NOW)
UPDATE users
SET kyc_deadline = NOW() + INTERVAL '24 hours'
WHERE kyc_deadline IS NULL;

-- ── 2. KYC submissions table ────────────────────────────────
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Identity fields
  full_name     TEXT NOT NULL,
  id_number     TEXT NOT NULL,
  id_type       VARCHAR(30) NOT NULL DEFAULT 'national_id'
                CHECK (id_type IN ('national_id','passport','driving_license')),

  -- Document images (Supabase Storage public URLs)
  id_front_url  TEXT NOT NULL,
  id_back_url   TEXT,
  selfie_url    TEXT,

  -- Review lifecycle
  status        VARCHAR(20) NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted','under_review','verified','rejected')),
  admin_note    TEXT,
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMP WITH TIME ZONE,

  submitted_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)   -- one active submission per user; re-submit replaces via upsert
);

CREATE INDEX IF NOT EXISTS idx_kyc_user_id  ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status   ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submitted ON kyc_submissions(submitted_at DESC);

-- ── 3. Disable RLS (backend manages access) ─────────────────
ALTER TABLE kyc_submissions DISABLE ROW LEVEL SECURITY;

-- ── 4. Create Supabase Storage bucket for KYC documents ─────
-- NOTE: Run this separately if the SQL editor doesn't support storage functions.
-- Or create the bucket manually in Supabase > Storage > New Bucket > "kyc-documents" (private).
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow backend service role to manage the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Service role full access on kyc-documents'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role full access on kyc-documents"
      ON storage.objects FOR ALL
      TO service_role
      USING (bucket_id = 'kyc-documents')
    $policy$;
  END IF;
END $$;

-- ── 5. Verification query ───────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM users WHERE kyc_status = 'unverified')  AS unverified_users,
  (SELECT COUNT(*) FROM users WHERE kyc_status = 'submitted')   AS submitted_users,
  (SELECT COUNT(*) FROM users WHERE kyc_status = 'verified')    AS verified_users,
  (SELECT COUNT(*) FROM kyc_submissions)                         AS total_submissions;
