const express = require('express');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

router.get('/', authenticateToken, notificationsController.getNotifications);
router.get('/unread-count', authenticateToken, notificationsController.getUnreadCount);
router.post('/mark-read', authenticateToken, notificationsController.markAsRead);
router.post('/mark-all-read', authenticateToken, notificationsController.markAllAsRead);
router.post('/delete', authenticateToken, notificationsController.deleteNotification);
router.get('/preferences', authenticateToken, notificationsController.getPreferences);
router.put('/preferences', authenticateToken, notificationsController.updatePreferences);
router.post('/send-reminders', authenticateToken, requireLibrarian, notificationsController.sendDueReminders);
router.post('/send-overdue', authenticateToken, requireLibrarian, notificationsController.sendOverdueNotifications);
router.post('/announce', authenticateToken, requireLibrarian, notificationsController.sendAnnouncement);

module.exports = router;
