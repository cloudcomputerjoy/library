/**
 * Print System Routes
 * Handles print job management with page count tracking
 */

const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken, requireLibrarian, requireStudent } = require('../middleware/auth');
const { emitToRole, emitToUser } = require('../config/socket');
const {
  APIError,
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /print/request
 * Request print job (Student only)
 */
router.post(
  '/request',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { fileId, pageCount, copies = 1, colorPages = 0 } = req.body;

    // Validation
    if (!fileId || !pageCount) {
      throw new ValidationError('File ID and page count are required');
    }

    // Get file details
    const { data: file, error: fileError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', req.userId) // Own files only
      .single();

    if (!file || fileError) {
      throw new NotFoundError('File');
    }

    if (file.status !== 'active') {
      throw new APIError('File is no longer available', 410);
    }

    // Calculate cost (e.g., Rs. 1 per B&W, Rs. 5 per color)
    const bwPages = parseInt(pageCount) - parseInt(colorPages);
    const estimatedCost = bwPages * 1 + parseInt(colorPages) * 5;

    // Create print job
    const { data: printJob, error: jobError } = await supabaseAdmin
      .from('print_jobs')
      .insert([
        {
          user_id: req.userId,
          file_id: fileId,
          file_name: file.file_name,
          total_pages: parseInt(pageCount) * parseInt(copies),
          copies: parseInt(copies),
          color_pages: parseInt(colorPages),
          estimated_cost: estimatedCost,
          status: 'pending',
          created_at: new Date(),
          requested_at: new Date(),
        },
      ])
      .select()
      .single();

    if (jobError) {
      throw new APIError(jobError.message);
    }

    // Notify admin/librarian
    try {
      emitToRole('admin', 'new_print_job', {
        jobId: printJob.id,
        userId: req.userId,
        fileName: file.file_name,
        pageCount: parseInt(pageCount) * parseInt(copies),
        copies: parseInt(copies),
        estimatedCost,
        timestamp: new Date(),
      });

      emitToRole('librarian', 'new_print_job', {
        jobId: printJob.id,
        userId: req.userId,
        fileName: file.file_name,
        pageCount: parseInt(pageCount) * parseInt(copies),
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Socket.IO notification failed:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Print job requested successfully',
      data: {
        jobId: printJob.id,
        status: 'pending',
        estimatedCost,
        totalPages: printJob.total_pages,
        copies,
        estimatedWaitTime: '24 hours',
      },
    });
  })
);

/**
 * GET /print/my-jobs
 * Get user's print jobs
 */
router.get(
  '/my-jobs',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('print_jobs')
      .select('*')
      .eq('user_id', req.userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: jobs,
    });
  })
);

/**
 * GET /print/queue
 * Get print queue (Admin/Librarian only)
 */
router.get(
  '/queue',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('print_jobs')
      .select(
        `
        *,
        users:user_id(first_name, last_name, email, student_id),
        files:file_id(file_name, page_count)
      `
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query
      .order('created_at', { ascending: true })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: jobs,
    });
  })
);

/**
 * PUT /print/:jobId/status
 * Update print job status (Admin/Librarian only)
 */
