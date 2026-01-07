-- ============================================
-- SUPER ADMIN DATABASE SCHEMA
-- ============================================

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Alert Rules Table
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'revenue_drop', 'failure_spike', 'new_till', 'high_value_transaction'
  conditions JSONB NOT NULL,
  threshold DECIMAL(10, 2),
  comparison_operator VARCHAR(10), -- 'gt', 'lt', 'eq'
  enabled BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["email"]'::jsonb,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alert rules
CREATE INDEX IF NOT EXISTS idx_alert_rules_admin_id ON alert_rules(admin_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);

-- Alert History Table
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for alert history
CREATE INDEX IF NOT EXISTS idx_alert_history_rule_id ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON alert_history(triggered_at DESC);

-- System Health Metrics Table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(50) NOT NULL, -- 'api_response_time', 'error_rate', 'db_query_time', 'mpesa_gateway_status'
  metric_name VARCHAR(100) NOT NULL,
  value DECIMAL(15, 4),
  unit VARCHAR(20),
  status VARCHAR(20), -- 'healthy', 'warning', 'critical'
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system health metrics
CREATE INDEX IF NOT EXISTS idx_system_health_type ON system_health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded_at ON system_health_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health_metrics(status);

-- Anomaly Detection Results Table
CREATE TABLE IF NOT EXISTS anomaly_detection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- 'transaction', 'till', 'user'
  entity_id VARCHAR(255) NOT NULL,
  anomaly_type VARCHAR(50) NOT NULL, -- 'unusual_amount', 'rapid_transactions', 'failure_spike', 'geographic_anomaly'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  confidence_score DECIMAL(5, 2),
  details JSONB,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create indexes for anomaly detection
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_entity ON anomaly_detection(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_type ON anomaly_detection(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_severity ON anomaly_detection(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_detected_at ON anomaly_detection(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_resolved ON anomaly_detection(resolved);

-- User Risk Scores Table
CREATE TABLE IF NOT EXISTS user_risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_score DECIMAL(5, 2) NOT NULL, -- 0-100
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  factors JSONB,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for user risk scores
CREATE INDEX IF NOT EXISTS idx_user_risk_scores_user_id ON user_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_risk_scores_level ON user_risk_scores(risk_level);

-- Till Risk Scores Table
CREATE TABLE IF NOT EXISTS till_risk_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  till_id UUID NOT NULL REFERENCES tills(id) ON DELETE CASCADE,
  risk_score DECIMAL(5, 2) NOT NULL, -- 0-100
  risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  factors JSONB,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(till_id)
);

-- Create indexes for till risk scores
CREATE INDEX IF NOT EXISTS idx_till_risk_scores_till_id ON till_risk_scores(till_id);
CREATE INDEX IF NOT EXISTS idx_till_risk_scores_level ON till_risk_scores(risk_level);

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'merchants', 'admins'
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

-- User Read Announcements Table
CREATE TABLE IF NOT EXISTS user_read_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);

-- Create indexes for user read announcements
CREATE INDEX IF NOT EXISTS idx_user_read_announcements_user_id ON user_read_announcements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_read_announcements_announcement_id ON user_read_announcements(announcement_id);

-- Scheduled Reports Table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'transactions', 'revenue', 'tills', 'users'
  schedule VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  recipients JSONB NOT NULL,
  filters JSONB,
  format VARCHAR(10) DEFAULT 'csv', -- 'csv', 'pdf', 'excel'
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scheduled reports
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_admin_id ON scheduled_reports(admin_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_enabled ON scheduled_reports(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);

-- Report History Table
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_url TEXT,
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  error_message TEXT,
  record_count INTEGER
);

-- Create indexes for report history
CREATE INDEX IF NOT EXISTS idx_report_history_report_id ON report_history(report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_at ON report_history(generated_at DESC);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables with updated_at
CREATE TRIGGER trigger_alert_rules_updated_at
BEFORE UPDATE ON alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_risk_scores_updated_at
BEFORE UPDATE ON user_risk_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_till_risk_scores_updated_at
BEFORE UPDATE ON till_risk_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_scheduled_reports_updated_at
BEFORE UPDATE ON scheduled_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Disable RLS for super admin tables (managed by backend)
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detection DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_risk_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE till_risk_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_read_announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_history DISABLE ROW LEVEL SECURITY;
