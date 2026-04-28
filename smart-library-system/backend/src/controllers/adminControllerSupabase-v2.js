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

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await getSupabaseDashboardStats();
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
};

const getLiveFeed = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const { data: feed } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: feed || [],
    });
  } catch (error) {
    console.error('Live feed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch live feed',
    });
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getSupabaseDashboardStats();

    return res.json({
      success: true,
      data: {
        ...stats,
        dateRange: { startDate, endDate },
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

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, user_type, status } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
    }

    if (user_type) {
      query = query.eq('user_type', user_type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data,
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
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, user_type, department, student_id } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required',
      });
    }

    const qr_code = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const user = await create('users', {
      name,
      email,
      phone: phone || null,
      user_type: user_type || 'student',
      department: department || null,
      student_id: student_id || null,
      qr_code,
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, department, user_type, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (user_type) updateData.user_type = user_type;
    if (status) updateData.status = status;

    const user = await update('users', id, updateData);

    return res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await update('users', id, { status: 'deleted' });

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
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      user_type: user.user_type || 'student',
      department: user.department || null,
      student_id: user.student_id || null,
      qr_code: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
    }));

    const { data: created, error } = await supabase
      .from('users')
      .insert(usersToInsert)
      .select();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: created,
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

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================

const getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;

    let query = supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte('created_at', startDate)
        .lte('created_at', endDate);
    }

    const { data, error } = await query.limit(parseInt(limit));

    if (error) throw error;

    return res.json({
      success: true,
      data: data || [],
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
  getAttendance,
};
