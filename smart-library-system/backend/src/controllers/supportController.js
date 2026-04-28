/**
 * Support Controller
 * Handles support tickets and customer inquiries
 */

const { supabase } = require('../config/database');
const { sendFcmNotification } = require('../services/fcmService');

/**
 * Create support ticket
 */
exports.createTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subject, message, attachments = [] } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required',
      });
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          subject,
          message,
          attachments: attachments,
          status: 'open',
          priority: 'medium',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Support ticket created',
      data,
    });
  } catch (error) {
    console.error('Error creating support ticket:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message,
    });
  }
};

/**
 * Get user's support tickets
 */
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, status = null } = req.query;

    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count,
      },
    });
  } catch (error) {
    console.error('Error getting support tickets:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get support tickets',
      error: error.message,
    });
  }
};

/**
 * Get ticket detail
 */
exports.getTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId } = req.params;

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error getting support ticket:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get support ticket',
      error: error.message,
    });
  }
};

/**
 * Add reply to ticket
 */
exports.addReply = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId } = req.params;
    const { message, attachments = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required',
      });
    }

    // Insert reply
    const { data: replyData, error: replyError } = await supabase
      .from('support_ticket_replies')
      .insert([
        {
          ticket_id: ticketId,
          user_id: userId,
          message,
          attachments: attachments,
        },
      ])
      .select()
      .single();

    if (replyError) throw replyError;

    // Update ticket's updated_at
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    res.status(201).json({
      success: true,
      message: 'Reply added to ticket',
      data: replyData,
    });
  } catch (error) {
    console.error('Error adding reply:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message,
    });
  }
};

/**
 * Close ticket
 */
exports.closeTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticketId } = req.params;
    const { resolution_notes = null } = req.body;

    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        resolution_notes: resolution_notes,
        closed_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ticket closed',
      data,
    });
  } catch (error) {
    console.error('Error closing ticket:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket',
      error: error.message,
    });
  }
};

/**
 * Get ticket replies
 */
exports.getTicketReplies = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const { data, error } = await supabase
      .from('support_ticket_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error getting ticket replies:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket replies',
      error: error.message,
    });
  }
};
