/**
 * Support Routes
 * Handles support ticket operations
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const supportController = require('../controllers/supportController');

const router = express.Router();

/**
 * Create support ticket
 * POST /api/support/ticket
 */
router.post('/ticket', authenticateToken, supportController.createTicket);

/**
 * Get user's support tickets
 * GET /api/support/tickets
 */
router.get('/tickets', authenticateToken, supportController.getMyTickets);

/**
 * Get single ticket
 * GET /api/support/ticket/:ticketId
 */
router.get('/ticket/:ticketId', authenticateToken, supportController.getTicket);

/**
 * Add reply to ticket
 * POST /api/support/ticket/:ticketId/reply
 */
router.post('/ticket/:ticketId/reply', authenticateToken, supportController.addReply);

/**
 * Get ticket replies
 * GET /api/support/ticket/:ticketId/replies
 */
router.get('/ticket/:ticketId/replies', authenticateToken, supportController.getTicketReplies);

/**
 * Close ticket
 * POST /api/support/ticket/:ticketId/close
 */
router.post('/ticket/:ticketId/close', authenticateToken, supportController.closeTicket);

module.exports = router;