router.put(
  '/:jobId/status',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { status, actualPages, completedAt } = req.body;

    // Validation
    if (!status) {
      throw new ValidationError('Status is required');
    }

    const validStatuses = ['pending', 'printing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('id', req.params.jobId)
      .single();

    if (!job || jobError) {
      throw new NotFoundError('Print job');
    }

    // Calculate actual cost if pages differ
    let actualCost = job.estimated_cost;
    if (actualPages && actualPages !== job.total_pages) {
      // Recalculate based on actual pages
      actualCost = actualPages * 1; // Simple calculation, adjust as needed
    }

    // Update job
    const updateData = {
      status,
      updated_at: new Date(),
      handled_by: req.userId,
    };

    if (actualPages) updateData.actual_pages = parseInt(actualPages);
    if (actualCost) updateData.actual_cost = actualCost;
    if (status === 'completed' && !completedAt) {
      updateData.completed_at = new Date();
    }

    const { data: updatedJob, error: updateError } = await supabaseAdmin
      .from('print_jobs')
      .update(updateData)
      .eq('id', req.params.jobId)
      .select()
      .single();

    if (updateError) {
      throw new APIError(updateError.message);
    }

    // Emit notification to student
    try {
      emitToUser(job.user_id, 'print_status_updated', {
        jobId: req.params.jobId,
        status,
        actualCost,
        completedAt: updatedJob.completed_at,
        message: `Your print job is now: ${status}`,
      });
    } catch (err) {
      console.error('Socket.IO notification failed:', err);
    }

    res.json({
      success: true,
      message: `Print job status updated to ${status}`,
      data: updatedJob,
    });
  })
);

/**
 * POST /print/:jobId/verify
 * Verify and confirm print completion (Admin/Librarian only)
 */
router.post(
  '/:jobId/verify',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { actualPages, notes } = req.body;

    // Get job
    const { data: job, error: jobError } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('id', req.params.jobId)
      .single();

    if (!job || jobError) {
      throw new NotFoundError('Print job');
    }

    // Calculate final cost
    const actualCost = actualPages ? actualPages * 1 : job.estimated_cost;

    // Update job as completed
    const { data: completedJob, error } = await supabaseAdmin
      .from('print_jobs')
      .update({
        status: 'ready_for_pickup',
        actual_pages: actualPages || job.total_pages,
        actual_cost: actualCost,
        verified_by: req.userId,
        verified_at: new Date(),
        notes,
      })
      .eq('id', req.params.jobId)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    // Create billing record if cost differs
    if (actualCost !== job.estimated_cost) {
      await supabaseAdmin.from('billing').insert([
        {
          user_id: job.user_id,
          print_job_id: req.params.jobId,
          amount: actualCost,
          reason: 'Print job',
          type: 'charge',
          created_at: new Date(),
        },
      ]);
    }

    // Notify student
    try {
      emitToUser(job.user_id, 'print_ready_for_pickup', {
        jobId: req.params.jobId,
        actualPages,
        finalCost: actualCost,
        message: 'Your print job is ready for pickup',
      });
    } catch (err) {
      console.error('Socket.IO notification failed:', err);
    }

    res.json({
      success: true,
      message: 'Print job verified and ready for pickup',
      data: {
        ...completedJob,
        finalCost: actualCost,
      },
    });
  })
);

/**
 * POST /print/:jobId/collect
 * Mark print as collected by student (Student only)
 */
router.post(
  '/:jobId/collect',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    // Get job
    const { data: job, error: jobError } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('id', req.params.jobId)
      .eq('user_id', req.userId)
      .single();

    if (!job || jobError) {
      throw new NotFoundError('Print job');
    }

    if (job.status !== 'ready_for_pickup') {
      throw new APIError('Print job is not ready for pickup', 400);
    }

    // Mark as collected
    const { data: collectedJob, error } = await supabaseAdmin
      .from('print_jobs')
      .update({
        status: 'collected',
        collected_at: new Date(),
      })
      .eq('id', req.params.jobId)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Print job collected successfully',
      data: collectedJob,
    });
  })
);

/**
 * GET /print/statistics
 * Get print system statistics (Admin/Librarian only)
 */
router.get(
  '/statistics',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let query = supabase.from('print_jobs').select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new APIError(error.message);
    }

    // Calculate statistics
    const stats = {
      totalJobs: jobs.length,
      totalPages: jobs.reduce((sum, job) => sum + (job.actual_pages || job.total_pages), 0),
      totalRevenue: jobs.reduce((sum, job) => sum + (job.actual_cost || job.estimated_cost), 0),
      byStatus: {},
    };

    jobs.forEach((job) => {
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats,
    });
  })
);

module.exports = router;
