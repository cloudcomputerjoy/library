# Firebase FCM Integration - Setup Checklist

Complete checklist for setting up Firebase Cloud Messaging in your Smart Library app.

---

## 🔴 Phase 1: Firebase Project Setup

### Create Firebase Project
- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Click "Create a new project"
- [ ] Enter project name (e.g., "Smart Library")
- [ ] Accept terms and create project
- [ ] Wait for project initialization (2-3 minutes)

### Generate Service Account
- [ ] In Firebase Console, go to **Project Settings**
- [ ] Click **Service Accounts** tab
- [ ] Click **Generate New Private Key**
- [ ] Save the JSON file to a secure location
  ```
  File should contain:
  - type: "service_account"
  - project_id: "your-project"
  - private_key: "-----BEGIN PRIVATE KEY-----..."
  - client_email: "firebase-adminsdk-xxxxx@..."
  ```

### Get Firebase Web Configuration
- [ ] In Firebase Console, find **Your apps** section
- [ ] Click the Web app (create one if needed)
- [ ] Copy the firebase config object:
  ```javascript
  {
    "apiKey": "AIzaSyD...",
    "authDomain": "smart-library-xxxxx.firebaseapp.com",
    "projectId": "smart-library-xxxxx",
    "storageBucket": "smart-library-xxxxx.appspot.com",
    "messagingSenderId": "123456789012",
    "appId": "1:123456789012:web:abcdefg"
  }
  ```

### Get VAPID Key (Optional, for Web Push)
- [ ] Go to **Project Settings** → **Cloud Messaging** tab
- [ ] Under "Web Push certificates", click **Generate Key Pair**
- [ ] Copy the public VAPID key

---

## 🟡 Phase 2: Backend Configuration

### Install Dependencies
- [ ] Navigate to backend folder: `cd backend`
- [ ] Install Firebase: `npm install firebase-admin`
- [ ] Verify installation: `npm list firebase-admin`

### Set Environment Variables
- [ ] Copy service account JSON to backend folder:
  ```bash
  cp /path/to/firebase-service-account.json ./firebase-service-account.json
  ```
- [ ] Update `.env` file in backend:
  ```env
  FIREBASE_CREDENTIALS_PATH=/absolute/path/to/firebase-service-account.json
  # OR
  # FIREBASE_PROJECT_ID=your-project-id
  # FIREBASE_PRIVATE_KEY_ID=xxxxx
  # FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  # FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
  ```
- [ ] **Important**: Add `.gitignore` entry:
  ```
  echo "firebase-service-account.json" >> backend/.gitignore
  ```

### Create Database Tables
**Option A: Using Supabase SQL Editor**
- [ ] Open [Supabase SQL Editor](https://supabase.com/dashboard)
- [ ] Navigate to your project
- [ ] Open **SQL Editor**
- [ ] Click **New Query**
- [ ] Copy-paste content from `backend/migrations/001_create_fcm_tables.sql`
- [ ] Click **Run**
- [ ] Verify: No errors and all 4 tables created

**Option B: Using psql (PostgreSQL CLI)**
- [ ] Get database connection string from Supabase
- [ ] Run migration:
  ```bash
  psql "your-connection-string" < backend/migrations/001_create_fcm_tables.sql
  ```
- [ ] Verify tables created

### Start Backend Server
- [ ] In backend folder: `npm run dev`
- [ ] Look for logs:
  ```
  ✅ Firebase initialized
  ✅ Server listening on port 5000
  ```
- [ ] Test health endpoint:
  ```bash
  curl http://localhost:5000/health
  ```

---

## 🟢 Phase 3: Mobile App Configuration

### Install Dependencies
- [ ] Navigate to mobile folder: `cd mobile`
- [ ] Install packages:
  ```bash
  npm install
  # or
  yarn install
  ```
- [ ] Verify Firebase packages installed:
  ```bash
  npm list @react-native-firebase/app @react-native-firebase/messaging
  ```

### Set Environment Variables
- [ ] Create/update `.env` file in mobile folder:
  ```env
  EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
  EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
  EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
  EXPO_PUBLIC_API_URL=http://your-backend-ip:5000/api
  ```

### Configure app.json (Optional, recommended)
- [ ] Update `mobile/app.json`:
  ```json
  {
    "expo": {
      "plugins": [
        ["@react-native-firebase/app", {}],
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

### Build and Run
- [ ] Start development server:
  ```bash
  npm start
  # or
  npm run android  # for Android
  npm run ios      # for iOS
  ```
- [ ] Select platform when prompted
- [ ] Wait for app to load
- [ ] Check console for:
  ```
  ✅ Firebase initialized
  ✅ FCM Token obtained: ...
  ✅ Push notifications initialized
  ```

---

## 🔵 Phase 4: Testing & Verification

### Test 1: Token Registration

**Get Your JWT Token**
- [ ] Log in to the app
- [ ] Get JWT token from AsyncStorage (dev tools) or login response

**Register Token**
- [ ] Run this command:
  ```bash
  curl -X POST http://localhost:5000/api/fcm/register-token \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "fcmToken": "YOUR_DEVICE_FCM_TOKEN",
      "deviceInfo": "Test Device",
      "platform": "android"
    }'
  ```
- [ ] Should get response:
  ```json
  {
    "success": true,
    "message": "FCM token registered"
  }
  ```

**Verify in Database**
- [ ] In Supabase SQL Editor, run:
  ```sql
  SELECT * FROM fcm_tokens LIMIT 1;
  ```
- [ ] Should see the token you just registered

### Test 2: Send Test Notification

- [ ] Run:
  ```bash
  curl -X POST http://localhost:5000/api/fcm/send-test \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json"
  ```
- [ ] Should get response with success count
- [ ] **Check your device** - you should see notification!
- [ ] Notification should say:
  ```
  Title: 📬 Test Notification
  Body: This is a test notification from Smart Library
  ```

### Test 3: Notification History

- [ ] Run:
  ```bash
  curl -X GET http://localhost:5000/api/fcm/history \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```
