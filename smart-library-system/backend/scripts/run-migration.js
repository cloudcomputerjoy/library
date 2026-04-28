#!/usr/bin/env node

/**
 * Migration Runner for Categories and Shelves
 * Usage: node backend/scripts/run-migration.js
 */

require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

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

async function runMigration() {
  try {
    console.log('🔄 Starting migration...\n');
    console.log('📋 Migration Steps:');
    console.log('  1. Creating categories table');
    console.log('  2. Creating shelves table');
    console.log('  3. Adding columns to books table');
    console.log('  4. Creating indexes');
    console.log('  5. Inserting default data\n');

    // Execute migration using the SQL API
    const { error } = await supabase.rpc('sql', { query: migrationSQL });

    if (error) {
      // If RPC doesn't work, try using the execute method on the connection
      console.log('⚠️  Standard RPC approach didn\'t work, trying direct SQL execution...\n');
      
      // For Supabase, we would need to use the REST API or direct connection
      // Since we can't execute raw SQL directly through the JS client,
      // provide instructions for manual execution
      console.log('📝 Please execute the following SQL in your Supabase SQL Editor:\n');
      console.log('---BEGIN SQL---\n');
      console.log(migrationSQL);
      console.log('\n---END SQL---\n');
      console.log('Or use the Supabase Dashboard:\n');
      console.log('1. Go to SQL Editor');
      console.log('2. Click "New Query"');
      console.log('3. Paste the SQL above');
      console.log('4. Click "Run"\n');
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify tables were created
    console.log('🔍 Verifying migration...\n');

    // Check categories table
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (!catError) {
      console.log(`✅ Categories table: ${categories.length} categories found`);
    } else {
      console.log('⚠️  Could not verify categories table');
    }

    // Check shelves table
    const { data: shelves, error: shelfError } = await supabase
      .from('shelves')
      .select('*');

    if (!shelfError) {
      console.log(`✅ Shelves table: ${shelves.length} shelves found`);
    } else {
      console.log('⚠️  Could not verify shelves table');
    }

    console.log('\n✨ Migration complete! You can now:\n');
    console.log('  1. Use the Admin Dashboard to manage books');
    console.log('  2. Assign books to categories');
    console.log('  3. Assign books to shelves');
    console.log('  4. View shelf capacity overview\n');

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('\n💡 If you see this error, execute the SQL manually:');
    console.error('1. Go to Supabase Dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Create a new query and paste the content from:');
    console.error('   /backend/src/migrations/create_categories_shelves.sql.js\n');
    process.exit(1);
  }
}

// Run migration
runMigration();
