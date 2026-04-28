/**
 * Supabase Client Configuration
 * Alias for supabaseAuth - provides database client instance
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
  );
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };
