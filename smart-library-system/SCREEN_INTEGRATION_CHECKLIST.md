# Screen-by-Screen Integration Checklist

## ✅ Already Integrated

### PremiumDashboardScreen
**Status**: ✅ COMPLETE
**Services Used**: issuesService, paymentsService, userService, notificationsService
**Hook**: useDashboardData()
**Data**: Live books, fines, activity, occupancy

---

## 📋 Ready to Integrate (Follow Template Below)

### Template for Each Screen

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { serviceNameHere } from '../services';

export const YourScreenName = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call service
      const result = await serviceNameHere.yourFunction();
      setData(result.items || result.data || []);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <YourComponent item={item} />}
      keyExtractor={item => item.id}
    />
  );
};

export default YourScreenName;
```

---

## 🎯 Authentication Screens

### SignupScreen
**Status**: ⏳ NEEDS INTEGRATION
**Current**: Uses `useRegister()` hook
**Next**: Verify API call goes through apiClient
**Endpoint**: POST `/api/auth/register`
**Service**: `supabaseAuthService.register()`
**Data Flow**: Form → Service → Supabase → AsyncStorage

```javascript
const { register } = useRegister();
const result = await register(email, password, userData);
if (result.success) {
  // Navigate to home
}
```

### LoginScreen  
**Status**: ⏳ NEEDS INTEGRATION
**Current**: Uses `useLogin()` hook
**Next**: Verify API call goes through apiClient
**Endpoint**: POST `/api/auth/login`
**Service**: `supabaseAuthService.login()`
**Data Flow**: Form → Service → Supabase → AsyncStorage

```javascript
const { login } = useLogin();
const result = await login(email, password);
if (result.success) {
  // Navigate to home
}
```

### ForgotPasswordScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `supabaseAuthService.requestPasswordResetOTP()`
**Endpoint**: POST `/api/auth/forgot-password`
**Steps**: 
1. Request OTP
2. Show OTP input
3. Verify OTP
4. Reset password

### OTPScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `supabaseAuthService.verifyPasswordResetOTP()`
**Endpoint**: POST `/api/auth/verify-otp`
**Purpose**: Email verification or password reset

---

## 📚 Book Screens

### BookSearchScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `booksService.searchBooks()`
**Endpoint**: GET `/api/books?search=...&category=...&page=...`

```javascript
import { booksService } from '../services';

const loadBooks = async (query) => {
  const result = await booksService.searchBooks(query, category, page, 10);
  setBooks(result.books);
  setHasMore(result.hasMore);
};

const loadMore = async () => {
  const result = await booksService.searchBooks(query, category, page + 1, 10);
  setBooks([...books, ...result.books]);
  setPage(page + 1);
};
```

### BookDetailScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `booksService.getBookDetail()`
**Endpoint**: GET `/api/books/:id`

```javascript
const [book, setBook] = useState(null);

