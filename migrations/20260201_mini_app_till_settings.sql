ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS till_id UUID REFERENCES tills(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS default_till_id UUID REFERENCES tills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mini_apps_till_id ON mini_apps(till_id);
CREATE INDEX IF NOT EXISTS idx_users_default_till_id ON users(default_till_id);
