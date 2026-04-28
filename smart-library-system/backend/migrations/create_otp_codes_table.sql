-- Create OTP Codes Table for Password Reset and Authentication
-- This table stores one-time passwords with expiration and usage tracking

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'password_reset', -- password_reset, two_factor, email_verification
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Index for quick lookups
  CONSTRAINT valid_otp_code CHECK (length(code) >= 4),
  CONSTRAINT valid_purpose CHECK (purpose IN ('password_reset', 'two_factor', 'email_verification'))
);

-- Create indexes for efficient queries
CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_codes_user_code ON otp_codes(user_id, code);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at) WHERE used_at IS NULL;
CREATE INDEX idx_otp_codes_purpose ON otp_codes(purpose);

-- Enable Row Level Security
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own OTPs
CREATE POLICY "Users can access their own OTP codes"
  ON otp_codes
  FOR ALL
  USING (user_id = auth.uid());

-- Admin can access all OTP codes
CREATE POLICY "Admin can access all OTP codes"
  ON otp_codes
  FOR ALL
  USING (auth.role() = 'admin');

-- Function to cleanup expired and used OTP codes (can be run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM otp_codes
  WHERE (used_at IS NOT NULL AND created_at < NOW() - INTERVAL '1 day')
    OR (expires_at < NOW() AND used_at IS NULL);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON otp_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON otp_codes TO service_role;
