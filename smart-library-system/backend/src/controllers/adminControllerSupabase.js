// Admin Controller - Supabase Integration
// All operations now use Supabase PostgreSQL

const {
  supabase,
  getAll,
  getById,
  create,
  update,
  deleteRecord,
  logAdminAction,
  getDashboardStats: getSupabaseDashboardStats,
} = require('../config/supabase-new');

const {
  emitUserCreated,
  emitUserUpdated,
  emitUserStatusChanged,
  emitUserDeleted,
} = require('../config/socketEvents');

const USER_OPTION_TYPES = ['department', 'batch', 'session'];

const normalizeUser = (user) => {
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const isActive = user?.is_active !== false;

  return {
    ...user,
    name: fullName || user?.email || 'Unknown User',
    user_type: user?.role || 'student',
    status: isActive ? 'active' : 'inactive',
    is_active: isActive,
    photo_url: user?.photo_url || user?.profile_image_url || null,
  };
};

const upsertUserOptionIfPresent = async (optionType, optionValue) => {
  const cleaned = typeof optionValue === 'string' ? optionValue.trim() : '';
  if (!cleaned) return;

  await supabase
    .from('user_profile_options')
    .upsert(
      [{ option_type: optionType, option_value: cleaned, is_active: true }],
      { onConflict: 'option_type,option_value' }
    );
};

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

/**
 * GET /api/admin/dashboard/stats
 * Dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getSupabaseDashboardStats();

    // Get current occupancy
    const { data: usersInside } = await supabase
      .from('attendance')
      .select('*')
      .eq('status', 'inside')
      .eq('date', new Date().toISOString().split('T')[0]);

    return res.json({
      success: true,
      data: {
        ...stats,
        currentStudentsInside: usersInside?.length || 0,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * GET /api/admin/dashboard/live-feed
 * Real-time entry/exit feed
 */
const getLiveFeed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const { data: feed } = await supabase
      .from('attendance')
      .select(`
        *,
        users(name, email, student_id)
      `)
      .order('entry_time', { ascending: false })
      .limit(parseInt(limit));

    const formattedFeed = feed?.map(record => ({
      id: record.id,
      userName: record.users?.name || 'Unknown',
      event: record.exit_time ? 'exit' : 'entry',
      time: record.exit_time || record.entry_time,
      duration: record.duration_minutes,
      status: record.status,
    })) || [];

    return res.json({
      success: true,
      data: formattedFeed,
    });
  } catch (error) {
    console.error('Live feed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch live feed',
    });
  }
};

/**
 * GET /api/admin/dashboard/analytics
 * Analytics data for charts
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const stats = await getStatistics(startDate, endDate);

    // Get daily breakdown
    const { data: dailyData } = await supabase
      .from('transactions')
      .select(`date: issue_date, count(*), status`)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate)
      .order('issue_date', { ascending: true });

    return res.json({
      success: true,
      data: {
        ...stats,
        daily: dailyData || [],
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
    });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, user_type } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
    }

    if (user_type) {
      query = query.eq('role', user_type);
    }

    // Note: With hard delete, only active users exist in database
    // No need to filter by is_active - deleted records are completely removed

    const { data, count, error } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const normalizedUsers = (data || []).map(normalizeUser);

    return res.json({
      success: true,
      data: normalizedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Get single user
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await getById('users', id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: normalizeUser(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};

/**
 * POST /api/admin/users
 * Create new user
 */
