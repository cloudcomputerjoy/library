/**
 * Firebase Notification Service
 * Handles FCM token registration, notification handling, and user preferences
 * ✅ FIXED: Uses React Native Firebase for proper mobile support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  getFcmToken,
  setupNotificationListener,
  initializeFirebaseMessaging,
  setupBackgroundMessageHandler,
  setupNotificationOpenedHandler,
} from './firebase';
import { API_BASE_URL } from '../config/api';

/**
 * Initialize Firebase notifications for the app
 * This should be called on app startup
 */
export const initializePushNotifications = async () => {
  try {
    console.log('🔔 Initializing push notifications...');

    // Initialize Firebase Messaging (handles permissions)
    const messaging = await initializeFirebaseMessaging();
    
    if (!messaging) {
      console.log('ℹ️  Firebase Messaging not available (expected in Expo Go/Web)');
      return false;
    }

    // Set up background message handler (when app is closed/backgrounded)
    setupBackgroundMessageHandler();

    // Get FCM token
    const fcmToken = await getFcmToken();
    if (!fcmToken) {
      console.warn('⚠️  Could not get FCM token');
      return false;
    }

    // Get user token from async storage
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.warn('⚠️  User not authenticated, skipping FCM registration');
      return false;
    }

    // Register FCM token with backend
    try {
      await registerFcmToken(fcmToken);
    } catch (regErr) {
      console.warn('⚠️  Failed to register FCM token with backend:', regErr.message);
      // Continue even if registration fails - app can still receive notifications
    }

    // Set up foreground notification listener
    const unsubscribeForeground = setupNotificationListener((notification) => {
      handleNotification(notification);
    });

    // Set up notification opened handler (when user taps notification)
    const unsubscribeOpened = setupNotificationOpenedHandler((remoteMessage) => {
      console.log('📬 User opened notification:', remoteMessage.messageId);
      handleNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
      });
    });

    // Store unsubscribe functions for cleanup
    await AsyncStorage.setItem('notificationUnsubscribe', JSON.stringify({
      foreground: !!unsubscribeForeground,
      opened: !!unsubscribeOpened,
    }));

    console.log('✅ Push notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error.message);
    console.error('   Stack:', error.stack);
    // Don't fail the app - notifications are optional
    return false;
  }
};

/**
 * Register FCM token with backend
 * @param {string} fcmToken - The FCM token from Firebase
 */
export const registerFcmToken = async (fcmToken) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    const deviceInfo = `${require('expo-device').isDevice ? 'Device' : 'Simulator'} - ${require('expo-device').deviceBrand || 'Unknown'}`;

    const response = await axios.post(
      `${API_BASE_URL}/fcm/register-token`,
      {
        fcmToken,
        deviceInfo,
        platform: 'android', // Can be made dynamic based on platform
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ FCM token registered:', response.data.message);
    await AsyncStorage.setItem('fcmToken', fcmToken);
    return response.data;
  } catch (error) {
    console.error('❌ Error registering FCM token:', error.message);
    throw error;
  }
};

/**
 * Deregister FCM token (on logout)
 * @param {string} fcmToken - The FCM token to deregister
 */
export const deregisterFcmToken = async (fcmToken) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.log('User not authenticated, skipping FCM deregistration');
      return;
    }

    const response = await axios.post(
      `${API_BASE_URL}/fcm/deregister-token`,
      { fcmToken },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ FCM token deregistered');
    await AsyncStorage.removeItem('fcmToken');
    return response.data;
  } catch (error) {
    console.error('❌ Error deregistering FCM token:', error.message);
  }
};

/**
 * Get user's FCM tokens
 */
export const getUserFcmTokens = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      return [];
    }

    const response = await axios.get(`${API_BASE_URL}/fcm/my-tokens`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error getting FCM tokens:', error.message);
    return [];
  }
};

/**
 * Subscribe to a notification topic
 * @param {string} topic - Topic name (e.g., 'library_announcements', 'book_available')
 */
export const subscribeToTopic = async (topic) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      throw new Error('User not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/fcm/subscribe-topic`,
      { topic },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Subscribed to topic: ${topic}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error subscribing to topic ${topic}:`, error.message);
    throw error;
  }
};

/**
 * Unsubscribe from a notification topic
 * @param {string} topic - Topic name
 */
export const unsubscribeFromTopic = async (topic) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      throw new Error('User not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/fcm/unsubscribe-topic`,
      { topic },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Unsubscribed from topic: ${topic}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error unsubscribing from topic ${topic}:`, error.message);
    throw error;
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      return null;
    }

    const response = await axios.get(`${API_BASE_URL}/fcm/preferences`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('❌ Error getting notification preferences:', error.message);
    return null;
  }
};

/**
 * Update notification preferences
 * @param {object} preferences - Preferences object
 */
export const updateNotificationPreferences = async (preferences) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      throw new Error('User not authenticated');
    }

    const response = await axios.put(
      `${API_BASE_URL}/fcm/preferences`,
      preferences,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Notification preferences updated');
    return response.data.data;
  } catch (error) {
    console.error('❌ Error updating notification preferences:', error.message);
    throw error;
  }
};

/**
 * Get notification history
 */
export const getNotificationHistory = async (limit = 20, offset = 0) => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      return [];
    }

    const response = await axios.get(`${API_BASE_URL}/fcm/history`, {
      params: { limit, offset },
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error getting notification history:', error.message);
    return [];
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async () => {
  try {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      throw new Error('User not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/fcm/send-test`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Test notification sent');
    return response.data;
  } catch (error) {
    console.error('❌ Error sending test notification:', error.message);
    throw error;
  }
};

/**
 * Handle incoming notification
 * Process and display the notification
 * @param {object} notification - Notification object from FCM
 */
const handleNotification = (notification) => {
  try {
    console.log('📬 Processing notification:', notification);

    // Store notification in async storage or state management
    const notificationType = notification.data?.type || 'general';

    // Handle different notification types
    switch (notificationType) {
      case 'due_reminder':
        console.log('📚 Due date reminder:', notification.body);
        break;
      case 'overdue':
        console.log('⚠️  Overdue notification:', notification.body);
        break;
      case 'fine':
        console.log('💰 Fine notification:', notification.body);
        break;
      case 'book_available':
        console.log('✅ Book available:', notification.body);
        break;
      default:
        console.log('📢 General notification:', notification.body);
    }

    // You can emit events or update state here
    // Example: emit event to navigation stack
    // navigationRef.navigate('Notifications');
  } catch (error) {
    console.error('❌ Error handling notification:', error.message);
  }
};

/**
 * Clean up notifications
 * Should be called on logout
 */
export const cleanupNotifications = async () => {
  try {
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    if (fcmToken) {
      await deregisterFcmToken(fcmToken);
    }
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error.message);
  }
};
