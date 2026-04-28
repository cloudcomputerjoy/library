// Reports Controller - Supabase Integration

const { supabase } = require('../config/supabase-new');

// ============================================
// REPORTS GENERATION
// ============================================

/**
 * GET /api/admin/reports/books-issued
 * Books issued report
 */
const getBooksIssuedReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        users(name, email, department),
        books(title, author)
      `);

    if (startDate && endDate) {
      query = query
        .gte('issue_date', startDate)
        .lte('issue_date', endDate);
    }

    const { data, error } = await query.order('issue_date', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data,
      report: 'books_issued',
    });
  } catch (error) {
    console.error('Books issued report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
};

/**
 * GET /api/admin/reports/attendance
 * Attendance report
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        users(name, email, student_id, department)
      `);

    if (startDate && endDate) {
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    const summary = {
      totalRecords: data?.length || 0,
      uniqueUsers: [...new Set(data?.map(d => d.user_id) || [])].length,
      totalDuration: data?.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) || 0,
      avgDuration: data?.length ? (data.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / data.length).toFixed(2) : 0,
    };

    return res.json({
      success: true,
      data,
      summary,
      report: 'attendance',
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
};

/**
 * GET /api/admin/reports/fines
 * Fines/Payment report
 */
const getFinesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('fines')
      .select(`
        *,
        users(name, email, student_id)
      `);

    if (startDate && endDate) {
      query = query
        .gte('created_at', startDate)
        .lte('created_at', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const summary = {
      totalFines: data?.length || 0,
      pending: data?.filter(f => f.status === 'pending').length || 0,
      paid: data?.filter(f => f.status === 'paid').length || 0,
      waived: data?.filter(f => f.status === 'waived').length || 0,
      totalAmount: (data?.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0).toFixed(2),
      collectedAmount: (data?.filter(f => f.status === 'paid').reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0).toFixed(2),
      pendingAmount: (data?.filter(f => f.status === 'pending').reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) || 0).toFixed(2),
    };

    return res.json({
      success: true,
      data,
      summary,
      report: 'fines',
    });
  } catch (error) {
    console.error('Fines report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
};

/**
 * GET /api/admin/reports/print-jobs
 * Print jobs report
 */
const getPrintJobsReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('print_jobs')
      .select(`
        *,
        users(name, email, student_id)
      `);

    if (startDate && endDate) {
      query = query
        .gte('requested_at', startDate)
        .lte('requested_at', endDate);
    }

    const { data, error } = await query.order('requested_at', { ascending: false });

    if (error) throw error;

    const summary = {
      totalJobs: data?.length || 0,
      pending: data?.filter(j => j.status === 'pending').length || 0,
      approved: data?.filter(j => j.status === 'approved').length || 0,
      collected: data?.filter(j => j.status === 'collected').length || 0,
      totalPages: data?.reduce((sum, j) => sum + (j.page_count || 0), 0) || 0,
      totalCopies: data?.reduce((sum, j) => sum + (j.copies_requested || 0), 0) || 0,
      colorJobs: data?.filter(j => j.color_type === 'color').length || 0,
      bwJobs: data?.filter(j => j.color_type === 'bw').length || 0,
    };

    return res.json({
      success: true,
      data,
      summary,
      report: 'print_jobs',
    });
  } catch (error) {
    console.error('Print jobs report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
};

/**
 * GET /api/admin/reports/users
 * User activity report
 */
const getUsersReport = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const summary = {
      totalUsers: data?.length || 0,
      students: data?.filter(u => u.user_type === 'student').length || 0,
      librarians: data?.filter(u => u.user_type === 'librarian').length || 0,
      staff: data?.filter(u => u.user_type === 'staff').length || 0,
      admins: data?.filter(u => u.user_type === 'admin').length || 0,
    };

    return res.json({
      success: true,
      data,
      summary,
      report: 'users',
    });
  } catch (error) {
    console.error('Users report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
};

/**
 * GET /api/admin/reports/custom
 * Custom report based on parameters
 */
const getCustomReport = async (req, res, next) => {
  try {
    const { type, startDate, endDate, department, status } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'report type is required',
      });
    }

    let query;

    switch (type) {
      case 'user_department':
        query = supabase
          .from('users')
          .select('*');
        if (department) {
          query = query.eq('department', department);
        }
        break;

      case 'transaction_status':
        query = supabase
          .from('transactions')
          .select(`
            *,
            users(name, email),
            books(title)
          `);
        if (status) {
          query = query.eq('status', status);
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type',
        });
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      data,
      report: type,
    });
  } catch (error) {
    console.error('Custom report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate custom report',
    });
  }
};

module.exports = {
  getBooksIssuedReport,
  getAttendanceReport,
  getFinesReport,
  getPrintJobsReport,
  getUsersReport,
  getCustomReport,
};
