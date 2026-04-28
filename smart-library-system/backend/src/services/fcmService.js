/**
 * FCM Service
 * Manages FCM tokens and integrates with Firebase messaging
 */

const { supabase } = require('../config/database');
const {
  sendFcmNotification,
  sendFcmNotificationToMultiple,
  sendFcmNotificationToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
} = require('../config/firebase');

/**
 * Register or update FCM token for a user
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token from device
 * @param {string} deviceInfo - Device information (e.g., "iPhone 12", "Samsung Galaxy S21")
 * @param {string} platform - Platform (ios, android, web)
 * @returns {Promise<object>}
 */
exports.registerFcmToken = async (
  userId,
  fcmToken,
  deviceInfo = null,
  platform = 'android'
) => {
  try {
    if (!userId || !fcmToken) {
      throw new Error('User ID and FCM token are required');
    }

    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('fcm_token', fcmToken)
      .single();

    if (existingToken) {
      // Token already exists, just update the last_seen
      const { data, error } = await supabase
        .from('fcm_tokens')
        .update({
          last_seen: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', existingToken.id)
        .select()
        .single();

      if (error) throw error;

      console.log(
        `✅ FCM token updated for user ${userId}: ${fcmToken.substring(0, 20)}...`
      );
      return {
        success: true,
        message: 'FCM token updated',
        data,
      };
    }

    // Insert new token
    const { data, error } = await supabase
      .from('fcm_tokens')
      .insert([
        {
          user_id: userId,
          fcm_token: fcmToken,
          device_info: deviceInfo,
          platform: platform,
          is_active: true,
          last_seen: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log(
      `✅ FCM token registered for user ${userId}: ${fcmToken.substring(0, 20)}...`
    );
    return {
      success: true,
      message: 'FCM token registered',
      data,
    };
  } catch (error) {
    console.error('❌ Error registering FCM token:', error.message);
    throw error;
  }
};

/**
 * Deregister FCM token (logout/uninstall)
 * @param {string} userId - User ID
 * @param {string} fcmToken - FCM token to remove
 * @returns {Promise<object>}
 */
exports.deregisterFcmToken = async (userId, fcmToken) => {
  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('fcm_token', fcmToken)
      .select();

    if (error) throw error;

    console.log(
      `✅ FCM token deregistered for user ${userId}: ${fcmToken.substring(0, 20)}...`
    );
    return {
      success: true,
      message: 'FCM token deregistered',
      data,
    };
  } catch (error) {
    console.error('❌ Error deregistering FCM token:', error.message);
    throw error;
  }
};

/**
 * Get all active FCM tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<array>}
 */
exports.getUserFcmTokens = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_seen', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error getting FCM tokens:', error.message);
    throw error;
  }
};

/**
 * Send notification to user via FCM
 * @param {string} userId - User ID
 * @param {object} notification - Notification object {title, body, imageUrl}
 * @param {object} data - Data payload
 * @returns {Promise<object>}
 */
exports.sendNotificationToUser = async (userId, notification, data = {}) => {
  try {
    // Get all active tokens for user
    const tokens = await exports.getUserFcmTokens(userId);

    if (tokens.length === 0) {
      console.warn(`⚠️  No active FCM tokens found for user ${userId}`);
      return {
        success: false,
        message: 'No active FCM tokens for this user',
        successCount: 0,
        failureCount: 0,
      };
    }

    const fcmTokens = tokens.map((t) => t.fcm_token);

    // Send to multiple tokens
    const result = await sendFcmNotificationToMultiple(
      fcmTokens,
      notification,
      data
    );

    // Save notification record
    await supabase.from('sent_notifications').insert([
      {
        user_id: userId,
        title: notification.title,
        body: notification.body,
        notification_type: data.type || 'general',
        fcm_success_count: result.successCount,
        fcm_failure_count: result.failureCount,
        is_read: false,
      },
    ]);

    return {
      success: true,
      message: 'Notification sent',
      ...result,
    };
  } catch (error) {
    console.error('❌ Error sending notification to user:', error.message);
    throw error;
  }
};

/**
 * Send notification to multiple users
 * @param {array} userIds - Array of user IDs
 * @param {object} notification - Notification object
 * @param {object} data - Data payload
 * @returns {Promise<object>}
 */
exports.sendNotificationToUsers = async (userIds, notification, data = {}) => {
  try {
    const results = {
      totalSuccess: 0,
      totalFailure: 0,
      details: [],
    };

    for (const userId of userIds) {
      try {
        const result = await exports.sendNotificationToUser(
          userId,
          notification,
          data
        );

        results.details.push({
          userId,
          success: result.success,
          successCount: result.successCount || 0,
          failureCount: result.failureCount || 0,
        });

        results.totalSuccess += result.successCount || 0;
        results.totalFailure += result.failureCount || 0;
      } catch (err) {
        console.error(`Error sending to user ${userId}:`, err.message);
        results.details.push({
          userId,
          success: false,
          error: err.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Error sending notifications to users:', error.message);
    throw error;
  }
};

/**
 * Send notification via topic
 * @param {string} topic - Topic name
 * @param {object} notification - Notification object
 * @param {object} data - Data payload
 * @returns {Promise<object>}
 */
exports.sendNotificationToTopic = async (topic, notification, data = {}) => {
  try {
    const result = await sendFcmNotificationToTopic(
      topic,
      notification,
      data
    );

    // Save notification record
    await supabase.from('sent_notifications').insert([
      {
        topic: topic,
        title: notification.title,
        body: notification.body,
        notification_type: data.type || 'topic',
      },
    ]);

    return {
      success: true,
      message: 'Topic notification sent',
      messageId: result,
    };
  } catch (error) {
    console.error(
      '❌ Error sending notification to topic:',
      error.message
    );
    throw error;
  }
};

/**
 * Subscribe user to topic
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @returns {Promise<object>}
 */
exports.subscribeUserToTopic = async (userId, topic) => {
  try {
    const tokens = await exports.getUserFcmTokens(userId);

    if (tokens.length === 0) {
      return {
        success: false,
        message: 'No active FCM tokens for this user',
      };
    }

    const fcmTokens = tokens.map((t) => t.fcm_token);
    await subscribeToTopic(fcmTokens, topic);

    // Record subscription
    await supabase.from('topic_subscriptions').insert([
      {
        user_id: userId,
        topic: topic,
        is_subscribed: true,
      },
    ]);

    return {
      success: true,
      message: `User subscribed to topic: ${topic}`,
    };
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error.message);
    throw error;
  }
};

/**
 * Unsubscribe user from topic
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @returns {Promise<object>}
 */
exports.unsubscribeUserFromTopic = async (userId, topic) => {
  try {
    const tokens = await exports.getUserFcmTokens(userId);

    if (tokens.length === 0) {
      return {
        success: false,
        message: 'No active FCM tokens for this user',
      };
    }

    const fcmTokens = tokens.map((t) => t.fcm_token);
    await unsubscribeFromTopic(fcmTokens, topic);

    // Update subscription record
    await supabase
      .from('topic_subscriptions')
      .update({ is_subscribed: false })
      .eq('user_id', userId)
      .eq('topic', topic);

    return {
      success: true,
      message: `User unsubscribed from topic: ${topic}`,
    };
  } catch (error) {
    console.error('❌ Error unsubscribing from topic:', error.message);
    throw error;
  }
};

/**
 * Clean up inactive tokens (older than 30 days)
 * @returns {Promise<object>}
 */
exports.cleanupInactiveTokens = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('fcm_tokens')
      .delete()
      .lt('last_seen', thirtyDaysAgo.toISOString());

    if (error) throw error;

    console.log('✅ Inactive FCM tokens cleaned up');
    return {
      success: true,
      message: 'Inactive tokens removed',
    };
  } catch (error) {
    console.error('❌ Error cleaning up inactive tokens:', error.message);
    throw error;
  }
};
