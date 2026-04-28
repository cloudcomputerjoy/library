-- ============================================
-- SMART LIBRARY MANAGEMENT SYSTEM
-- DATABASE SCHEMA (PostgreSQL via Supabase)
-- ============================================

-- ============================================
-- 1. USERS TABLE (Students, Staff, Admins)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('student', 'librarian', 'admin', 'faculty') NOT NULL DEFAULT 'student',
  student_id VARCHAR(50) UNIQUE,
  qr_code_id VARCHAR(255) UNIQUE,
  rfid_card_id VARCHAR(255) UNIQUE,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. API KEYS TABLE (Secure API access)
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '["read", "write"]'::jsonb,
  rate_limit_per_minute INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, key_name)
);

-- ============================================
-- 3. QR TOKENS TABLE (Dynamic QR System)
-- ============================================
CREATE TABLE qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  qr_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 4. BOOKS TABLE
-- ============================================
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  isbn VARCHAR(20) UNIQUE,
  category VARCHAR(100),
  tags JSONB,
  shelf_number VARCHAR(50),
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  description TEXT,
  cover_image_url TEXT,
  pdf_url TEXT,
  is_digital BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  ai_category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. BOOK COPIES TABLE (Track individual copies)
-- ============================================
CREATE TABLE book_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  copy_number INT NOT NULL,
  barcode VARCHAR(255) UNIQUE,
  status ENUM('available', 'issued', 'damaged', 'lost', 'maintenance') DEFAULT 'available',
  condition VARCHAR(100),
  maintenance_logs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, copy_number)
);

-- ============================================
-- 6. TRANSACTIONS TABLE (Issue/Return)
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_copy_id UUID NOT NULL REFERENCES book_copies(id),
  transaction_type ENUM('issue', 'return', 'reserve', 'cancel_reserve') NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  return_date TIMESTAMP WITH TIME ZONE,
  is_overdue BOOLEAN DEFAULT false,
  fine_amount DECIMAL(10, 2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT false,
  fine_paid_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. RESERVATIONS TABLE (Queue system)
-- ============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  queue_position INT NOT NULL,
  status ENUM('pending', 'assigned', 'expired', 'cancelled', 'completed') DEFAULT 'pending',
  priority_level INT DEFAULT 0,
  is_vip BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. ATTENDANCE LOGS TABLE (Entry/Exit tracking)
-- ============================================
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,
  entry_method ENUM('qr', 'rfid', 'manual', 'mobile') DEFAULT 'qr',
  exit_method ENUM('qr', 'rfid', 'manual', 'mobile'),
  rfid_card_id VARCHAR(255),
  qr_token_used UUID REFERENCES qr_tokens(id),
  duration_minutes INT,
  status ENUM('inside', 'outside') DEFAULT 'inside',
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. FINES TABLE
-- ============================================
CREATE TABLE fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason VARCHAR(255),
  is_paid BOOLEAN DEFAULT false,
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(100),
  waiver_reason TEXT,
  is_waived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(100),
  gateway VARCHAR(100),
  transaction_id VARCHAR(255),
  status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. FILE SHARING TABLE (Student uploads)
-- ============================================
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size_bytes BIGINT,
  description TEXT,
  subject VARCHAR(100),
  tags JSONB,
  is_public BOOLEAN DEFAULT true,
  shared_with JSONB,
  page_count INT,
  download_count INT DEFAULT 0,
  ai_summarized TEXT,
  cloudflare_file_id VARCHAR(255),
  auto_delete_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. FILE DOWNLOADS/PRINTS TABLE
-- ============================================
CREATE TABLE file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_share_id UUID NOT NULL REFERENCES file_shares(id) ON DELETE CASCADE,
  downloader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type ENUM('download', 'print') NOT NULL,
  print_copies INT,
  page_range VARCHAR(50),
  requested_by UUID REFERENCES users(id),
  admin_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  printed_at TIMESTAMP WITH TIME ZONE,
  status ENUM('pending', 'approved', 'printed', 'failed') DEFAULT 'pending',
  cloudflare_receipt VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(100),
  trigger_event VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  channel ENUM('email', 'sms', 'in_app', 'push') DEFAULT 'in_app',
  related_entity_id UUID,
  related_entity_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. RFID CARD MAPPING TABLE
-- ============================================
CREATE TABLE rfid_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfid_code VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  card_type ENUM('student', 'staff', 'visitor') DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  last_scanned TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 15. RFID SCAN LOGS TABLE
-- ============================================
CREATE TABLE rfid_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfid_card_id UUID NOT NULL REFERENCES rfid_cards(id),
  user_id UUID REFERENCES users(id),
  reader_location VARCHAR(255),
  scan_type ENUM('entry', 'exit') NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signal_strength INT,
  is_valid BOOLEAN DEFAULT true,
  error_code VARCHAR(100)
);

