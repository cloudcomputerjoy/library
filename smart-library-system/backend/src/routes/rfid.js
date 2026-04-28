/**
 * RFID Card Reader Routes
 * Handles RFID card scanning for entry/exit
 */

const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');
const rfidController = require('../controllers/rfidController');
const {
  APIError,
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /rfid/scan
 * Scan RFID tag and return user/card details
 */
router.post('/scan', asyncHandler(rfidController.scanRFIDCard));

/**
 * POST /rfid/register
 * Register RFID card for current user
 */
router.post('/register', authenticateToken, asyncHandler(rfidController.registerRFIDCard));

/**
 * GET /rfid/cards
 * Get current user's RFID cards
 */
router.get('/cards', authenticateToken, asyncHandler(rfidController.getUserRFIDCards));

/**
 * POST /rfid/deactivate
 * Deactivate a user's RFID card
 */
router.post('/deactivate', authenticateToken, asyncHandler(rfidController.deactivateRFIDCard));

/**
 * POST /rfid/transaction
 * Process an issue/return transaction using RFID and book barcode
 */
router.post('/transaction', authenticateToken, asyncHandler(rfidController.processRFIDTransaction));

/**
 * GET /rfid/logs
 * Get RFID transaction logs for current user
 */
router.get('/logs', authenticateToken, asyncHandler(rfidController.getRFIDLogs));

/**
 * GET /rfid/stats
 * Get RFID statistics for librarian/admin
 */
router.get('/stats', authenticateToken, requireLibrarian, asyncHandler(rfidController.getRFIDStats));

/**
 * PUT /rfid/:cardId/status
 * Update card status (Admin/Librarian only)
 */
router.put(
  '/:cardId/status',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
      throw new ValidationError('Status is required');
    }

    const validStatuses = ['active', 'inactive', 'lost', 'replaced'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const { data: card } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('card_id', req.params.cardId)
      .single();

    if (!card) {
      throw new NotFoundError('RFID card');
    }

    const { data: updatedCard, error } = await supabaseAdmin
      .from('rfid_cards')
      .update({
        status,
        updated_at: new Date(),
      })
      .eq('id', card.id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Card status updated successfully',
      data: updatedCard,
    });
  })
);

/**
 * GET /rfid/:userId
 * Get RFID cards for user (Admin/Librarian only)
 */
router.get(
  '/:userId',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { data: cards, error } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('user_id', req.params.userId);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: cards,
    });
  })
);

module.exports = router;
