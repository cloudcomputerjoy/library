# Firebase Cloud Messaging (FCM) Integration Guide

Complete guide for integrating Firebase Cloud Messaging for push notifications in the Smart Library app.

## 📚 Table of Contents
1. [Overview](#overview)
2. [Firebase Setup](#firebase-setup)
3. [Backend Configuration](#backend-configuration)
4. [Mobile App Configuration](#mobile-app-configuration)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This integration enables:
- **Push notifications** via Firebase Cloud Messaging (FCM)
- **Token management** for device registration
- **Topic subscriptions** for broadcast notifications
- **Notification preferences** for user control
- **History tracking** of sent notifications

### Key Features
✅ Multi-device support (one user, multiple devices)  
✅ Topic-based messaging  
✅ User preference management  
✅ Notification history  
✅ Graceful error handling  
✅ Production-ready architecture  

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Enter project name (e.g., "Smart Library")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Create Service Account

1. Navigate to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save the JSON file securely
4. This file contains credentials for backend authentication

### Step 3: Get Firebase Configuration

1. Go to **Project Settings** → **General**
2. Scroll to "Your apps" section
3. Find or create a Web app
4. Copy the Firebase configuration object

Example configuration:
```javascript
{
  "apiKey": "AIzaSyDxxxxxxxxxxxxxxxxxx",
  "authDomain": "smart-library-xxxxxx.firebaseapp.com",
  "projectId": "smart-library-xxxxxx",
  "storageBucket": "smart-library-xxxxxx.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:abcdefg1234567"
}
```

### Step 4: Get VAPID Key (for Web)

1. Go to **Project Settings** → **Cloud Messaging** tab
2. Under "Firebase Cloud Messaging API (V1)", find the Web Push certificates section
3. Click "Generate Key Pair" if not already created
4. Copy the VAPID public key

---

## Backend Configuration

### Step 1: Install Dependencies

```bash
cd backend
npm install firebase-admin
```

### Step 2: Set Environment Variables

Create or update `.env` file in the backend directory:

**Option A: Using credentials file path**
```env
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
```

**Option B: Using individual environment variables**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

**Option C: Using JSON string**
```env
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"...","...":"..."}'
```

### Step 3: Run Database Migration

```bash
# Run the migration to create FCM tables
psql -h your-db-host -U your-db-user -d your-db-name -f backend/migrations/001_create_fcm_tables.sql

# Or use Supabase SQL editor
# Navigate to SQL Editor and execute the migration SQL
```

### Step 4: Verify Backend Integration

```bash
# Start the backend
cd backend
npm run dev

# You should see:
# ✅ Firebase initialized
```

---

## Mobile App Configuration

### Step 1: Install Dependencies

```bash
cd mobile
npm install
# or
yarn install
```

Dependencies added:
- `@react-native-firebase/app` - Firebase Core
- `@react-native-firebase/messaging` - FCM
- `expo-notifications` - Expo notifications API
- `firebase` - Web SDK (for typing)

### Step 2: Configure app.json

Update `mobile/app.json` with Firebase configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-firebase/app",
        {}
      ],
      [
        "@react-native-firebase/messaging",
        {
          "android": {
            "alert": true,
            "sound": true
          }
        }
      ]
    ]
  }
}
```

### Step 3: Set Environment Variables

Create or update `.env` file in the mobile directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
EXPO_PUBLIC_API_URL=http://your-backend-url:5000/api
```

### Step 4: Request Notification Permissions

The app automatically requests permissions on first launch. Users can also manage permissions in device settings.

---

## Database Schema

### Tables Created

