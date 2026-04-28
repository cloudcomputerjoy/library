/**
 * Firebase Admin SDK Configuration
 * Manages Firebase initialization and exports admin instance
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin SDK already initialized');
      return admin;
    }

    // Try to load Firebase credentials from environment variable
    const firebaseCredentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
    const firebaseCredentialsJson = process.env.FIREBASE_CREDENTIALS;

    let credentials = null;

    if (firebaseCredentialsPath && fs.existsSync(firebaseCredentialsPath)) {
      // Load from file path
      console.log('Loading Firebase credentials from file...');
      credentials = JSON.parse(fs.readFileSync(firebaseCredentialsPath, 'utf8'));
    } else if (firebaseCredentialsJson) {
      // Load from JSON string in environment
      console.log('Loading Firebase credentials from environment variable...');
      credentials = JSON.parse(firebaseCredentialsJson);
    } else {
      // Load from individual environment variables
      console.log('Loading Firebase credentials from environment variables...');
      credentials = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };
    }

    // Validate credentials
    if (!credentials || !credentials.project_id) {
      throw new Error(
        'Firebase credentials not properly configured. Please set FIREBASE_CREDENTIALS_PATH, FIREBASE_CREDENTIALS, or individual environment variables.'
      );
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId: credentials.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('⚠️  Firebase is disabled - Ensure credentials are configured');
    return null;
  }
};

/**
 * Get Firebase Admin instance
 */
const getFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    return initializeFirebase();
  }
  return admin;
};

/**
 * Send FCM notification
 * @param {string} fcmToken - FCM token of the device
 * @param {object} notification - Notification object with title, body, etc.
 * @param {object} data - Additional data payload
 * @returns {Promise<string>} - Message ID
 */
const sendFcmNotification = async (fcmToken, notification, data = {}) => {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error('Firebase is not initialized');
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data,
      token: fcmToken,
    };

    // Add optional fields if provided
    if (notification.imageUrl) {
      message.notification.imageUrl = notification.imageUrl;
    }

    const response = await firebaseAdmin.messaging().send(message);
    console.log('✅ FCM notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send FCM notification:', error.message);
    throw error;
  }
};

/**
 * Send FCM notification to multiple tokens
 * @param {array} fcmTokens - Array of FCM tokens
 * @param {object} notification - Notification object
 * @param {object} data - Additional data
 * @returns {Promise<object>} - Result with success and failed counts
 */
const sendFcmNotificationToMultiple = async (
  fcmTokens,
  notification,
  data = {}
) => {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error('Firebase is not initialized');
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data,
    };

    if (notification.imageUrl) {
      message.notification.imageUrl = notification.imageUrl;
    }

    const response = await firebaseAdmin
      .messaging()
      .sendMulticast({
        ...message,
        tokens: fcmTokens,
      });

    console.log('✅ FCM notifications sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('❌ Failed to send FCM notifications:', error.message);
    throw error;
  }
};

/**
 * Send FCM notification to a topic
 * @param {string} topic - Topic name
 * @param {object} notification - Notification object
 * @param {object} data - Additional data
 * @returns {Promise<string>} - Message ID
 */
const sendFcmNotificationToTopic = async (topic, notification, data = {}) => {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error('Firebase is not initialized');
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data,
      topic: topic,
    };

    if (notification.imageUrl) {
      message.notification.imageUrl = notification.imageUrl;
    }

    const response = await firebaseAdmin.messaging().send(message);
    console.log('✅ FCM topic notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send FCM topic notification:', error.message);
    throw error;
  }
};

/**
 * Subscribe token to topic
 * @param {string|array} tokens - FCM token or array of tokens
 * @param {string} topic - Topic name
 * @returns {Promise<object>}
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error('Firebase is not initialized');
    }

    const response = await firebaseAdmin
      .messaging()
      .subscribeToTopic(tokens, topic);
    console.log(`✅ Subscribed to topic '${topic}':`, response);
    return response;
  } catch (error) {
    console.error(`Failed to subscribe to topic '${topic}':`, error.message);
    throw error;
  }
};

/**
 * Unsubscribe token from topic
 * @param {string|array} tokens - FCM token or array of tokens
 * @param {string} topic - Topic name
 * @returns {Promise<object>}
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    const firebaseAdmin = getFirebaseAdmin();

    if (!firebaseAdmin) {
      throw new Error('Firebase is not initialized');
    }

    const response = await firebaseAdmin
      .messaging()
      .unsubscribeFromTopic(tokens, topic);
    console.log(`✅ Unsubscribed from topic '${topic}':`, response);
    return response;
  } catch (error) {
    console.error(
      `Failed to unsubscribe from topic '${topic}':`,
      error.message
    );
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
  sendFcmNotification,
  sendFcmNotificationToMultiple,
  sendFcmNotificationToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
};
