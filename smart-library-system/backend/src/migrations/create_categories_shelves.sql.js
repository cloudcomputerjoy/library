/**
 * Database Migration - Categories and Shelves Tables
 * Creates tables for book categories and library shelves/racks
 */

const migrationSQL = `
-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Shelves/Racks Table
CREATE TABLE IF NOT EXISTS shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rack_number VARCHAR(100) NOT NULL UNIQUE,
  floor_number INTEGER,
  section VARCHAR(100),
  capacity INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add shelves array column to books table (if not exists)
ALTER TABLE books ADD COLUMN IF NOT EXISTS shelves UUID[] DEFAULT '{}';

-- 4. Add category_id column to books table (if not exists)
ALTER TABLE books ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_shelves_rack_number ON shelves(rack_number);
CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);

-- 6. Insert default categories
INSERT INTO categories (name, description, color) VALUES 
  ('Fiction', 'Novels, stories and other fictional works', '#FF6B6B'),
  ('Non-Fiction', 'Educational and informational books', '#4ECDC4'),
  ('Science', 'Science and technology books', '#45B7D1'),
  ('History', 'Historical books and records', '#96CEB4'),
  ('Technology', 'Programming and tech books', '#FFEAA7'),
  ('Business', 'Business and management books', '#DFE6E9'),
  ('Art & Design', 'Art, design and creativity books', '#A29BFE'),
  ('Self-Help', 'Self-improvement and wellness books', '#FD79A8'),
  ('Reference', 'Reference materials and encyclopedias', '#FDCB6E'),
  ('Children', 'Books for children and young readers', '#74B9FF')
ON CONFLICT (name) DO NOTHING;

-- 7. Insert default shelves
INSERT INTO shelves (name, rack_number, floor_number, section, capacity, description) VALUES 
  ('Main Fiction Shelf', 'A1', 1, 'Fiction', 50, 'Primary fiction collection'),
  ('Reference Shelf', 'A2', 1, 'Reference', 30, 'Reference materials and encyclopedias'),
  ('Science Section', 'B1', 2, 'Science', 40, 'Science and technology books'),
  ('History Section', 'B2', 2, 'History', 35, 'Historical books and records'),
  ('Tech & Programming', 'C1', 3, 'Technology', 45, 'Programming and tech books'),
  ('Business & Management', 'C2', 3, 'Business', 40, 'Business and management books'),
  ('Art & Design', 'D1', 4, 'Arts', 30, 'Art, design and creativity materials'),
  ('Children & Young', 'E1', 1, 'Children', 60, 'Books for children and young readers'),
  ('Self-Help & Wellness', 'E2', 2, 'Self-Help', 25, 'Self-improvement and wellness books'),
  ('Featured Display', 'F1', 1, 'Featured', 20, 'Featured and recommended books')
ON CONFLICT (rack_number) DO NOTHING;
`;

module.exports = { migrationSQL };