#### 1. `fcm_tokens`
Stores FCM tokens for push notifications
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- fcm_token: TEXT (unique)
- device_info: TEXT
- platform: VARCHAR ('android', 'ios', 'web')
- is_active: BOOLEAN
- last_seen: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `notification_preferences`
User notification settings
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users, unique)
- push_notifications_enabled: BOOLEAN
- due_date_reminders: BOOLEAN
- overdue_notifications: BOOLEAN
- fine_notifications: BOOLEAN
- system_announcements: BOOLEAN
- email_notifications: BOOLEAN
- sms_notifications: BOOLEAN
- quiet_hours_enabled: BOOLEAN
- quiet_hours_start: TIME
- quiet_hours_end: TIME
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. `sent_notifications`
Log of all sent notifications
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- topic: VARCHAR
- title: TEXT
- body: TEXT
- notification_type: VARCHAR
- fcm_success_count: INTEGER
- fcm_failure_count: INTEGER
- is_read: BOOLEAN
- read_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. `topic_subscriptions`
Track user topic subscriptions
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- topic: VARCHAR
- is_subscribed: BOOLEAN
- subscribed_at: TIMESTAMP
- unsubscribed_at: TIMESTAMP
```

---

## API Endpoints

All endpoints require authentication (JWT token in Authorization header)

### Token Management

#### Register FCM Token
```
POST /api/fcm/register-token
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "fcmToken": "eUXXXXXXXXXXXXXXXXXX",
  "deviceInfo": "iPhone 12 Pro",
  "platform": "ios"
}

Response:
{
  "success": true,
  "message": "FCM token registered",
  "data": { ... }
}
```

#### Deregister FCM Token
```
POST /api/fcm/deregister-token
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "fcmToken": "eUXXXXXXXXXXXXXXXXXX"
}

Response:
{
  "success": true,
  "message": "FCM token deregistered"
}
```

#### Get User's FCM Tokens
```
GET /api/fcm/my-tokens
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fcm_token": "eUXXXX...",
      "device_info": "iPhone 12",
      "platform": "ios",
      "is_active": true,
      "last_seen": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 2
}
```

### Topic Management

#### Subscribe to Topic
```
POST /api/fcm/subscribe-topic
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "topic": "library_announcements"
}

Response:
{
  "success": true,
  "message": "User subscribed to topic: library_announcements"
}
```

#### Unsubscribe from Topic
```
POST /api/fcm/unsubscribe-topic
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "topic": "library_announcements"
}

Response:
{
  "success": true,
  "message": "User unsubscribed from topic: library_announcements"
}
```

### Preferences

#### Get Notification Preferences
```
GET /api/fcm/preferences
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "push_notifications_enabled": true,
    "due_date_reminders": true,
    "overdue_notifications": true,
    "fine_notifications": true,
    "system_announcements": true
  }
}
```

#### Update Notification Preferences
```
PUT /api/fcm/preferences
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

Body:
{
  "push_notifications_enabled": true,
  "due_date_reminders": false,
  "overdue_notifications": true,
  "system_announcements": true
}

Response:
{
  "success": true,
  "message": "Notification preferences updated",
  "data": { ... }
}
```

### Notifications

#### Send Test Notification
```
POST /api/fcm/send-test
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "message": "Test notification sent",
  "successCount": 1,
  "failureCount": 0
}
```

#### Get Notification History
```
GET /api/fcm/history?limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "📚 Due Date Reminder",
      "body": "Book 'The Great Gatsby' is due tomorrow",
      "notification_type": "due_reminder",
      "is_read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 42
  }
}
```

---

## Usage Examples

### Backend: Send Notification to User

```javascript
const fcmService = require('./src/services/fcmService');

// Send to single user
const result = await fcmService.sendNotificationToUser(
  userId,
  {
    title: '📚 Due Date Reminder',
    body: 'Book is due in 2 days',
    imageUrl: 'https://...'  // optional
  },
  {
    type: 'due_reminder',
    bookId: 'book-123',
    daysRemaining: '2'
  }
);
```

### Backend: Send Broadcast via Topic

```javascript
const fcmService = require('./src/services/fcmService');

// Send to all users subscribed to a topic
const result = await fcmService.sendNotificationToTopic(
  'library_announcements',
  {
    title: '📢 Library Announcement',
    body: 'Library will be closed on Monday for maintenance'
  },
  {
    type: 'announcement'
  }
);
```

### Backend: Send to Multiple Users

```javascript
const fcmService = require('./src/services/fcmService');

