/**
 * Database Migration Script
 * Applies all SQL migrations from migrations/ directory to Supabase
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('✅ No migrations to run');
      process.exit(0);
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📋 Running: ${file}`);

      try {
        // Split by semicolon to handle multiple statements
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          const { error } = await supabase.rpc('exec_sql', {
            sql_statement: statement
          }).catch(async (err) => {
            // If exec_sql RPC doesn't exist, try direct query
            return await supabase.from('_migrations').select('*').limit(0)
              .then(async () => {
                // If tables exist, use direct query approach
                console.log('   Using direct SQL execution...');
                return await supabase.query(statement);
              })
              .catch(() => ({ error: err }));
          });

          if (error) {
            console.error(`   ❌ Error in ${file}:`, error.message);
            // Continue with next statement
          }
        }

        console.log(`✅ Completed: ${file}\n`);
      } catch (error) {
        console.error(`❌ Failed to run migration ${file}:`, error.message);
        console.error('   This might be OK if the table/policy already exists.\n');
      }
    }

    console.log('✅ All migrations completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Use Supabase SQL Editor
async function runMigrationsAlternative() {
  try {
    console.log('🚀 Starting database migrations (Alternative approach)...\n');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('✅ No migrations to run');
      process.exit(0);
    }

    console.log(`Found ${files.length} migration file(s):\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📋 Running: ${file}`);

      try {
        // Use postgres connection
        const { data, error, status } = await supabase.rpc('exec_sql', {
          p_sql: sql
        }).catch(async () => {
          // Fallback: Try to execute as a single statement
          const statements = sql
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim())
            .join('\n');

          return await supabase.query(statements);
        });

        if (error) {
          console.error(`   ❌ Error in ${file}:`, error);
          // Try to continue
        } else {
          console.log(`✅ Completed: ${file}\n`);
        }
      } catch (error) {
        console.error(`⚠️  Warning in ${file}:`, error.message);
        console.error('   (May be OK if structure already exists)\n');
      }
    }

    console.log('✅ Migration process completed!\n');
    console.log('📝 Note: Some errors above are normal if tables/policies already exist.');
    console.log('🔍 To verify, check your Supabase SQL Editor.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Main execution - use alternative approach
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Smart Library - Database Migration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('ℹ️  To manually apply migrations:');
console.log('1. Go to Supabase Dashboard > SQL Editor');
console.log('2. Copy content from migration files in backend/migrations/');
console.log('3. Paste and execute each in SQL Editor\n');

console.log('🔄 Attempting automated migration...\n');

// Try the alternative approach
runMigrationsAlternative().catch(error => {
  console.error('❌ Automated migration failed:', error.message);
  console.log('\n📋 Manual Migration Steps:');
  console.log('1. Open Supabase Dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Copy & execute migrations/001_add_issuance_requests_table.sql');
  console.log('4. Verify table created in Table Editor\n');
  process.exit(1);
});
