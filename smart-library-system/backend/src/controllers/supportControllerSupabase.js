// Support Tickets Controller - Supabase Integration

const { supabase, getAll, getById, create, update, deleteRecord, logAdminAction, } = require('../config/supabase-new');

// ============================================
// SUPPORT TICKETS MANAGEMENT
// ============================================

/**
 * GET /api/admin/support/tickets
 * Get all support tickets with filtering
 */
const getSupportTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, user_id } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        users(name, email, student_id)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
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
    console.error('Get support tickets error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets',
    });
  }
};

/**
 * GET /api/admin/support/tickets/:id
 * Get single support ticket
 */
const getSupportTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('support_tickets')
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
        error: 'Ticket not found',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get support ticket error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support ticket',
    });
  }
};

/**
 * PUT /api/admin/support/tickets/:id/assign
 * Assign ticket to admin
 */
const assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        error: 'assigned_to is required',
      });
    }

    const ticket = await update('support_tickets', id, {
      assigned_to,
      status: 'in_progress',
    });

    await logAdminAction(
      req.user.id,
      'update',
      'support_ticket',
      id,
      { assigned_to, status: 'in_progress' }
    );

    return res.json({
      success: true,
      data: ticket,
      message: 'Ticket assigned successfully',
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to assign ticket',
    });
  }
};

/**
 * PUT /api/admin/support/tickets/:id/resolve
 * Resolve support ticket
 */
const resolveTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    if (!resolution_notes) {
      return res.status(400).json({
        success: false,
        error: 'resolution_notes are required',
      });
    }

    const ticket = await update('support_tickets', id, {
      status: 'resolved',
      resolution_notes,
      resolved_at: new Date(),
    });

    await logAdminAction(
      req.user.id,
      'update',
      'support_ticket',
      id,
      { status: 'resolved' }
    );

    return res.json({
      success: true,
      data: ticket,
      message: 'Ticket resolved successfully',
    });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve ticket',
    });
  }
};

/**
 * PUT /api/admin/support/tickets/:id/close
 * Close support ticket
 */
const closeTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await update('support_tickets', id, {
      status: 'closed',
    });

    await logAdminAction(
      req.user.id,
      'update',
      'support_ticket',
      id,
      { status: 'closed' }
    );

    return res.json({
      success: true,
      data: ticket,
      message: 'Ticket closed successfully',
    });
  } catch (error) {
    console.error('Close ticket error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to close ticket',
    });
  }
};

/**
 * PUT /api/admin/support/tickets/:id/reopen
 * Reopen support ticket
 */
const reopenTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await update('support_tickets', id, {
      status: 'reopen',
      resolution_notes: null,
    });

    await logAdminAction(
      req.user.id,
      'update',
      'support_ticket',
      id,
      { status: 'reopen' }
    );

    return res.json({
      success: true,
      data: ticket,
      message: 'Ticket reopened successfully',
    });
  } catch (error) {
    console.error('Reopen ticket error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reopen ticket',
    });
  }
};

/**
 * PUT /api/admin/support/tickets/:id/priority
 * Update ticket priority
 */
const updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority value',
      });
    }

    const ticket = await update('support_tickets', id, { priority });

    await logAdminAction(
      req.user.id,
      'update',
      'support_ticket',
      id,
      { priority }
    );

    return res.json({
      success: true,
      data: ticket,
      message: 'Priority updated successfully',
    });
  } catch (error) {
    console.error('Update priority error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update priority',
    });
  }
};

/**
 * GET /api/admin/support/stats
 * Get support statistics
 */
const getSupportStats = async (req, res, next) => {
  try {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*');

    const open = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgress = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolved = tickets?.filter(t => t.status === 'resolved').length || 0;
    const closed = tickets?.filter(t => t.status === 'closed').length || 0;

    const stats = {
      open,
      inProgress,
      resolved,
      closed,
      total: tickets?.length || 0,
      highPriority: tickets?.filter(t => t.priority === 'high').length || 0,
      mediumPriority: tickets?.filter(t => t.priority === 'medium').length || 0,
      lowPriority: tickets?.filter(t => t.priority === 'low').length || 0,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get support stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch support statistics',
    });
  }
};

module.exports = {
  getSupportTickets,
  getSupportTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  updatePriority,
  getSupportStats,
};