const userIds = ['user-1', 'user-2', 'user-3'];

const results = await fcmService.sendNotificationToUsers(
  userIds,
  {
    title: '⚠️ Overdue Books',
    body: 'You have overdue books'
  },
  {
    type: 'overdue'
  }
);

// results.totalSuccess: 3
// results.totalFailure: 0
```

### Mobile: Handle Notifications

```javascript
import { initializePushNotifications } from './src/services/firebaseNotification';

// Initialize on app startup (already done in App.js)
useEffect(() => {
  initializePushNotifications();
}, []);
```

### Mobile: Subscribe to Topic

```javascript
import { subscribeToTopic } from './src/services/firebaseNotification';

// Subscribe to library announcements
await subscribeToTopic('library_announcements');
```

### Mobile: Update Preferences

```javascript
import { updateNotificationPreferences } from './src/services/firebaseNotification';

// Disable due date reminders
await updateNotificationPreferences({
  due_date_reminders: false,
  push_notifications_enabled: true
});
```

---

## Testing

### Test Notification on Backend

```bash
# Send test notification to yourself
curl -X POST http://localhost:5000/api/fcm/send-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Test FCM Token Registration

```bash
# Register a test token
curl -X POST http://localhost:5000/api/fcm/register-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "test_token_123",
    "deviceInfo": "Test Device",
    "platform": "android"
  }'
```

### Test on Mobile

1. Launch the app on your device/emulator
2. Log in with your account
3. You should see console logs:
   - `✅ Firebase initialized`
   - `✅ FCM Token obtained: ...`
   - `✅ Push notifications initialized`
4. Navigate to Settings → Notifications to manage preferences

---

## Troubleshooting

### Firebase Not Initializing

**Error**: `❌ Failed to initialize Firebase Admin SDK`

**Solution**:
- Verify Firebase credentials are correct
- Check environment variables are set
- Ensure credentials file exists and is readable
- In development, Firebase is optional (warning only)

### No FCM Token Received

**Symptoms**: Token registration fails

**Solutions**:
1. Check Firebase configuration is correct
2. Ensure app has notification permissions
3. Verify device has Google Play Services (Android) or proper setup (iOS)
4. Check internet connectivity

### Notifications Not Received

**Symptoms**: Tokens registered but no notifications arrive

**Solutions**:
1. **Verify token is active**: Check `fcm_tokens` table
2. **Check notification preferences**: Ensure notifications are enabled
3. **Check payload**: Ensure notification title and body are set
4. **Verify Firebase project**: Confirm notifications are enabled in Firebase Console
5. **View Firebase Logs**: Check Firebase Console → Cloud Messaging → Logs

### Device/Token Errors

**Error**: `InvalidRegistration` or `NotRegisteredError`

**Cause**: Token is invalid or no longer active

**Solution**:
- User needs to re-register app
- Token may have expired or been revoked
- Run cleanup migration to remove old tokens

### Rate Limiting

**Error**: Too many requests to FCM

**Solution**:
1. Implement request batching
2. Use topic messaging instead of individual tokens
3. Increase rate limiting window in `.env`

### Notification Not Showing in App

**Cause**: Background notification handling

**Solution**:
- Foreground notifications use in-app notification handler
- Background notifications appear in system tray
- Both call the same handler in `setUpNotificationListener`

---

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Service account credentials secured in environment (NOT versioned)
- [ ] Database migration runs successfully
- [ ] Backend REST APIs tested
- [ ] Mobile app builds without errors
- [ ] Notifications received on test device
- [ ] Error handling verified
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up
- [ ] Credentials rotated regularly
- [ ] CORS configured for APIs
- [ ] RLS policies tested

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [FCM Guide](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

## Support

For issues or questions:
1. Check the logs in browser/device console
2. Review Firebase Console for errors
3. Verify all environment variables are set
4. Test endpoints with curl/Postman
5. Check database tables have correct schema

Last updated: January 2025
