/**
 * Firebase Configuration for React Native
 * Sets up Firebase for push notifications using React Native Firebase
 * ✅ FIXED: Uses React Native Firebase (not Web SDK) for proper Android/iOS support
 * 
 * IMPORTANT: This uses @react-native-firebase/messaging, NOT the web 'firebase' package
 */

import { Platform } from 'react-native';

let messaging = null;
if (Platform.OS !== 'web') {
  try {
    // Conditionally require to prevent web crashes
    // as React Native Firebase does not support web natively
    messaging = require('@react-native-firebase/messaging').default;
  } catch (error) {
    console.warn('⚠️ Firebase native module not found. Are you running in Expo Go? Push notifications will be disabled.');
    messaging = null;
  }
}

// Reference to Firebase app (initialized by React Native Firebase automatically on app start)
let isInitialized = false;
let notificationListenersSet = false;

/**
 * Initialize Firebase Messaging (React Native Firebase)
 * Automatically initializes when the module is imported
 * 
 * ✅ Key differences from Web SDK:
 * - No initializeApp() needed - React Native Firebase handles it
 * - Uses native iOS/Android modules, not Service Workers
 * - Permissions handled by native permission system
 */
export const initializeFirebaseMessaging = async () => {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.log('⚠️  Firebase Messaging is not supported on web or native module is missing.');
      return null;
    }

    if (isInitialized) {
      console.log('✅ Firebase Messaging already initialized');
      return messaging();
    }

    console.log('🔔 Initializing React Native Firebase Messaging...');

    // Request user permission for notifications (Android 13+)
    if (Platform.OS === 'android') {
      console.log('📱 Android detected - requesting notification permissions');
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Android push notification permission granted');
      } else {
        console.warn('⚠️  Android push notification permission denied');
      }
    } else if (Platform.OS === 'ios') {
      console.log('🍎 iOS detected - requesting notification permissions');
      // iOS automatically prompts for permission on first token request
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ iOS push notification permission granted');
      } else {
        console.warn('⚠️  iOS push notification permission denied');
      }
    }

    // Enable auto-initialization for convenience (optional but recommended)
    await messaging().setAutoInitEnabled(true);
    console.log('✅ Firebase auto-initialization enabled');

    isInitialized = true;
    console.log('✅ Firebase Messaging initialized successfully');
    return messaging();
  } catch (error) {
    console.error('❌ Firebase Messaging initialization error:', error.message);
    console.error('   Stack:', error.stack);
    return null;
  }
};

/**
 * Get FCM token for the device
 * This token is used to send notifications to this specific device
 */
export const getFcmToken = async () => {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.log('⚠️  FCM Token not available on web or native module is missing.');
      return null;
    }

    // Ensure Firebase is initialized first
    if (!isInitialized) {
      await initializeFirebaseMessaging();
    }

    console.log('🔑 Attempting to get FCM token...');

    // Get the device FCM token
    const token = await messaging().getToken();

    if (token) {
      console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️  No FCM token available - device may not have registered with FCM server');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error.message);
    console.error('   If using Emulator/Simulator:');
    console.error('   - Some emulators do not support Google Play Services');
    console.error('   - Try on a real device or emulator with Google Play Services installed');
    return null;
  }
};

/**
 * Set up listener for incoming notifications
 * Handles foreground messages (when app is open)
 * @param {function} callback - Callback function to handle notifications
 */
export const setupNotificationListener = (callback) => {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.log('⚠️  Notification listener not available on web or native module is missing.');
      return null;
    }

    if (!callback) {
      console.warn('⚠️  No callback provided for notification listener');
      return null;
    }

    console.log('👂 Setting up foreground notification listener...');

    // Listen for foreground messages (when app is open)
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📬 Foreground notification received:', remoteMessage.messageId);
      console.log('   Title:', remoteMessage.notification?.title);
      console.log('   Body:', remoteMessage.notification?.body);

      const notification = {
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || 'You have a new message',
        data: remoteMessage.data || {},
        messageId: remoteMessage.messageId,
      };

      if (callback) {
        try {
          callback(notification);
        } catch (callbackErr) {
          console.error('❌ Notification callback error:', callbackErr);
        }
      }
    });

    console.log('✅ Foreground listener set up');
    return unsubscribeForeground;
  } catch (error) {
    console.error('❌ Error setting up notification listener:', error.message);
    return null;
  }
};

/**
 * Handle background notification (when app is closed/backgrounded)
 * This should be called in App.js before any navigation
 * 
 * ⚠️  IMPORTANT: This listener must be set up at the top level of your app,
 * ideally before navigation is initialized
 */
export const setupBackgroundMessageHandler = () => {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.log('⚠️  Background message handler not available on web or native module is missing.');
      return;
    }

    console.log('👂 Setting up background message handler...');

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📬 Background notification received:', remoteMessage.messageId);
      console.log('   App State: Background/Closed');
      console.log('   Title:', remoteMessage.notification?.title);
      console.log('   Body:', remoteMessage.notification?.body);

      // Handle the notification here
      // This is called even when the app is completely closed
      // You can update local state, show badges, etc.
      return Promise.resolve();
    });

    console.log('✅ Background message handler set up');
  } catch (error) {
    console.error('❌ Error setting up background message handler:', error.message);
  }
};

/**
 * Listen for notification when app is opened from background
 * This is triggered when user taps a notification while app is backgrounded
 */
export const setupNotificationOpenedHandler = (callback) => {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.log('⚠️  Notification opened handler not available on web or native module is missing.');
      return null;
    }

    console.log('👂 Setting up notification opened handler...');

    return messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📬 App opened from notification:', remoteMessage.messageId);
      console.log('   Title:', remoteMessage.notification?.title);
      console.log('   Body:', remoteMessage.notification?.body);

      if (remoteMessage && callback) {
        try {
          callback(remoteMessage);
        } catch (callbackErr) {
          console.error('❌ Notification opened callback error:', callbackErr);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error setting up notification opened handler:', error.message);
    return null;
  }
};

/**
 * Get initial notification (if app was opened from notification)
 * Call this once on app startup
 */
export const getInitialNotification = async () => {
  try {
    if (Platform.OS === 'web' || !messaging) {
      console.log('⚠️  Initial notification not available on web or native module is missing.');
      return null;
    }

    const remoteMessage = await messaging().getInitialNotification();

    if (remoteMessage) {
      console.log('📬 Initial notification (app opened from notification):', remoteMessage.messageId);
      return remoteMessage;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting initial notification:', error.message);
    return null;
  }
};

// Export messaging for direct use if needed
export default messaging ? messaging() : null;
