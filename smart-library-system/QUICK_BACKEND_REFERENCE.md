# Backend Connection - Quick Start Reference

## ✅ What's Connected

| Component | Status | How to Use |
|-----------|--------|-----------|
| **Database** | ✅ Supabase PostgreSQL | API calls handle it automatically |
| **Backend** | ✅ Express.js (port 5000) | Available at `http://localhost:5000/api` |
| **Authentication** | ✅ JWT + Refresh tokens | Auto-managed by auth service |
| **Dashboard** | ✅ LIVE DATA | Shows real books, fines, activity |
| **Services** | ✅ 75+ functions | Import and use directly |

---

## 🚀 Quick Code Snippets

### 1️⃣ Get Borrowed Books
```javascript
import { issuesService } from '../services';

const books = await issuesService.getBorrowedBooks();
// Returns: { books: [...], pagination: {...} }
```

### 2️⃣ Search Books
```javascript
import { booksService } from '../services';

const result = await booksService.searchBooks(
  'JavaScript',    // query
  'programming',   // category
  1,              // page
  10              // limit
);
// Returns: { books: [...], totalCount: 42, hasMore: true }
```

### 3️⃣ Issue a Book
```javascript
import { issuesService } from '../services';

const result = await issuesService.issueBook(
  'book_id_123',  // bookId
  'copy_id_456'   // copyId
);
// Returns: { success: true, issue: {...}, dueDate: '...' }
```

### 4️⃣ Get User Fines
```javascript
import { paymentsService } from '../services';

const fines = await paymentsService.getUserFines();
// Returns: { fines: [...], totalAmount: 500 }
```

### 5️⃣ Get User Profile
```javascript
import { userService } from '../services';

const profile = await userService.getUserProfile();
// Returns: { user: {...}, stats: {...} }
```

### 6️⃣ Get Notifications
```javascript
import { notificationsService } from '../services';

const notifications = await notificationsService.getNotifications();
// Returns: { notifications: [...] }
```

### 7️⃣ Use Dashboard Hook
```javascript
import { useDashboardData } from '../hooks/useDashboardData';

const { 
  borrowedBooks,
  dueBooks, 
  pendingFines,
  loading,
  refetch 
} = useDashboardData();

// Data is already fetched, loading shows loading state
// Call refetch() to refresh
```

---

## 🔄 Error Handling Pattern

```javascript
try {
  const result = await booksService.searchBooks('fiction');
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  // Error is automatically handled and message is friendly
}
```

---

## 📱 In a React Component

```javascript
import React, { useState, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { booksService } from '../services';

export const MyBooksScreen = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const result = await booksService.searchBooks('fiction');
      setBooks(result.books);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <FlatList
      data={books}
      renderItem={({ item }) => <Text>{item.title}</Text>}
      keyExtractor={item => item.id}
    />
  );
};
```

---

## 📊 All Available Services

### Books
- `searchBooks(query, category, page, limit)`
- `getBookDetail(bookId)`
- `getFeaturedBooks(limit)`
- `getBooksByCategory(category, limit)`
- `getCategories()`
- `bookmarkBook(bookId)`
- `removeBookmark(bookId)`
- `getBookmarkedBooks()`
- `checkBookAvailability(bookId)`
- `reserveBook(bookId)`
- `getReservations()`
- `cancelReservation(reservationId)`

### Issues & Returns
- `issueBook(bookId, copyId)`
- `renewBook(issueId)`
- `returnBook(issueId, comments)`
- `reportBookDamage(bookId, damageType, description)`
- `getBorrowedBooks(options)`
- `getBorrowingHistory(options)`
- `getTransactionHistory(options)`
- `getOverdueBooks()`
- `getIssueDetail(issueId)`
- `returnMultipleBooks(issueIds)`
- `issueBulkBooks(bookIds)`
- `getIssuingStats()`

### Payments
- `getUserFines()`
- `getFinDetail(fineId)`
- `waiveFine(fineId, reason)`
- `initiatePayment(amount, description)`
- `verifyPayment(paymentId)`
- `getPaymentHistory(options)`
- `getReceipt(paymentId)`
- `downloadReceiptPDF(paymentId)`
- `getSubscriptionStatus()`
- `upgradeToPremium()`
- `cancelSubscription()`
- `getPaymentMethods()`
- `addPaymentMethod(details)`
- `removePaymentMethod(methodId)`

### Users
- `getUserProfile()`
- `updateUserProfile(data)`
- `uploadProfilePicture(imageUri)`
- `getUserStats()`
- `getUserPreferences()`
- `updateUserPreferences(preferences)`
- `getNotificationSettings()`
- `updateNotificationSettings(settings)`
- `getContacts()`
- `addEmergencyContact(contact)`
- `submitSupportTicket(issue)`
- `getSupportTickets()`
- `getAchievements()`
- `getTrustScore()`
- `registerDeviceForNotifications(token)`
- `getActiveSessions()`
- `logoutSession(deviceId)`
- `logoutAllSessions()`
- `requestAccountDeletion(reason)`
- `downloadUserData()`

### Notifications
- `getNotifications(options)`
- `getUrgentNotifications(options)`
- `getNotificationDetail(notificationId)`
- `markAsRead(notificationId)`
- `markAllAsRead()`
- `markAsUnread(notificationId)`
- `deleteNotification(notificationId)`
- `deleteAllNotifications()`
- `clearOldNotifications(daysOld)`
- `getNotificationsByType(type, options)`
- `getNotificationStats()`
- `performNotificationAction(notificationId, action)`
- `archiveNotification(notificationId)`
- `snoozeNotification(notificationId, snoozeUntil)`
- `subscribeToNotifications(filters)`

---

## 🔐 Authentication

```javascript
import { useAuth, useLogin } from '../hooks/useAuth';

// Get auth state
const { user, isAuthenticated } = useAuth();

// Handle login
const { login, isLoggingIn } = useLogin();
const result = await login(email, password);

// Tokens are automatically managed
// No need to parse JWT or handle refresh manually
```

---

## 🆘 If Something's Not Working

### Backend Not Running?
```bash
cd smart-library-system/backend
npm start
# Should see: Server running on port 5000
```

### API URL Wrong?
```javascript
// Check in mobile/src/config/env.js
// Should be: http://localhost:5000/api (for local development)
// Or your server IP if on different machine
```

### Tokens Expired?
```javascript
// Automatic refresh handled!
// But if issues persist:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
// Force re-login
```

### Data Not Updating?
```javascript
// Manual refresh (if using hook)
const { refetch } = useDashboardData();
await refetch();
```

---

## 📄 Documentation Files
- **BACKEND_DATABASE_CONNECTION_COMPLETE.md** - Full integration guide
- **SUPABASE_FRONTEND_INTEGRATION.md** - Detailed architecture
- **FRONTEND_QUICK_REFERENCE.md** - Copy-paste examples

---

## ✨ Done!

Your app is now connected to the backend and database. Just import services and start building!

**Import pattern:**
```javascript
import { booksService, issuesService, paymentsService, userService, notificationsService } from '../services';
```

**That's it! Everything else is automatic.**
