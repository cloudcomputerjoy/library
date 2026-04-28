// Supabase Client Configuration
// Backend service layer for Supabase connection

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all records from a table with pagination
 */
const getAll = async (table, pageSize = 20, page = 1) => {
  const offset = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .range(offset, offset + pageSize - 1);
  
  if (error) throw error;
  return { data, count };
};

/**
 * Get single record by ID
 */
const getById = async (table, id) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Create new record
 */
const create = async (table, data) => {
  try {
    console.log(`[Supabase] Creating record in ${table} with data:`, JSON.stringify(data));
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select();
    
    if (error) {
      console.error(`[Supabase] Insert error for ${table}:`, error);
      throw error;
    }
    
    console.log(`[Supabase] Insert result for ${table}:`, result);
    
    if (!result || result.length === 0) {
      console.error(`[Supabase] No result returned for ${table} insert. Result:`, result);
      return null;
    }
    
    return result[0];
  } catch (err) {
    console.error(`[Supabase] Create error for ${table}:`, err.message);
    throw err;
  }
};

/**
 * Update record
 */
const update = async (table, id, data) => {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return result ? result[0] : null;
};

/**
 * Delete record (soft delete by setting status)
 */
const deleteRecord = async (table, id) => {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return data;
};

/**
 * Log admin actions
 */
const logAdminAction = async (adminId, action, table, recordId, changes) => {
  try {
    await supabase
      .from('admin_logs')
      .insert([{
        admin_id: adminId,
        action: action,
        table_name: table,
        record_id: recordId,
        changes: changes || {}
      }]);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id', { count: 'exact' });
    
    const { data: books } = await supabase
      .from('books')
      .select('id', { count: 'exact' });
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' });
    
    const { data: fines } = await supabase
      .from('fines')
      .select('amount')
      .eq('status', 'pending');

    const totalFines = fines?.reduce((sum, fine) => sum + (fine.amount || 0), 0) || 0;

    return {
      total_users: users?.length || 0,
      total_books: books?.length || 0,
      books_issued: transactions?.length || 0,
      pending_fines: totalFines,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {};
  }
};

module.exports = {
  supabase,
  getAll,
  getById,
  create,
  update,
  deleteRecord,
  logAdminAction,
  getDashboardStats,
};