const createUser = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      student_id,
      department,
      session,
      batch_number,
      emergency_contact,
      photo_url,
      is_active,
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and email are required',
      });
    }

    // Generate QR code
    const qr_code = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user = await create('users', {
      first_name,
      last_name,
      email,
      phone: phone || null,
      role: role || 'student',
      student_id: student_id || null,
      department: department || null,
      session: session || null,
      batch_number: batch_number || null,
      emergency_contact: emergency_contact || null,
      photo_url: photo_url || null,
      qr_code_id: qr_code,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    // Check if user creation was successful
    if (!user) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user - no data returned from database',
      });
    }

    // Log action (if admin user context exists)
    if (req.user?.id) {
      try {
        await logAdminAction(
          req.user.id,
          'create',
          'user',
          user.id,
          { first_name, last_name, email, role }
        );
      } catch (logErr) {
        console.warn('Failed to log admin action:', logErr.message);
      }
    }

    // Emit socket event for real-time update
    try {
      emitUserCreated(user);
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.status(201).json({
      success: true,
      data: normalizeUser(user),
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('❌ Create user error:', error.message || error);
    console.error('Error details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      student_id,
      department,
      session,
      batch_number,
      emergency_contact,
      photo_url,
      is_active,
    } = req.body;

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (student_id !== undefined) updateData.student_id = student_id;
    if (department !== undefined) updateData.department = department;
    if (session !== undefined) updateData.session = session;
    if (batch_number !== undefined) updateData.batch_number = batch_number;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    if (is_active !== undefined) updateData.is_active = is_active;

    const user = await update('users', id, updateData);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    await Promise.all([
      upsertUserOptionIfPresent('department', department),
      upsertUserOptionIfPresent('batch', batch_number),
      upsertUserOptionIfPresent('session', session),
    ]);

    // Log action (if admin user context exists)
    if (req.user?.id) {
      try {
        await logAdminAction(
          req.user.id,
          'update',
          'user',
          id,
          updateData
        );
      } catch (logErr) {
        console.warn('Failed to log admin action:', logErr.message);
      }
    }

    // Emit socket event for real-time update
    try {
      emitUserUpdated(user);
      // If active status changed, also emit status change event
      if (is_active !== undefined) {
        emitUserStatusChanged(id, is_active ? 'active' : 'inactive');
      }
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.json({
      success: true,
      data: normalizeUser(user),
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('❌ Update user error:', error.message || error);
    console.error('Error details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user (hard delete - completely removes from database)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user data before deletion for emitting event
    const user = await getById('users', id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Hard delete - completely remove user from database
    await deleteRecord('users', id);

    // Log action (if admin user context exists)
    if (req.user?.id) {
      try {
        await logAdminAction(
          req.user.id,
          'delete',
          'user',
          id,
          { email: user.email, first_name: user.first_name, last_name: user.last_name }
        );
      } catch (logErr) {
        console.warn('Failed to log admin action:', logErr.message);
      }
    }

    // Emit socket event for real-time update
    try {
      emitUserDeleted(id, user.email);
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};

/**
 * POST /api/admin/users/bulk-import
 * Bulk import users from CSV
 */
const bulkImportUsers = async (req, res, next) => {
  try {
    const { users: userData } = req.body;

    if (!Array.isArray(userData) || userData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user data format',
      });
    }

    const usersToInsert = userData.map(user => ({
      first_name: user.first_name || user.name?.split(' ')?.[0] || 'Unknown',
      last_name: user.last_name || user.name?.split(' ')?.slice(1).join(' ') || 'User',
      email: user.email,
      phone: user.phone || null,
      role: user.role || user.user_type || 'student',
      department: user.department || null,
      student_id: user.student_id || null,
      session: user.session || null,
      batch_number: user.batch_number || null,
      emergency_contact: user.emergency_contact || null,
      photo_url: user.photo_url || null,
      qr_code_id: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      is_active: user.is_active !== undefined ? Boolean(user.is_active) : true,
    }));

    const { data: created, error } = await supabase
      .from('users')
      .insert(usersToInsert)
      .select();

    if (error) throw error;

    await logAdminAction(
      req.user.id,
      'create',
      'user',
      null,
      { bulk_import: userData.length }
    );

    return res.status(201).json({
      success: true,
      data: (created || []).map(normalizeUser),
      message: `${created?.length || 0} users imported successfully`,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to import users',
    });
  }
};

/**
 * GET /api/admin/users/options
 * Get managed dropdown options for department/batch/session
 */
const getUserOptions = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profile_options')
      .select('option_type, option_value, is_active')
      .eq('is_active', true)
      .order('option_value', { ascending: true });

    if (error) throw error;

    const options = { department: [], batch: [], session: [] };
    (data || []).forEach((row) => {
      if (options[row.option_type]) {
        options[row.option_type].push(row.option_value);
      }
    });

    return res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Get user options error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user options',
    });
  }
};

/**
 * POST /api/admin/users/options
 * Add an option for department/batch/session
 */
const addUserOption = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!USER_OPTION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use department, batch, or session',
      });
    }

    const cleaned = typeof value === 'string' ? value.trim() : '';
    if (!cleaned) {
      return res.status(400).json({
        success: false,
        error: 'value is required',
      });
    }

    const { data, error } = await supabase
      .from('user_profile_options')
      .upsert(
        [{ option_type: type, option_value: cleaned, is_active: true }],
        { onConflict: 'option_type,option_value' }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data,
      message: `${type} option added`,
    });
  } catch (error) {
    console.error('Add user option error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add option',
    });
  }
};

/**
 * DELETE /api/admin/users/options/:type/:value
 * Soft-delete an option
 */
const removeUserOption = async (req, res) => {
  try {
    const { type, value } = req.params;

    if (!USER_OPTION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Use department, batch, or session',
      });
    }

    const cleaned = decodeURIComponent(value || '').trim();
    if (!cleaned) {
      return res.status(400).json({
        success: false,
        error: 'value is required',
      });
    }

    const { error } = await supabase
      .from('user_profile_options')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('option_type', type)
      .eq('option_value', cleaned);

    if (error) throw error;

    return res.json({
      success: true,
      message: `${type} option removed`,
    });
  } catch (error) {
    console.error('Remove user option error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove option',
    });
  }
};

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================

/**
 * GET /api/admin/attendance
 * Get attendance records
 */
const getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        users(name, email, student_id)
      `)
      .order('entry_time', { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte('entry_time', startDate)
        .lte('entry_time', endDate);
    }

    const { data, error, count } = await query.limit(parseInt(limit));

    if (error) throw error;

    const formatted = data?.map(record => ({
      id: record.id,
      student_name: record.users?.name,
      entry_time: record.entry_time,
      exit_time: record.exit_time,
      duration: record.duration_minutes,
      date: record.date,
    })) || [];

    return res.json({
      success: true,
      data: formatted,
      count,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance',
    });
  }
};

module.exports = {
  getDashboardStats,
  getLiveFeed,
  getAnalytics,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  bulkImportUsers,
  getUserOptions,
  addUserOption,
  removeUserOption,
  getAttendance,
};
