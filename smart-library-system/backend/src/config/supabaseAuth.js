/**
 * Supabase Authentication Client
 * Configured for admin authentication
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
// Service role key has elevated privileges for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Export additional helper functions

/**
 * Create admin user in Supabase Auth
 */
async function createAdminUser(email, password, fullName) {
  try {
    // Create auth user
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) throw authError;

    // Add to admin_users table
    const { data, error: dbError } = await supabase
      .from('admin_users')
      .insert({
        id: user.id,
        email,
        full_name: fullName
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if db insert fails
      await supabase.auth.admin.deleteUser(user.id);
      throw dbError;
    }

    return { user, adminUser: data };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Remove admin user
 */
async function removeAdminUser(userId) {
  try {
    // Delete from admin_users table
    const { error: dbError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', userId);

    if (dbError) throw dbError;

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return { success: true };
  } catch (error) {
    console.error('Error removing admin user:', error);
    throw error;
  }
}

/**
 * Reset admin user password
 */
async function resetAdminPassword(userId, newPassword) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) throw error;
    return { user: data.user, success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Get all admin users
 */
async function getAllAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting admin users:', error);
    throw error;
  }
}

/**
 * Verify user is admin
 */
async function isUserAdmin(userId) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
}

module.exports = {
  supabase,
  createAdminUser,
  removeAdminUser,
  resetAdminPassword,
  getAllAdminUsers,
  isUserAdmin
};
