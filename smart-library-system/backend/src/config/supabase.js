// Supabase Client Configuration
// Backend service layer for Supabase connection

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Execute a query with error handling
 */
export const executeQuery = async (query, params = []) => {
  try {
    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Database Query Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get single record by ID
 */
export const getById = async (table, id) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all records with filtering
 */
export const getAll = async (table, filters = {}, limit = 50, offset = 0) => {
  let query = supabase.from(table).select('*', { count: 'exact' });

  // Apply filters
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null) {
      query = query.eq(key, filters[key]);
    }
  });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data, count, limit, offset };
};

/**
 * Create record
 */
export const create = async (table, data) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
};

/**
 * Update record
 */
export const update = async (table, id, data) => {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
};

/**
 * Delete record
 */
export const deleteRecord = async (table, id) => {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

/**
 * Upsert record
 */
export const upsert = async (table, data, matchColumn = 'id') => {
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data, { onConflict: matchColumn })
    .select();

  if (error) throw error;
  return result;
};

/**
 * Execute raw SQL query
 */
export const rawQuery = async (sql) => {
  const { data, error } = await supabase.rpc('execute_sql', { sql });
  if (error) throw error;
  return data;
};

// ============================================
// CUSTOM QUERY FUNCTIONS
// ============================================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  const { data: stats } = await supabase.from('daily_statistics').select('*').single();
  
  const { data: booksIssued } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'active')
    .in('status', ['active', 'overdue']);

  const { data: pendingFines } = await supabase
    .from('fines')
    .select('amount')
    .eq('status', 'pending');

  return {
    totalStudents: (await supabase.from('users').select('id').eq('user_type', 'student')).data?.length || 0,
    activeUsersToday: stats?.students_present || 0,
    booksIssued: booksIssued?.length || 0,
    overdueBooks: booksIssued?.filter(t => new Date(t.due_date) < new Date()).length || 0,
    pendingFines: pendingFines?.length || 0,
    totalRevenue: pendingFines?.reduce((sum, f) => sum + f.amount, 0) || 0,
  };
};

/**
 * Get active issues with overdue information
 */
export const getActiveIssues = async () => {
  const { data, error } = await supabase
    .from('active_issues')
    .select('*')
    .order('days_overdue', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Search books
 */
export const searchBooks = async (searchTerm, limit = 50) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,isbn.ilike.%${searchTerm}%`)
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Get user with transaction history
 */
export const getUserWithHistory = async (userId) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (txError) throw txError;

  return { ...user, transactions };
};

/**
 * Calculate fine for overdue book
 */
export const calculateOverdueFine = async (transactionId) => {
  const transaction = await getById('transactions', transactionId);
  
  if (transaction.status === 'returned') {
    return 0; // No fine if already returned
  }

  const dueDate = new Date(transaction.due_date);
  const today = new Date();
  const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
  
  const { data: settings } = await supabase
    .from('settings')
    .select('setting_value')
    .eq('setting_key', 'late_return_fine_per_day')
    .single();

  const finePerDay = parseFloat(settings?.setting_value) || 5;
  return daysOverdue * finePerDay;
};

/**
 * Bulk insert users
 */
export const bulkInsertUsers = async (users) => {
  const { data, error } = await supabase
    .from('users')
    .insert(users)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Get library statistics for date range
 */
export const getStatistics = async (startDate, endDate) => {
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('issue_date', startDate)
    .lte('issue_date', endDate);

  const { data: fines } = await supabase
    .from('fines')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'paid');

  return {
    attendance: attendance?.length || 0,
    transactions: transactions?.length || 0,
    fineRevenue: fines?.reduce((sum, f) => sum + f.amount, 0) || 0,
  };
};

// ============================================
// LOG FUNCTIONS
// ============================================

/**
 * Log admin action
 */
export const logAdminAction = async (adminId, action, entityType, entityId, changes = {}) => {
  const { error } = await supabase
    .from('admin_logs')
    .insert([{
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes,
      status: 'success',
    }]);

  if (error) {
    console.error('Failed to log admin action:', error);
  }
};

/**
 * Log QR code scan
 */
export const logQRCodeScan = async (qrCode, scanType, userId, bookCopyId) => {
  const { error } = await supabase
    .from('qr_code_scans')
    .insert([{
      qr_code_value: qrCode,
      scan_type: scanType,
      user_id: userId,
      book_copy_id: bookCopyId,
    }]);

  if (error) {
    console.error('Failed to log QR scan:', error);
  }
};

// ============================================
// EXPORT SUPABASE CLIENT
// ============================================

export default supabase;
