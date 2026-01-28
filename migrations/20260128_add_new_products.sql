-- ============================================
-- NEW PRODUCTS SCHEMA: MINI-APPS, ESCROW, LENDING
-- ============================================

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
