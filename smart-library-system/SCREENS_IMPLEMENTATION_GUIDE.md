# Complete Screens Implementation Guide

## ✅ Screens Already Implemented with Backend Integration

### 1. LoginScreen ✅
- Imports: `apiClient`, `AsyncStorage`
- Functionality: Real login via `/auth/login` endpoint
- Data: Email/password from form
- State: loading, error
- Result: Token saved to AsyncStorage

### 2. BookSearchScreen ✅
- Imports: `booksService`
- Functionality: Search books from backend
- Services Used: `booksService.searchBooks()`, `booksService.getCategories()`, `booksService.getBooksByCategory()`
- Features: Search, category filter, pagination, refresh
- State: books, categories, loading, refreshing, error, page

### 3. PaymentFinesScreen ✅
- Imports: `paymentsService`
- Functionality: Display and pay fines
- Services Used: `paymentsService.getUserFines()`, `paymentsService.initiatePayment()`, `paymentsService.verifyPayment()`
- Features: Show real fines, payment gateway integration
- State: fines, totalAmount, loading, paying

---

## 📋 Remaining Screens - Implementation Pattern

### Pattern Template for All Remaining Screens

```javascript
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, ScrollView, 
  ActivityIndicator, RefreshControl, Alert, TouchableOpacity
} from 'react-native';
import { serviceNameHere } from '../services';

const ScreenNameScreen = ({ route, navigation }) => {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Fetch function
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await serviceNameHere.functionName();
      setData(result);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text>{error}</Text>
      </View>
    );
  }

  // Render
  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Your UI here */}
    </ScrollView>
  );
};

export default ScreenNameScreen;
```

---

## 🎯 Key Screens to Update

### IssueBooksScreen
**Service**: `issuesService.issueBook()`
**Current State**: Uses old transactionsAPI
**Update**: 
1. Import issuesService
2. Replace book scanning logic with issuesService.issueBook()
3. Handle real transaction response
4. Show success/error feedback

### ReturnBooksScreen
**Service**: `issuesService.returnBook()`
**Current State**: Hardcoded data
**Update**:
1. Import issuesService  
2. Fetch borrowed books from `issuesService.getBorrowedBooks()`
3. Call `issuesService.returnBook(issueId)` on submit
4. Reload list after return

### BookDetailScreen
**Service**: `booksService.getBookDetail()`
**Current State**: Needs creation or update
**Update**:
1. Import booksService
2. Fetch detail from `booksService.getBookDetail(bookId)`
3. Show real book info, reviews, availability
4. Add issue/reserve buttons

### ProfileScreen
**Service**: `userService.getUserProfile()`, `userService.updateUserProfile()`
**Current State**: Likely hardcoded
**Update**:
1. Import userService
2. Load profile on mount
3. Show real user data
4. Implement update functionality

### NotificationsScreen
**Service**: `notificationsService.getNotifications()`
**Current State**: Likely hardcoded
**Update**:
1. Import notificationsService
2. Fetch real notifications
3. Implement mark as read
4. Show notification detail

### SignupScreen
**Service**: `apiClient.post('/auth/register')`
**Current State**: Likely hardcoded or old auth
**Update**:
1. Use apiClient for registration
2. Save tokens to AsyncStorage
3. Proper error handling
4. Navigate to home on success

### ForgotPasswordScreen
**Service**: Direct API calls
**Update**:
1. Call `/auth/forgot-password` endpoint
2. Request OTP
3. Verify OTP
4. Reset password

### OTPScreen
**Service**: Direct API calls
**Update**:
1. Call `/auth/verify-otp` endpoint
2. Handle OTP verification
3. Complete email verification or password reset

---

## 🔧 List of All 26 Screens & Their Updates

| # | Screen Name | Service | Status | Priority |
|---|------------|---------|--------|----------|
| 1 | LoginScreen | apiClient | ✅ Done | 1 |
| 2 | SignupScreen | apiClient | ⏳ Do | 2 |
| 3 | ForgotPasswordScreen | apiClient | ⏳ Do | 3 |
| 4 | OTPScreen | apiClient | ⏳ Do | 4 |
| 5 | PremiumDashboardScreen | Multiple | ✅ Done | 1 |
| 6 | BookSearchScreen | booksService | ✅ Done | 2 |
| 7 | BookDetailScreen | booksService | ⏳ Do | 3 |
| 8 | IssueBooksScreen | issuesService | ⏳ Do | 2 |
| 9 | ReturnBooksScreen | issuesService | ⏳ Do | 2 |
| 10 | ReturnHistoryScreen | issuesService | ⏳ Do | 4 |
| 11 | TransactionHistoryScreen | issuesService | ⏳ Do | 4 |
| 12 | PaymentFinesScreen | paymentsService | ✅ Done | 2 |
| 13 | ProfileScreen | userService | ⏳ Do | 3 |
| 14 | EditPersonalDetailsScreen | userService | ⏳ Do | 3 |
| 15 | SettingsScreen | userService | ⏳ Do | 4 |
| 16 | NotificationsScreen | notificationsService | ⏳ Do | 3 |
| 17 | QRScannerScreen | Direct API | ⏳ Do | 4 |
| 18 | QRScreen | Direct API | ⏳ Do | 4 |
| 19 | PrintPortalScreen | Direct API | ⏳ Do | 4 |
| 20 | FileSharingScreen | Direct API | ⏳ Do | 4 |
| 21 | ContactSupportScreen | userService | ⏳ Do | 4 |
| 22 | AttendanceDashboardScreen | Direct API | ⏳ Do | 4 |
| 23 | BiometricVerificationScreen | Direct API | ⏳ Do | 4 |
| 24 | CampusOverviewScreen | Direct API | ⏳ Do | 4 |
| 25 | IssuanceSuccessScreen | N/A | ✅ Nav | N/A |
| 26 | SuccessConfirmationScreen | N/A | ✅ Nav | N/A |

