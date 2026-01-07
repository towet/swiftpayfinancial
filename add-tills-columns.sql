-- Add missing columns to tills table for suspend/reactivate functionality

-- Add status column if it doesn't exist
ALTER TABLE tills ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add suspended_at column if it doesn't exist
ALTER TABLE tills ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

-- Add suspension_reason column if it doesn't exist
ALTER TABLE tills ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_tills_status ON tills(status);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tills' 
AND column_name IN ('status', 'suspended_at', 'suspension_reason');

-- Update existing tills to have 'active' status if null
UPDATE tills SET status = 'active' WHERE status IS NULL;
