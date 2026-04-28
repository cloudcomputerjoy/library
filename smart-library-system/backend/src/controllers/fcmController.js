/**
 * FCM Notifications Controller
 * Handles FCM token registration and notification operations
 */

const fcmService = require('../services/fcmService');
const { supabase } = require('../config/database');

/**
 * Register FCM token
 * POST /api/fcm/register-token
 */
exports.registerFcmToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { fcmToken, deviceInfo, platform } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    const result = await fcmService.registerFcmToken(
      userId,
      fcmToken,
      deviceInfo || null,
      platform || 'android'
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Error registering FCM token:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to register FCM token',
      error: error.message,
    });
  }
};

/**
 * Deregister FCM token
 * POST /api/fcm/deregister-token
 */
exports.deregisterFcmToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { fcmToken } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required',
      });
    }

    const result = await fcmService.deregisterFcmToken(userId, fcmToken);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error deregistering FCM token:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to deregister FCM token',
      error: error.message,
    });
  }
};

/**
 * Get user's FCM tokens
 * GET /api/fcm/my-tokens
 */
exports.getMyFcmTokens = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const tokens = await fcmService.getUserFcmTokens(userId);

    res.status(200).json({
      success: true,
      data: tokens,
      count: tokens.length,
    });
  } catch (error) {
    console.error('Error getting FCM tokens:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get FCM tokens',
      error: error.message,
    });
  }
};

/**
 * Subscribe to topic
 * POST /api/fcm/subscribe-topic
 */
exports.subscribeToTopic = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { topic } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required',
      });
    }

    const result = await fcmService.subscribeUserToTopic(userId, topic);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error subscribing to topic:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to topic',
      error: error.message,
    });
  }
};

/**
 * Unsubscribe from topic
 * POST /api/fcm/unsubscribe-topic
 */
exports.unsubscribeFromTopic = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { topic } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic name is required',
      });
    }

    const result = await fcmService.unsubscribeUserFromTopic(userId, topic);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error unsubscribing from topic:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from topic',
      error: error.message,
    });
  }
};

/**
 * Get user's notification preferences
 * GET /api/fcm/preferences
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: data || {
        user_id: userId,
        push_notifications_enabled: true,
        due_date_reminders: true,
        overdue_notifications: true,
        fine_notifications: true,
        system_announcements: true,
        email_notifications: false,
      },
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification preferences',
      error: error.message,
    });
  }
};

/**
 * Update notification preferences
 * PUT /api/fcm/preferences
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const preferences = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert([
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated',
      data,
    });
  } catch (error) {
    console.error(
      'Error updating notification preferences:',
      error.message
    );
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};

/**
 * Send test notification (Admin/Librarian only)
 * POST /api/fcm/send-test
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { userIdToNotify } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const targetUserId = userIdToNotify || userId;

    const result = await fcmService.sendNotificationToUser(
      targetUserId,
      {
        title: '📬 Test Notification',
        body: 'This is a test notification from Smart Library',
      },
      {
        type: 'test',
        timestamp: new Date().toISOString(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'Test notification sent',
      result,
    });
  } catch (error) {
    console.error('Error sending test notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
};

/**
 * Get notification history
 * GET /api/fcm/history
 */
exports.getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const { data, error, count } = await supabase
      .from('sent_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count,
      },
    });
  } catch (error) {
    console.error('Error getting notification history:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification history',
      error: error.message,
    });
  }
};