useEffect(() => {
  const loadBook = async () => {
    const data = await booksService.getBookDetail(bookId);
    setBook(data.book);
  };
  loadBook();
}, [bookId]);
```

### FeaturedBooksScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `booksService.getFeaturedBooks()`
**Endpoint**: GET `/api/books/featured`

```javascript
const loadFeatured = async () => {
  const books = await booksService.getFeaturedBooks(6);
  setBooks(books);
};
```

### BookmarksScreen
**Status**: ⏳ NEEDS INTEGRATION
**Services**: 
- `booksService.getBookmarkedBooks()` - Get list
- `booksService.removeBookmark()` - Remove
**Endpoints**: 
- GET `/api/users/bookmarks`
- DELETE `/api/users/bookmarks/:bookId`

---

## 📤 Issue & Return Screens

### IssueBooks
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `issuesService.issueBook()`
**Endpoint**: POST `/api/transactions/issue`

```javascript
const handleIssueBook = async (bookId, copyId) => {
  try {
    const result = await issuesService.issueBook(bookId, copyId);
    Alert.alert('Success', `Book issued until ${result.dueDate}`);
    // Update UI
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### ReturnBooks
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `issuesService.returnBook()`
**Endpoint**: POST `/api/transactions/return`

```javascript
const handleReturnBook = async (issueId) => {
  try {
    const result = await issuesService.returnBook(issueId);
    Alert.alert('Success', 'Book returned successfully');
    // Refresh list
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### BorrowingHistoryScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `issuesService.getBorrowingHistory()`
**Endpoint**: GET `/api/transactions/my-trans`

```javascript
const loadHistory = async () => {
  const result = await issuesService.getBorrowingHistory({
    page: currentPage,
    limit: 10,
  });
  setTransactions(result.transactions);
};
```

### TransactionHistoryScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `issuesService.getTransactionHistory()`
**Endpoint**: GET `/api/transactions/my-trans`

### OverdueBooks
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `issuesService.getOverdueBooks()`
**Endpoint**: GET `/api/transactions/overdue`

```javascript
const loadOverdue = async () => {
  const result = await issuesService.getOverdueBooks();
  setOverdueBooks(result.books);
};
```

---

## 💰 Payment Screens

### PaymentFinesScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `paymentsService.getUserFines()`
**Endpoint**: GET `/api/payments/fines`

```javascript
const loadFines = async () => {
  const result = await paymentsService.getUserFines();
  setFines(result.fines);
  setTotalAmount(result.totalAmount);
};
```

### PaymentGateway
**Status**: ⏳ NEEDS INTEGRATION
**Services**:
- `paymentsService.initiatePayment()` - Start payment
- `paymentsService.verifyPayment()` - Verify completion
**Endpoints**:
- POST `/api/payments/initiate`
- POST `/api/payments/verify`

```javascript
const handlePayment = async (amount) => {
  try {
    // Initiate payment
    const payment = await paymentsService.initiatePayment(amount);
    
    // Show payment UI / redirect to gateway
    
    // Verify after payment
    const result = await paymentsService.verifyPayment(payment.id);
    if (result.success) {
      Alert.alert('Success', 'Payment completed!');
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### PaymentHistoryScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `paymentsService.getPaymentHistory()`
**Endpoint**: GET `/api/payments/history`

---

## 👤 Profile & Settings

### ProfileScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `userService.getUserProfile()`
**Endpoint**: GET `/api/auth/me`

```javascript
const [profile, setProfile] = useState(null);

useEffect(() => {
  const loadProfile = async () => {
    const data = await userService.getUserProfile();
    setProfile(data.user);
  };
  loadProfile();
}, []);
```

### SettingsScreen
**Status**: ⏳ NEEDS INTEGRATION
**Services**:
- `userService.getUserPreferences()` - Get settings
- `userService.updateUserPreferences()` - Save settings
**Endpoints**:
- GET `/api/users/preferences`
- PUT `/api/users/preferences`

### EditDetailsScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `userService.updateUserProfile()`
**Endpoint**: PUT `/api/auth/update-profile`

```javascript
const handleSaveProfile = async (profileData) => {
  try {
    const result = await userService.updateUserProfile(profileData);
    Alert.alert('Success', 'Profile updated!');
    // Navigate back
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### NotificationSettingsScreen
**Status**: ⏳ NEEDS INTEGRATION
**Services**:
- `userService.getNotificationSettings()` - Get settings
- `userService.updateNotificationSettings()` - Save settings
**Endpoints**:
- GET `/api/users/notification-settings`
- PUT `/api/users/notification-settings`

---

## 🔔 Notification Screens

### NotificationsScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `notificationsService.getNotifications()`
**Endpoint**: GET `/api/notifications`

```javascript
const loadNotifications = async () => {
  const result = await notificationsService.getNotifications({
    page: 1,
    limit: 20,
  });
  setNotifications(result.notifications);
};

const handleMarkAsRead = async (notifId) => {
  await notificationsService.markAsRead(notifId);
  // Update UI
};
```

### NotificationDetailScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `notificationsService.getNotificationDetail()`
**Endpoint**: GET `/api/notifications/:id`

### NotificationActionsScreen
**Status**: ⏳ NEEDS INTEGRATION
**Service**: `notificationsService.performNotificationAction()`
**Endpoint**: POST `/api/notifications/:id/action`

---

## 🎓 Other Screens

### StudentDashboard
**Status**: ⏳ NEEDS INTEGRATION
**Services**: Multiple (books, issues, fines, notifications)
**Suggested**: Use `useDashboardData()` hook like PremiumDashboard

### QRCodeScanner
**Status**: ⏳ NEEDS INTEGRATION
**Service**: Direct API call for attendance
**Endpoint**: POST `/api/qr/scan`

### PrintJobsScreen
**Status**: ⏳ NEEDS INTEGRATION
**Endpoint**: GET `/api/print/my-jobs`

### FileUploaderScreen
**Status**: ⏳ NEEDS INTEGRATION
**Endpoint**: POST `/api/files/upload`

---

## 📊 Integration Statistics

| Category | Count | Integrated |
|----------|-------|-----------|
| Authentication | 4 | 0 ⏳ |
| Books | 4 | 0 ⏳ |
| Issues/Returns | 5 | 0 ⏳ |
| Payments | 3 | 0 ⏳ |
| Profile/Settings | 4 | 0 ⏳ |
| Notifications | 3 | 0 ⏳ |
| Other | 5 | 0 ⏳ |
| **Total** | **28** | **1 ✅** |

---

## 🚀 Priority Integration Order

1. **Authentication Screens** (4) - Users need to login first
2. **Book Screens** (4) - Core functionality
3. **Issue Screens** (3) - Core functionality
4. **Payment Screens** (3) - Important feature
5. **Profile Screens** (4) - User account
6. **Notification Screens** (3) - User engagement
7. **Other Screens** (5) - Nice to have

---

## ✅ Integration Checklist Template

For each screen, follow this checklist:

- [ ] Import service: `import { serviceNameHere } from '../services';`
- [ ] Add state: `const [data, setData] = useState([])`
- [ ] Add useEffect: `useEffect(() => loadData(), [])`
- [ ] Create fetch function with try-catch
- [ ] Handle loading state
- [ ] Handle error state
- [ ] Handle empty state
- [ ] Display data in FlatList/ScrollView
- [ ] Add refresh functionality (swipe-to-refresh)
- [ ] Test on device
- [ ] Handle edge cases (no internet, timeout, etc.)

---

**Start with authentication, then work down the priority list!**

