/**
 * Database Migration - Credential Management Tables
 * Creates tables for email credentials, API keys, and health check logs
 */

const migrationSQL = `
-- Email Credentials Table
CREATE TABLE IF NOT EXISTS email_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  smtp_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER DEFAULT 587,
  from_name VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  
  CONSTRAINT email_valid CHECK (email ~ '^[^@]+@[^@]+$')
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID REFERENCES email_credentials(id) ON DELETE CASCADE,
  recipient VARCHAR(255),
  subject VARCHAR(500),
  status VARCHAR(50), -- sent, failed, bounced
  message_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT status_valid CHECK (status IN ('sent', 'failed', 'bounced'))
);

-- Email Health Checks Table
CREATE TABLE IF NOT EXISTS email_health_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID REFERENCES email_credentials(id) ON DELETE CASCADE,
  status VARCHAR(50), -- healthy, unhealthy
  error TEXT,
  checked_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT health_status_valid CHECK (status IN ('healthy', 'unhealthy'))
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service VARCHAR(50) NOT NULL, -- openrouter, anthropic, etc
  api_key TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  monthly_limit INTEGER,
  used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  
  CONSTRAINT unique_key_per_service UNIQUE (service, api_key)
);

-- API Request Logs Table
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  status VARCHAR(50), -- success, failed
  error_message TEXT,
  http_status_code INTEGER,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  logged_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT status_valid CHECK (status IN ('success', 'failed'))
);

-- API Key Health Checks Table
CREATE TABLE IF NOT EXISTS api_key_health_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  status VARCHAR(50), -- healthy, unhealthy
  remaining_requests INTEGER,
  error TEXT,
  checked_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT health_status_valid CHECK (status IN ('healthy', 'unhealthy'))
);

-- Settings Table (for storing configuration)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_email_credentials_enabled ON email_credentials(enabled);
CREATE INDEX IF NOT EXISTS idx_email_credentials_priority ON email_credentials(priority);
CREATE INDEX IF NOT EXISTS idx_email_logs_credential_id ON email_logs(credential_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_health_checks_credential_id ON email_health_checks(credential_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service);
CREATE INDEX IF NOT EXISTS idx_api_keys_enabled ON api_keys(enabled);
CREATE INDEX IF NOT EXISTS idx_api_keys_priority ON api_keys(priority);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_logged_at ON api_request_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_api_key_health_checks_api_key_id ON api_key_health_checks(api_key_id);

-- Enable Row Level Security
ALTER TABLE email_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_health_checks ENABLE ROW LEVEL SECURITY;

-- Create Policies for RLS (Admin only)
CREATE POLICY admin_email_credentials ON email_credentials
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_api_keys ON api_keys
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_email_logs ON email_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_email_health_checks ON email_health_checks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_api_request_logs ON api_request_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_api_key_health_checks ON api_key_health_checks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
`;

export default migrationSQL;
