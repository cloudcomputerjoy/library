-- Smart Library System - Supabase Database Schema
-- Version: 1.0.0
-- Created: April 11, 2026

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  profile_image_url TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'staff', 'librarian', 'admin')),
  
  -- Student specific
  student_id TEXT UNIQUE,
  department TEXT,
  semester TEXT,
  batch_year TEXT,
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended')),
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. CATEGORIES TABLE (Book categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. AUTHORS TABLE (Book authors)
-- ============================================================
CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  bio TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. BOOKS TABLE (Book inventory and details)
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  isbn TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_image_url TEXT,
  publisher TEXT,
  publication_year INTEGER,
  published_date TEXT,
  language TEXT DEFAULT 'English',
  
  -- Organization
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category TEXT,
  call_number TEXT, -- Dewey Decimal or Library of Congress number
  
  -- Inventory
  total_copies INTEGER DEFAULT 1 NOT NULL CHECK (total_copies > 0),
  available_copies INTEGER DEFAULT 1 NOT NULL CHECK (available_copies >= 0),
  issued_copies INTEGER DEFAULT 0,
  reserved_copies INTEGER DEFAULT 0,
  
  -- Metadata
  pages INTEGER,
  edition TEXT,
  isbn_10 TEXT,
  tags TEXT[],
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  is_reserved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_category_id ON books(category_id);
CREATE INDEX idx_books_is_available ON books(is_available);

-- ============================================================
-- 4.5 BOOK_COPIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS book_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  qr_code TEXT UNIQUE,
  barcode TEXT UNIQUE,
  isbn TEXT,
  copy_number INTEGER,
  status TEXT DEFAULT 'available',
  condition TEXT DEFAULT 'good',
  location TEXT,
  issued_to UUID REFERENCES users(id) ON DELETE SET NULL,
  issued_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX idx_book_copies_qr_code ON book_copies(qr_code);

-- ============================================================
-- 5. BOOK_AUTHORS TABLE (Many-to-many relationship)
-- ============================================================
CREATE TABLE IF NOT EXISTS book_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  author_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, author_id)
);

CREATE INDEX idx_book_authors_book_id ON book_authors(book_id);
CREATE INDEX idx_book_authors_author_id ON book_authors(author_id);

-- ============================================================
-- 6. TRANSACTIONS TABLE (Issue/Return history)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Users and Books
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  
  -- Transaction type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issue', 'return', 'reserve', 'renew')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  -- Dates
  issued_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  returned_date TIMESTAMP WITH TIME ZONE,
  
  -- Fine tracking
  fine_amount DECIMAL(10, 2) DEFAULT 0,
  is_fine_paid BOOLEAN DEFAULT false,
  
  -- Book condition feedback
  returned_condition TEXT CHECK (returned_condition IN ('excellent', 'good', 'fair', 'damaged', 'lost')),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_book_id ON transactions(book_id);
CREATE INDEX idx_transactions_issued_date ON transactions(issued_date);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================================
-- 7. FINES TABLE (Fine management)
-- ============================================================
CREATE TABLE IF NOT EXISTS fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'cancelled')),
  paid_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fines_user_id ON fines(user_id);
CREATE INDEX idx_fines_status ON fines(status);

-- ============================================================
-- 8. NOTIFICATIONS TABLE (User notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- 9. ATTENDANCE TABLE (Campus attendance)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  method TEXT CHECK (method IN ('biometric', 'qr', 'rfid', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_check_in_time ON attendance(check_in_time);

-- ============================================================
-- 10. FILE_SHARES TABLE (Temporary file sharing)
-- ============================================================
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_shares_uploaded_by ON file_shares(uploaded_by);
CREATE INDEX idx_file_shares_expires_at ON file_shares(expires_at);

-- ============================================================
-- 11. PRINT_JOBS TABLE (Print request tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  pages INTEGER,
  copies INTEGER DEFAULT 1,
  color BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'ready', 'completed', 'cancelled')),
  cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);

-- ============================================================
-- 12. SETTINGS TABLE (App settings and preferences)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

-- Users table RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Books table RLS (public read)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are publicly readable" ON books
  FOR SELECT USING (true);

-- Transactions table RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Librarians can read all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('librarian', 'admin')
    )
  );

-- Fines table RLS
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own fines" ON fines
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications table RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Attendance table RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Insert categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Fiction', 'Novel and fiction books', '📖', '#FF6B6B'),
  ('Non-Fiction', 'Educational and reference books', '📚', '#4ECDC4'),
  ('Science', 'Science and nature books', '🔬', '#45B7D1'),
  ('Technology', 'Computer and tech books', '💻', '#96CEB4'),
  ('History', 'History and biography', '📜', '#FFEAA7')
ON CONFLICT DO NOTHING;

-- Insert authors
INSERT INTO authors (name, bio, country) VALUES
  ('George Orwell', 'English novelist and essayist', 'United Kingdom'),
  ('Jane Austen', 'English novelist', 'United Kingdom'),
  ('Mark Twain', 'American writer and humorist', 'United States'),
  ('Haruki Murakami', 'Japanese novelist', 'Japan'),
  ('Stephen Hawking', 'Theoretical physicist', 'United Kingdom')
ON CONFLICT DO NOTHING;

