-- ============================================================
-- SWIFTPAY NOTIFICATIONS TABLE
-- Run this in your Supabase SQL Editor (after kyc_system.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL DEFAULT 'info',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Disable RLS (backend manages access via verifyToken)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Auto-delete notifications older than 30 days (keep table clean)
-- (Optional: run as a Supabase scheduled job or pg_cron if available)
-- DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';

-- Verification
SELECT COUNT(*) AS notification_rows FROM notifications;
