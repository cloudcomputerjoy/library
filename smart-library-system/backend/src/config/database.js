/**
 * Supabase Database Configuration
 * Initializes Supabase client with JWT authentication
 */

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration: SUPABASE_URL and SUPABASE_ANON_KEY required');
}

// Initialize Supabase client with anon key (public)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Initialize Supabase client with service role key (admin - bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Create a Supabase client with user-specific JWT
 * Used to authenticate requests with Row Level Security
 */
const createSupabaseUserClient = (userId, userRole = 'user') => {
  const token = jwt.sign(
    {
      aud: 'authenticated',
      sub: userId,
      email: `${userId}@library.local`,
      role: userRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    },
    jwtSecret,
    { algorithm: 'HS256' }
  );

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  });
};

/**
 * Query helper for detailed error logging
 */
const logQuery = (table, operation, error = null) => {
  if (error) {
    console.error(`[DB] ${operation} on ${table}:`, error.message);
  } else {
    console.log(`[DB] ${operation} on ${table} - Success`);
  }
};

/**
 * Health check for database connection
 */
const checkDatabaseHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Database health check failed:', error);
      return false;
    }
    
    console.log('✓ Database connection healthy');
    return true;
  } catch (error) {
    console.error('Database health check error:', error);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  createSupabaseUserClient,
  logQuery,
  checkDatabaseHealth,
};
