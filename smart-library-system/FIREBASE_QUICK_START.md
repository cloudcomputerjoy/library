# Firebase FCM Integration - Quick Start Guide

Complete step-by-step guide to integrate Firebase Cloud Messaging for push notifications.

## Before You Start

Ensure you have:
- Firebase project created
- Service account JSON downloaded
- Backend dependencies installed (`firebase-admin`)
- Mobile dependencies installed
- Supabase database access

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Backend Setup

#### 1.1 Add Firebase Credentials
Create `.env` in `backend/` directory:

```env
# Option 1: Using credentials file
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json

# OR Option 2: Using individual variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

#### 1.2 Run Database Migration
Execute this SQL in Supabase SQL Editor:

See [001_create_fcm_tables.sql](./backend/migrations/001_create_fcm_tables.sql)

Or with psql:
```bash
psql -h your-db-host -U user -d database -f backend/migrations/001_create_fcm_tables.sql
```

#### 1.3 Start Backend
```bash
cd backend
npm install firebase-admin
npm run dev
```

Check logs for: `✅ Firebase initialized`

### Step 2: Mobile App Setup

#### 2.1 Add Firebase Config
Update `.env` in `mobile/` directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
```

#### 2.2 Install Dependencies
```bash
cd mobile
npm install
```

#### 2.3 Run App
```bash
npm start
# Then select: android / ios / web
```

Check logs for:
- `✅ Firebase initialized`
- `✅ FCM Token obtained: ...`
- `✅ Push notifications initialized`

---

## 📤 Testing Push Notifications

### Test 1: Register Token

```bash
# Get your JWT token first, then:
curl -X POST http://localhost:5000/api/fcm/register-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "YOUR_DEVICE_FCM_TOKEN",
    "deviceInfo": "Test Device",
    "platform": "android"
  }'
```

### Test 2: Send Test Notification

```bash
curl -X POST http://localhost:5000/api/fcm/send-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

You should receive a notification on your device!

### Test 3: Send Via Topic

```javascript
// In backend code:
const fcmService = require('./src/services/fcmService');

await fcmService.sendNotificationToTopic(
  'library_announcements',
  {
    title: 'Library Notice',
    body: 'Library will close early today'
  }
);
```

---

## 🔗 Using in Existing Flows

### In Controllers

Send notification when book is issued:

```javascript
const fcmService = require('../services/fcmService');

