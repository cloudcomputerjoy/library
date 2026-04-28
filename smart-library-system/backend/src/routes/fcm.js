/**
 * FCM Routes
 * Handles FCM token registration and notification operations
 */

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const fcmController = require('../controllers/fcmController');

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (Authenticated)
// ============================================================

/**
 * Register FCM token
 * POST /api/fcm/register-token
 * Body: { fcmToken, deviceInfo?, platform? }
 */
router.post('/register-token', authenticateToken, fcmController.registerFcmToken);

/**
 * Deregister FCM token
 * POST /api/fcm/deregister-token
 * Body: { fcmToken }
 */
router.post(
  '/deregister-token',
  authenticateToken,
  fcmController.deregisterFcmToken
);

/**
 * Get user's FCM tokens
 * GET /api/fcm/my-tokens
 */
router.get('/my-tokens', authenticateToken, fcmController.getMyFcmTokens);

/**
 * Subscribe to topic
 * POST /api/fcm/subscribe-topic
 * Body: { topic }
 */
router.post('/subscribe-topic', authenticateToken, fcmController.subscribeToTopic);

/**
 * Unsubscribe from topic
 * POST /api/fcm/unsubscribe-topic
 * Body: { topic }
 */
router.post(
  '/unsubscribe-topic',
  authenticateToken,
  fcmController.unsubscribeFromTopic
);

/**
 * Get notification preferences
 * GET /api/fcm/preferences
 */
router.get(
  '/preferences',
  authenticateToken,
  fcmController.getNotificationPreferences
);

/**
 * Update notification preferences
 * PUT /api/fcm/preferences
 * Body: { push_notifications_enabled, due_date_reminders, ... }
 */
router.put(
  '/preferences',
  authenticateToken,
  fcmController.updateNotificationPreferences
);

/**
 * Send test notification
 * POST /api/fcm/send-test
 * Body: { userIdToNotify? }
 */
router.post('/send-test', authenticateToken, fcmController.sendTestNotification);

/**
 * Get notification history
 * GET /api/fcm/history
 * Query: { limit?, offset? }
 */
router.get(
  '/history',
  authenticateToken,
  fcmController.getNotificationHistory
);

module.exports = router;