-- ============================================
-- 16. PRINT JOBS TABLE
-- ============================================
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_share_id UUID REFERENCES file_shares(id),
  initiated_by UUID NOT NULL REFERENCES users(id),
  admin_id UUID REFERENCES users(id),
  total_pages INT NOT NULL,
  copies INT NOT NULL DEFAULT 1,
  page_range VARCHAR(50),
  priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
  status ENUM('queued', 'printing', 'ready', 'collected', 'failed') DEFAULT 'queued',
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  collected_by UUID DEFAULT NULL,
  collected_at TIMESTAMP WITH TIME ZONE,
  printer_id VARCHAR(100),
  cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 17. USERS ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 18. ADMIN ALERTS TABLE
-- ============================================
CREATE TABLE admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(100),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES users(id),
  related_entity_id UUID,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 19. LIBRARY SETTINGS TABLE
-- ============================================
CREATE TABLE library_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 20. RECOMMENDATIONS TABLE (AI System)
-- ============================================
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  score DECIMAL(5, 3),
  recommendation_type ENUM('history_based', 'user_similarity', 'trending', 'trending_category') DEFAULT 'history_based',
  is_clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  is_issued BOOLEAN DEFAULT false,
  issued_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_qr_code ON users(qr_code_id);
CREATE INDEX idx_users_rfid_card ON users(rfid_card_id);

-- QR Tokens
CREATE INDEX idx_qr_tokens_user_id ON qr_tokens(user_id);
CREATE INDEX idx_qr_tokens_expires_at ON qr_tokens(expires_at);
CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);

-- Books
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_available ON books(is_available);

-- Transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_book_copy_id ON transactions(book_copy_id);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_is_overdue ON transactions(is_overdue);

-- Attendance Logs
CREATE INDEX idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX idx_attendance_logs_entry_time ON attendance_logs(entry_time);
CREATE INDEX idx_attendance_logs_status ON attendance_logs(status);

-- File Shares
CREATE INDEX idx_file_shares_uploader_id ON file_shares(uploader_id);
CREATE INDEX idx_file_shares_auto_delete ON file_shares(auto_delete_at);
CREATE INDEX idx_file_shares_is_deleted ON file_shares(is_deleted);

-- RFID Scans
CREATE INDEX idx_rfid_scan_logs_timestamp ON rfid_scan_logs(timestamp);
CREATE INDEX idx_rfid_scan_logs_rfid_id ON rfid_scan_logs(rfid_card_id);

-- Activity Logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Fines
CREATE INDEX idx_fines_user_id ON fines(user_id);
CREATE INDEX idx_fines_is_paid ON fines(is_paid);

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TRIGGERS FOR TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_api_keys_updated_at
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - For Security
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY users_own_profile ON users
  FOR SELECT
  USING (auth.uid() = id OR 
         (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'librarian'));

-- Policy: Only admins can see all attendance logs
CREATE POLICY attendance_admin_all ON attendance_logs
  FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'librarian'));

-- Policy: Users can see their own attendance
CREATE POLICY attendance_own ON attendance_logs
  FOR SELECT
  USING (user_id = auth.uid());