-- Insert sample books
INSERT INTO books (isbn, title, description, publisher, publication_year, category_id, cover_image_url, total_copies, available_copies) 
SELECT 
  '978-0451524935' as isbn,
  '1984' as title,
  'A dystopian novel about totalitarianism' as description,
  'Penguin' as publisher,
  1949 as publication_year,
  (SELECT id FROM categories WHERE name = 'Fiction') as category_id,
  'https://covers.example.com/1984.jpg' as cover_image_url,
  3 as total_copies,
  2 as available_copies
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO books (isbn, title, description, publisher, publication_year, category_id, cover_image_url, total_copies, available_copies) 
SELECT 
  '978-0374529239' as isbn,
  'A Brief History of Time' as title,
  'Exploring the universe and black holes' as description,
  'Bantam' as publisher,
  1988 as publication_year,
  (SELECT id FROM categories WHERE name = 'Science') as category_id,
  'https://covers.example.com/brief-history.jpg' as cover_image_url,
  2 as total_copies,
  1 as available_copies
ON CONFLICT (isbn) DO NOTHING;

-- ============================================================
-- FUNCTIONS FOR COMMON TASKS
-- ============================================================

-- Function to calculate overdue fines
CREATE OR REPLACE FUNCTION calculate_overdue_fine(
  p_transaction_id UUID,
  p_daily_fine DECIMAL DEFAULT 10
)
RETURNS DECIMAL AS $$
DECLARE
  v_due_date TIMESTAMP;
  v_returned_date TIMESTAMP;
  v_days_overdue INTEGER;
  v_fine DECIMAL;
BEGIN
  SELECT due_date, returned_date INTO v_due_date, v_returned_date
  FROM transactions
  WHERE id = p_transaction_id;
  
  -- If not returned yet, use current date
  v_returned_date := COALESCE(v_returned_date, NOW());
  
  -- Calculate days overdue
  v_days_overdue := GREATEST(0, EXTRACT(DAY FROM (v_returned_date - v_due_date))::INTEGER);
  
  -- Calculate fine
  v_fine := v_days_overdue * p_daily_fine;
  
  RETURN v_fine;
END;
$$ LANGUAGE plpgsql;

-- Function to update book availability after transaction
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'issue' AND NEW.status = 'completed' THEN
    UPDATE books 
    SET available_copies = available_copies - 1,
        issued_copies = issued_copies + 1
    WHERE id = NEW.book_id;
  END IF;
  
  IF NEW.transaction_type = 'return' AND NEW.status = 'completed' THEN
    UPDATE books 
    SET available_copies = available_copies + 1,
        issued_copies = GREATEST(0, issued_copies - 1)
    WHERE id = NEW.book_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_trigger
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_book_availability();

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- User's active issues (books currently issued)
CREATE OR REPLACE VIEW user_active_issues AS
SELECT 
  t.id,
  t.user_id,
  b.id as book_id,
  b.title,
  b.isbn,
  t.issued_date,
  t.due_date,
  CASE WHEN t.due_date < NOW() THEN 'OVERDUE' ELSE 'ACTIVE' END as status,
  calculate_overdue_fine(t.id) as estimated_fine
FROM transactions t
JOIN books b ON t.book_id = b.id
WHERE t.transaction_type = 'issue' 
  AND t.status = 'completed' 
  AND t.returned_date IS NULL;

-- User's fines summary
CREATE OR REPLACE VIEW user_fines_summary AS
SELECT 
  user_id,
  COUNT(*) as total_fines,
  SUM(amount) as total_amount,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
FROM fines
GROUP BY user_id;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_returned ON transactions(user_id, returned_date);
CREATE INDEX IF NOT EXISTS idx_books_available_category ON books(is_available, category_id);
CREATE INDEX IF NOT EXISTS idx_fines_user_status ON fines(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, created_at DESC);

-- ============================================================
-- ADDITIONAL TABLES FOR FILE SHARING, NOTIFICATIONS, RFID
-- ============================================================

-- Shared files table
CREATE TABLE IF NOT EXISTS shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  file_path TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File shares table
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES shared_files(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File downloads table
CREATE TABLE IF NOT EXISTS file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES shared_files(id) ON DELETE CASCADE,
  downloaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('due_reminder', 'overdue', 'announcement', 'fine_alert', 'system')),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  due_reminders BOOLEAN DEFAULT true,
  overdue_alerts BOOLEAN DEFAULT true,
  announcements BOOLEAN DEFAULT true,
  fine_alerts BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('book', 'user')),
  entity_id UUID NOT NULL,
  qr_data TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RFID cards table
CREATE TABLE IF NOT EXISTS rfid_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rfid_tag VARCHAR(100) NOT NULL UNIQUE,
  card_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RFID logs table
CREATE TABLE IF NOT EXISTS rfid_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfid_card_id UUID NOT NULL REFERENCES rfid_cards(id) ON DELETE CASCADE,
  book_copy_id UUID REFERENCES book_copies(id),
  action TEXT NOT NULL CHECK (action IN ('issue', 'return', 'scan')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for file sharing, notifications, RFID
CREATE INDEX IF NOT EXISTS idx_shared_files_user_id ON shared_files(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_files_expires_at ON shared_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_user_id ON file_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_codes_entity ON qr_codes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_rfid_tag ON rfid_cards(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_user_id ON rfid_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_rfid_logs_timestamp ON rfid_logs(timestamp DESC);