- [ ] Should see test notification in response

### Test 4: Preferences Management

- [ ] Get preferences:
  ```bash
  curl -X GET http://localhost:5000/api/fcm/preferences \
    -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```
- [ ] Should return default preferences

- [ ] Update preferences:
  ```bash
  curl -X PUT http://localhost:5000/api/fcm/preferences \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "due_date_reminders": false,
      "push_notifications_enabled": true
    }'
  ```
- [ ] Should return updated preferences

### Test 5: Topic Subscription

- [ ] Subscribe to topic:
  ```bash
  curl -X POST http://localhost:5000/api/fcm/subscribe-topic \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "topic": "library_announcements"
    }'
  ```
- [ ] Should get success response

- [ ] Verify in database:
  ```sql
  SELECT * FROM topic_subscriptions;
  ```

---

## 🟣 Phase 5: Integration with Existing Features

### Integrate with Book Issue
- [ ] In `src/controllers/issueController.js`:
  ```javascript
  const fcmService = require('../services/fcmService');
  
  // After issuing book
  await fcmService.sendNotificationToUser(userId, {
    title: '📚 Book Issued',
    body: `${bookTitle} has been issued`
  }, { type: 'issue' });
  ```

### Integrate with Overdue Reminders
- [ ] Create cron job in `src/services/reminderService.js`
- [ ] Use `fcmService.sendNotificationToUsers()` for bulk sending
- [ ] Schedule to run daily using `node-cron`

### Integrate with Fine Notifications
- [ ] In fine generation code, send notification:
  ```javascript
  await fcmService.sendNotificationToUser(userId, {
    title: '💰 Fine Generated',
    body: `Fine of ₹${amount} added`
  }, { type: 'fine' });
  ```

### Send Announcements via Topic
- [ ] In admin controller:
  ```javascript
  await fcmService.sendNotificationToTopic('library_announcements', {
    title: '📢 Announcement',
    body: announcementText
  });
  ```

---

## 📋 Final Verification Checklist

### Backend
- [ ] `firebase-admin` package installed
- [ ] `FIREBASE_CREDENTIALS_PATH` in `.env`
- [ ] Database tables created successfully
- [ ] Server logs show `✅ Firebase initialized`
- [ ] Health endpoint returns 200 OK
- [ ] FCM routes accessible at `/api/fcm/*`

### Mobile
- [ ] Firebase packages installed
- [ ] Firebase config in `.env`
- [ ] App starts without Firebase errors
- [ ] Notification permission requested
- [ ] FCM token obtained and logged
- [ ] App logs show `✅ Push notifications initialized`

### Testing
- [ ] Test notification sent successfully
- [ ] Notification received on device
- [ ] Token appears in database
- [ ] Notification appears in history
- [ ] Preferences can be updated
- [ ] Topics can be subscribed
- [ ] All API endpoints respond correctly

---

## ⚠️ Common Issues During Setup

### Firebase Not Initializing
**Solution**: Check `.env` file has correct `FIREBASE_CREDENTIALS_PATH`

### "firebase-admin not found"
**Solution**: Run `npm install firebase-admin` in backend folder

### "Permission denied" for migration
**Solution**: Use `DISABLE_CONFIRM_WARNINGS=true` or run in Supabase SQL editor

### Tables not created
**Solution**: Check SQL editor for error messages, run migration again

### Device not receiving notifications
**Solution**: 
1. Check notification permissions on device
2. Verify token in `fcm_tokens` table is active
3. Check `sent_notifications` success count

### "No active FCM tokens found"
**Solution**: Token registration failed, check test 1 above

---

## 📞 Need Help?

1. Check **FIREBASE_FCM_INTEGRATION.md** for detailed docs
2. Check **FIREBASE_QUICK_START.md** for examples
3. Review **Troubleshooting** section in full documentation
4. Check backend logs: `npm run dev`
5. Check mobile console: Look for Firebase-related logs
6. Check Supabase: Verify tables exist in SQL Editor

---

## ✅ Success Indicators

When everything is working:
- ✅ Backend logs show Firebase initialized
- ✅ Mobile app logs show push notifications initialized
- ✅ Test notification received within 5 seconds
- ✅ All database tables populated with data
- ✅ API endpoints return success responses
- ✅ No authentication errors in logs

---

**Date Started**: ___________  
**Date Completed**: ___________  
**Tested By**: ___________  

Good luck! 🚀
