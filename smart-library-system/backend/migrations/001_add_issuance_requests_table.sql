-- Migration: Add issuance_requests table for two-step book issuance
-- Created: April 18, 2026
-- Purpose: Store pending book issuance requests from students

CREATE TABLE IF NOT EXISTS issuance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT,
  
  -- Book information
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  book_isbn TEXT,
  qr_code TEXT NOT NULL,
  
  -- Request status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  
  -- Admin who completed the request
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Issue details (populated after completion)
  issue_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_issuance_requests_student_id ON issuance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_issuance_requests_book_id ON issuance_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_issuance_requests_status ON issuance_requests(status);
CREATE INDEX IF NOT EXISTS idx_issuance_requests_created_at ON issuance_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issuance_requests_expires_at ON issuance_requests(expires_at);

-- Enable Row Level Security
ALTER TABLE issuance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can read their own issuance requests" ON issuance_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Librarians and admins can read all issuance requests" ON issuance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('librarian', 'admin')
    )
  );

CREATE POLICY "Students can create issuance requests" ON issuance_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Librarians and admins can update issuance requests" ON issuance_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('librarian', 'admin')
    )
  );