---

## 📝 Implementation Checklist

For each screen, ensure:
- [ ] Import correct service(s)
- [ ] Initialize state (data, loading, error, refreshing)
- [ ] useEffect with loadData on mount
- [ ] Try-catch error handling
- [ ] Loading state UI
- [ ] Error state UI
- [ ] Refresh functionality
- [ ] Real data display
- [ ] Navigation/actions work
- [ ] Tested with actual backend

---

## 🚀 Quick Start for Each Screen

### Step 1: Import Service
```javascript
import { serviceName } from '../services';
```

### Step 2: Add State
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### Step 3: Fetch Data
```javascript
useEffect(() => {
  const loadData = async () => {
    try {
      const result = await serviceName.methodName();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### Step 4: Handle Loading/Error
```javascript
if (loading) return <ActivityIndicator />;
if (error) return <Text>{error}</Text>;
```

### Step 5: Render Data
```javascript
return (
  <FlatList
    data={data}
    renderItem={({item}) => /* your item UI */}
    keyExtractor={item => item.id}
  />
);
```

---

## 📚 Services Quick Reference

### booksService
```javascript
searchBooks(query, category, page, limit)
getBookDetail(bookId)
getFeaturedBooks(limit)
getBooksByCategory(category, limit)
getCategories()
bookmarkBook(bookId)
getBookmarkedBooks()
checkBookAvailability(bookId)
reserveBook(bookId)
```

### issuesService
```javascript
issueBook(bookId, copyId)
renewBook(issueId)
returnBook(issueId, comments)
getBorrowedBooks(options)
getBorrowingHistory(options)
getOverdueBooks()
reportBookDamage(bookId, damageType, description)
```

### paymentsService
```javascript
getUserFines()
initiatePayment(amount, description)
verifyPayment(paymentId)
getPaymentHistory(options)
getSubscriptionStatus()
upgradeToPremium()
```

### userService
```javascript
getUserProfile()
updateUserProfile(data)
uploadProfilePicture(imageUri)
getUserPreferences()
updateUserPreferences(preferences)
getNotificationSettings()
updateNotificationSettings(settings)
submitSupportTicket(issue)
getSupportTickets()
```

### notificationsService
```javascript
getNotifications(options)
getUrgentNotifications()
getNotificationDetail(id)
markAsRead(id)
markAllAsRead()
deleteNotification(id)
```

---

## ✨ All Screens Now Follow Same Pattern

Every screen should have:
1. ✅ Real data from backend services
2. ✅ Loading state
3. ✅ Error state with retry
4. ✅ Refresh functionality
5. ✅ Proper error handling
6. ✅ User-friendly messages

---

## 🎯 Next Priority Actions

**Phase 1 (Today):**
- [ ] IssueBooksScreen
- [ ] ReturnBooksScreen
- [ ] ProfileScreen

**Phase 2 (Next):**
- [ ] BookDetailScreen
- [ ] NotificationsScreen
- [ ] EditPersonalDetailsScreen

**Phase 3:**
- [ ] Remaining auth screens (Signup, ForgotPassword, OTP)
- [ ] Support/utility screens

**Phase 4:**
- [ ] Advanced features (QR, Biometric, Print, File Sharing)
- [ ] Admin screens

---

## 💡 Tips & Best Practices

1. **Always use try-catch** for API calls
2. **Show loading indicators** while fetching
3. **Display error messages** to users
4. **Implement refresh** on all list screens
5. **Handle empty states** gracefully
6. **Add navigation** on success
7. **Test offline** behavior
8. **Monitor performance** on large lists
9. **Cache data** where appropriate
10. **Validate inputs** before sending

---

## 📊 Integration Status

- **Total Screens**: 26
- **Completed**: 3 (11.5%)
- **In Progress**: 0
- **Ready to Start**: 23 (88.5%)
- **Estimated Time**: 3-4 hours for all remaining screens

---

**All screens are ready to be updated following this pattern. Start with Priority 1 screens, then move to Priority 2 and 3.**