// In issueController.js
exports.issueBook = async (req, res) => {
  try {
    // ... issue book logic ...
    
    // Send notification
    await fcmService.sendNotificationToUser(
      userId,
      {
        title: '📚 Book Issued',
        body: `${bookTitle} has been issued to you`
      },
      {
        type: 'issue',
        bookId: book.id,
        transactionId: transaction.id
      }
    );
    
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Send Overdue Reminders (Cron Job)

```javascript
// In server.js or a cron service:
const cron = require('node-cron');
const fcmService = require('./src/services/fcmService');
const { supabase } = require('./src/config/database');

// Run daily at 10 AM
cron.schedule('0 10 * * *', async () => {
  try {
    // Get users with overdue books
    const { data: overdueUsers } = await supabase
      .from('transactions')
      .select('user_id,book:books(title)')
      .lt('due_date', new Date())
      .eq('return_date', null);
    
    // Send notification to each user
    for (const user of overdueUsers) {
      await fcmService.sendNotificationToUser(
        user.user_id,
        {
          title: '⚠️ Overdue Books',
          body: `Book "${user.book.title}" is overdue`
        },
        { type: 'overdue' }
      );
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});
```

### Send Fine Notifications

```javascript
// When fine is created/updated
await fcmService.sendNotificationToUser(
  userId,
  {
    title: '💰 Fine Generated',
    body: `Fine of ₹${amount} has been added`
  },
  {
    type: 'fine',
    amount: amount,
    fineId: fine.id
  }
);
```

---

## 📱 Frontend Integration Examples

### Subscribe to Topic

```javascript
// In Settings screen
import { subscribeToTopic } from '../services/firebaseNotification';

const handleLibraryAnnouncements = async (enabled) => {
  if (enabled) {
    await subscribeToTopic('library_announcements');
  } else {
    await unsubscribeFromTopic('library_announcements');
  }
};
```

### Update Preferences

```javascript
import { updateNotificationPreferences } from '../services/firebaseNotification';

const handleDueReminderToggle = async (enabled) => {
  await updateNotificationPreferences({
    due_date_reminders: enabled
  });
};
```

### View Notification History

```javascript
import { getNotificationHistory } from '../services/firebaseNotification';

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const loadHistory = async () => {
      const history = await getNotificationHistory(20, 0);
      setNotifications(history);
    };
    loadHistory();
  }, []);
  
  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>{item.body}</Text>
        </View>
      )}
    />
  );
};
```

---

## 🔧 Configuration Options

### Notification Types (for filtering)
- `due_reminder` - Book due soon
- `overdue` - Book is overdue
- `fine` - Fine generated
- `issue` - Book issued
- `return` - Book returned
- `book_available` - Reserved book available
- `announcement` - General announcement
- `test` - Test notification

### Topics (for subscriptions)
- `library_announcements` - General announcements
- `book_available` - Reserved book notifications
- `maintenance` - Maintenance updates
- `events` - Library events

### Notification Preferences
```javascript
{
  push_notifications_enabled: boolean,
  due_date_reminders: boolean,
  overdue_notifications: boolean,
  fine_notifications: boolean,
  system_announcements: boolean,
  email_notifications: boolean,
  sms_notifications: boolean,
  quiet_hours_enabled: boolean,
  quiet_hours_start: "22:00",  // HH:mm
  quiet_hours_end: "08:00"     // HH:mm
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "No active FCM tokens found"
**Cause**: User hasn't registered a device yet
**Solution**: Token is automatically registered on first login with proper permissions

### Issue: "Firebase credentials not configured"
**Cause**: Environment variables not set
**Solution**: Add `FIREBASE_CREDENTIALS_PATH` or individual Firebase variables to `.env`

### Issue: Notifications not appearing
**Cause**: User disabled notifications in preferences
**Solution**: Check `notification_preferences` table and have user enable in app settings

### Issue: "Invalid FCM Token"
**Cause**: Token expired or invalid
**Solution**: App automatically refreshes and re-registers token

---

## 📊 Monitoring

### Check Registered Tokens
```sql
SELECT COUNT(*) as active_tokens
FROM fcm_tokens
WHERE is_active = true AND last_seen > now() - interval '24 hours';
```

### View Recent Notifications
```sql
SELECT user_id, title, notification_type, created_at
FROM sent_notifications
WHERE created_at > now() - interval '1 day'
ORDER BY created_at DESC;
```

### Check Failure Rates
```sql
SELECT 
  notification_type,
  COUNT(*) as total,
  SUM(CASE WHEN fcm_failure_count > 0 THEN 1 ELSE 0 END) as failures,
  ROUND(100.0 * SUM(fcm_failure_count) / SUM(fcm_success_count + fcm_failure_count), 2) as failure_rate
FROM sent_notifications
WHERE created_at > now() - interval '7 days'
GROUP BY notification_type;
```

---

## 🔐 Security Notes

1. **Credentials**: Never commit Firebase credentials to git
2. **JWT Tokens**: Include in Authorization header for all API calls
3. **RLS Policies**: Database uses Row-Level Security to restrict access
4. **Tokens**: FCM tokens are unique per device and don't need additional encryption
5. **Sensitive Data**: Don't include sensitive data in notification body

---

## 📚 Full Documentation

See [FIREBASE_FCM_INTEGRATION.md](./FIREBASE_FCM_INTEGRATION.md) for:
- Complete setup instructions
- All API endpoints with examples
- Database schema details
- Advanced configuration
- Troubleshooting guide

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend logs show "✅ Firebase initialized"
- [ ] Mobile app requests notification permission
- [ ] FCM token appears in backend logs
- [ ] Test notification received on device
- [ ] Database tables exist and have data
- [ ] API endpoints respond correctly
- [ ] Preferences can be updated
- [ ] Topics can be subscribed/unsubscribed
- [ ] Notification history shows in database

---

## Next Steps

1. **Integrate with existing flows**: Add notifications to issue/return/fine events
2. **Set up scheduled tasks**: Cron jobs for due date reminders and overdue notifications
3. **Enhance UI**: Add notification center and preference screen
4. **Test thoroughly**: Verify on multiple devices
5. **Monitor**: Track delivery rates and user engagement

---

Need help? Check the troubleshooting section in the full documentation or review the logs!
