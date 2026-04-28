// Print Jobs Controller - Supabase Integration

const { supabase, getAll, getById, create, update, deleteRecord, logAdminAction, } = require('../config/supabase-new');

// ============================================
// PRINT JOBS MANAGEMENT
// ============================================

/**
 * GET /api/admin/print-jobs
 * Get all print jobs with filtering
 */
const getPrintJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, user_id } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = supabase
      .from('print_jobs')
      .select(`
        *,
        users(name, email, student_id)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, count, error } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    const formatted = data?.map(job => ({
      id: job.id,
      user: job.users,
      fileName: job.file_name,
      pageCount: job.page_count,
      copies: job.copies_requested,
      color: job.color_type,
      doubleSided: job.double_sided,
      status: job.status,
      requestedAt: job.requested_at,
      approvedAt: job.approved_at,
      readyAt: job.ready_at,
      collectedAt: job.collected_at,
      notes: job.notes,
    })) || [];

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get print jobs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch print jobs',
    });
  }
};

/**
 * GET /api/admin/print-jobs/:id
 * Get single print job
 */
const getPrintJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('print_jobs')
      .select(`
        *,
        users(name, email, student_id, phone)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Print job not found',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get print job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch print job',
    });
  }
};

/**
 * PUT /api/admin/print-jobs/:id/approve
 * Approve print job
 */
const approvePrintJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await update('print_jobs', id, {
      status: 'approved',
      approved_at: new Date(),
    });

    await logAdminAction(
      req.user.id,
      'update',
      'print_job',
      id,
      { status: 'approved' }
    );

    return res.json({
      success: true,
      data: job,
      message: 'Print job approved successfully',
    });
  } catch (error) {
    console.error('Approve print job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve print job',
    });
  }
};

/**
 * PUT /api/admin/print-jobs/:id/reject
 * Reject print job
 */
const rejectPrintJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const job = await update('print_jobs', id, {
      status: 'rejected',
      rejection_reason: rejection_reason || null,
    });

    await logAdminAction(
      req.user.id,
      'update',
      'print_job',
      id,
      { status: 'rejected', reason: rejection_reason }
    );

    return res.json({
      success: true,
      data: job,
      message: 'Print job rejected successfully',
    });
  } catch (error) {
    console.error('Reject print job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject print job',
    });
  }
};

/**
 * PUT /api/admin/print-jobs/:id/mark-printing
 * Mark job as printing
 */
const markPrinting = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await update('print_jobs', id, {
      status: 'printing',
      printing_started_at: new Date(),
    });

    await logAdminAction(
      req.user.id,
      'update',
      'print_job',
      id,
      { status: 'printing' }
    );

    return res.json({
      success: true,
      data: job,
      message: 'Job marked as printing',
    });
  } catch (error) {
    console.error('Mark printing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark job as printing',
    });
  }
};

/**
 * PUT /api/admin/print-jobs/:id/mark-ready
 * Mark job as ready for collection
 */
const markReady = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await update('print_jobs', id, {
      status: 'ready',
      ready_at: new Date(),
    });

    await logAdminAction(
      req.user.id,
      'update',
      'print_job',
      id,
      { status: 'ready' }
    );

    return res.json({
      success: true,
      data: job,
      message: 'Job marked as ready for collection',
    });
  } catch (error) {
    console.error('Mark ready error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark job as ready',
    });
  }
};

/**
 * PUT /api/admin/print-jobs/:id/mark-collected
 * Mark job as collected
 */
const markCollected = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await update('print_jobs', id, {
      status: 'collected',
      collected_at: new Date(),
    });

    await logAdminAction(
      req.user.id,
      'update',
      'print_job',
      id,
      { status: 'collected' }
    );

    return res.json({
      success: true,
      data: job,
      message: 'Job marked as collected',
    });
  } catch (error) {
    console.error('Mark collected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark job as collected',
    });
  }
};

/**
 * DELETE /api/admin/print-jobs/:id
 * Delete print job
 */
const deletePrintJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteRecord('print_jobs', id);

    await logAdminAction(
      req.user.id,
      'delete',
      'print_job',
      id,
      {}
    );

    return res.json({
      success: true,
      message: 'Print job deleted successfully',
    });
  } catch (error) {
    console.error('Delete print job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete print job',
    });
  }
};

/**
 * GET /api/admin/print-stats
 * Get print statistics
 */
const getPrintStats = async (req, res, next) => {
  try {
    const { data: jobs } = await supabase
      .from('print_jobs')
      .select('*');

    const stats = {
      pending: jobs?.filter(j => j.status === 'pending').length || 0,
      approved: jobs?.filter(j => j.status === 'approved').length || 0,
      printing: jobs?.filter(j => j.status === 'printing').length || 0,
      ready: jobs?.filter(j => j.status === 'ready').length || 0,
      collected: jobs?.filter(j => j.status === 'collected').length || 0,
      totalPages: jobs?.reduce((sum, j) => sum + (j.page_count || 0), 0) || 0,
      totalCopies: jobs?.reduce((sum, j) => sum + (j.copies_requested || 0), 0) || 0,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get print stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch print statistics',
    });
  }
};

module.exports = {
  getPrintJobs,
  getPrintJob,
  approvePrintJob,
  rejectPrintJob,
  markPrinting,
  markReady,
  markCollected,
  deletePrintJob,
  getPrintStats,
};
