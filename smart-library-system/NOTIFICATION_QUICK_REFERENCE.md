# 🚀 Notification System - Quick Reference Guide

## One-Minute Overview

**Smart Library now has automatic notifications for:**
1. ✅ **Book Issuance** - Email + Firebase + Real-time (immediate)
2. ✅ **Due Date Reminders** - Email + Firebase (3 days before)
3. ✅ **Book Returns** - Email + Firebase (already existing)

---

## 📍 Key Files

| Purpose | File | Lines |
|---------|------|-------|
| Issue notifications | `issueNotificationService.js` | 250+ |
| Due date reminders | `dueDateReminderService.js` | 350+ |
| Success screen | `IssuanceSuccessScreen.js` | 500+ |
| Scheduled task | `due-date-reminder/index.ts` | 150+ |
| Documentation | `NOTIFICATION_SYSTEM_GUIDE.md` | 400+ |

---

## ⚡ Quick Start (5 Steps)

### Step 1: Add Environment Variables
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FIREBASE_ADMIN_TOKEN=...
REMINDER_CRON_TOKEN=secret
```

### Step 2: Deploy Edge Function
```bash
supabase functions deploy due-date-reminder --no-verify-jwt
```

### Step 3: Create Cron Job (Supabase Dashboard)
- Endpoint: `due-date-reminder`
- Frequency: Daily 08:00 UTC
- Auth: Bearer token

### Step 4: Create Database Table
Run SQL from `NOTIFICATION_SYSTEM_GUIDE.md`

### Step 5: Test
Issue books → Check for email/push/real-time

---

## 🎯 What Happens When

### Book Issuance (Immediate)
```
Admin issues books
    ↓
Email sent (2-5 sec)
    ↓
Firebase alert (<1 sec)
    ↓
Real-time event (if in-app)
    ↓
Success screen shows
```

### Daily at 8 AM UTC
```
Supabase cron triggers
    ↓
Find books due in 3 days
    ↓
For each student:
  - Send email reminder
  - Send Firebase alert
  - Log in database
    ↓
Complete
```

---

## 📧 Email Templates

### Issuance Email
- Subject: ✅ Book Issuance Confirmation
- Shows: Books, ISBN, due date, late fees
- CTA: "View My Books"

### Reminder Email
- Subject: ⏰ Reminder: Books Due Soon
- Shows: Days left, books, renewal policy
- CTA: "View & Renew Books"

---

## 📱 Mobile Integration

### In-App Real-time
```javascript
// Automatically listens
socketService.onIssuanceSuccess(userId, (data) => {
  console.log('Books issued:', data);
});

// Success screen shows with:
// - Issued books
// - Due date
// - Next steps
// - Animated success
```

### Offline
- Firebase notification arrives
- Email sent
- User opens app later
- Success screen displays

---

## 🔍 Monitoring

### Check Email Delivery
```sql
SELECT * FROM reminder_logs 
WHERE email_sent = true 
ORDER BY sent_at DESC;
```

### Check Firebase Status
```sql
SELECT * FROM reminder_logs 
WHERE firebase_sent = true 
ORDER BY sent_at DESC;
```

### Check Duplicates
```sql
SELECT user_id, COUNT(*) as count
FROM reminder_logs
WHERE sent_at >= NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 1;
```

---

## ✅ Status Checks

### Verify Installation
1. [ ] issueNotificationService.js exists
2. [ ] dueDateReminderService.js exists  
3. [ ] IssuanceSuccessScreen.js exists
4. [ ] Edge function deployed
5. [ ] Cron job created
6. [ ] reminder_logs table created

### Test Notifications
1. [ ] Issue books → Email received?
2. [ ] Issue books → Firebase alert?
3. [ ] Issue books → Real-time screen?
4. [ ] Manually run Edge Function → Works?
5. [ ] Check reminder_logs → Entries logged?

---

## 🐛 Quick Fixes

**Email not working?**
- Check SMTP credentials in .env
- Test with: `node testEmail.js`

**Firebase not working?**
- Verify Firebase project ID
- Check user has FCM token
- Inspect function logs

**Real-time not working?**
- Verify Socket.IO server running
- Check client socket URL
- Test with browser DevTools

**Reminders not sending?**
- Check Edge Function deployed
- Verify cron job enabled
- Manually test endpoint

---

## 📞 Quick Links

| Topic | File |
|-------|------|
| Full Setup | NOTIFICATION_SYSTEM_GUIDE.md |
| Summary | NOTIFICATION_IMPLEMENTATION_SUMMARY.md |
| Services | backend/src/services/issue* |
| Mobile | mobile/src/screens/IssuanceSuccess* |
| Database | reminder_logs table SQL |

---

## 📊 System Overview

```
User Issues Books
        ↓
    ┌───────────────────────┐
    │  3 Notifications Sent │
    ├───────────────────────┤
    │ 1. Email (SMTP)       │
    │ 2. Firebase (FCM)     │
    │ 3. Real-time (Socket) │
    └───────────────────────┘
        ↓
    Success Screen Shows
        ↓
Daily @ 8 AM UTC
        ↓
    ┌──────────────────────┐
    │  Reminders Sent      │
    │ (3 days before due)  │
    └──────────────────────┘
```

---

## ✨ Features

✅ Professional HTML emails  
✅ Instant mobile push notifications  
✅ Real-time in-app updates  
✅ Automatic scheduled reminders  
✅ Duplicate prevention  
✅ Full audit logging  
✅ Error handling & retries  
✅ Fallback mechanisms  

---

**Last Updated:** April 14, 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0.0
