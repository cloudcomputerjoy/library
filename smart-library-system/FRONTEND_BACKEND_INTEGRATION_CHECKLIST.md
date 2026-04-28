# Frontend-Supabase Integration Checklist

**Status:** ✅ Ready for Implementation

**Last Updated:** April 17, 2026

---

## Pre-Integration Checks

- [ ] Backend server running on `http://localhost:5000` or configured URL
- [ ] Supabase project created and tables initialized
- [ ] Firebase credentials configured (for push notifications)
- [ ] Environment variables set in `.env` files (backend + mobile)
- [ ] All backend API endpoints tested with Postman/curl

---

## Phase 1: Authentication Integration

### 1.1 Sign-Up Screen
**File:** `mobile/src/screens/SignupScreen.js`

- [ ] Import auth hook: `import { useRegister } from '../hooks/useAuth';`
- [ ] Validate email domain against allowed institutions
- [ ] Validate phone number (11 digits for Bangladesh)
- [ ] Call `register()` on form submit
- [ ] Store auth token in AsyncStorage on success
- [ ] Navigate to login or home screen after registration

**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@aaub.edu.bd",
    "password": "SecurePass123",
    "firstName": "Ahmed",
    "lastName": "Khan",
    "phone": "01700000000",
    "studentId": "ST-2024-001"
  }'
```

### 1.2 Login Screen
**File:** `mobile/src/screens/LoginScreen.js`

- [ ] Import auth hook: `import { useLogin } from '../hooks/useAuth';`
- [ ] Validate email and password
- [ ] Call `login()` with credentials
- [ ] Store tokens in AsyncStorage
- [ ] Redirect to home screen on success
- [ ] Show error message on failure

**Test:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@aaub.edu.bd",
    "password": "SecurePass123"
  }'
```

### 1.3 Password Reset (ForgotPasswordScreen)
**File:** `mobile/src/screens/ForgotPasswordScreen.js`

- [ ] Call `resetPassword(email)` from auth service
- [ ] Show email sent confirmation
- [ ] Route to OTP verification screen
- [ ] Allow password update with OTP

---

## Phase 2: Book Operations

### 2.1 Book Search Screen
**File:** `mobile/src/screens/BookSearchScreen.js`

Currently has hardcoded books. Update to:

```javascript
import { booksService } from '../services';

const [books, setBooks] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const result = await booksService.searchBooks(
        searchQuery,
        selectedCategory,
        currentPage,
        10
      );
      setBooks(result.books);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };
  
  fetchBooks();
}, [searchQuery, selectedCategory, currentPage]);
```

**Checklist:**
- [ ] Replace hardcoded books with API call
- [ ] Implement pagination
- [ ] Add loading state
- [ ] Handle errors gracefully
- [ ] Add category filtering
- [ ] Implement search debouncing (300ms)

### 2.2 Book Detail Screen
**File:** `mobile/src/screens/BookDetailScreen.js`

```javascript
import { booksService, issuesService } from '../services';

useEffect(() => {
  const loadBook = async () => {
    try {
      const bookData = await booksService.getBookDetail(bookId);
      setBook(bookData.book);
      setAvailability(bookData.availability);
    } catch (error) {
      Alert.alert('Error', 'Failed to load book');
    }
  };
  
  loadBook();
}, [bookId]);

const handleBorrow = async () => {
  try {
    const result = await issuesService.issueBook(book.id);
    Alert.alert('Success', `Book issued! Due: ${result.dueDate}`);
    navigation.navigate('IssuedBooks');
  } catch (error) {
    Alert.alert('Error', error.response?.data?.message);
  }
};
```

**Checklist:**
- [ ] Fetch book details from API
- [ ] Show availability status
- [ ] Handle "Out of Stock" state
- [ ] Implement "Borrow" button to issue book
- [ ] Add to bookmarks functionality
- [ ] Show QR code or ISBN for reference

### 2.3 Book Details Fixed Nav (If Different Screen)
**File:** `mobile/src/screens/book_details_fixed_nav/code.js` (from allui)

- [ ] Connect to `booksService` for data
- [ ] Implement borrow functionality via `issuesService`
- [ ] Update booking/reservation flow

---

## Phase 3: Issue & Return Operations

### 3.1 Issue Books Screen
**File:** `mobile/src/screens/IssueBooks.js`

```javascript
import { issuesService } from '../services';

const handleIssueBook = async () => {
  try {
    const result = await issuesService.issueBook(bookId, copyId);
    showSuccessConfirmation(result);
    // Show confirmation screen with details
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

useEffect(() => {
  const loadStats = async () => {
    const stats = await issuesService.getIssuingStats();
    setStats(stats);
  };
  loadStats();
}, []);
```

**Checklist:**
- [ ] Fetch borrowed books list
- [ ] Show current borrow count
- [ ] Display overdue books
- [ ] Show fine amount
- [ ] Implement issue flow with confirmation

### 3.2 Return Books Screen
**File:** `mobile/src/screens/ReturnBooksScreen.js`

```javascript
import { issuesService } from '../services';

const handleReturnBook = async (issueId) => {
  try {
    const result = await issuesService.returnBook(issueId, 'good');
    Alert.alert('Success', 'Book returned successfully');
    refreshBorrowedBooks();
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

useEffect(() => {
  const loadBorrowedBooks = async () => {
    const borrowed = await issuesService.getBorrowedBooks();
    setBorrowedBooks(borrowed);
  };
  loadBorrowedBooks();
}, []);
```

**Checklist:**
- [ ] List currently borrowed books
- [ ] Show due dates and overdue status
- [ ] Implement return button
- [ ] Capture book condition (good/damaged/lost)
- [ ] Show return confirmation
- [ ] Update book list after return

### 3.3 Transaction History Screen
**File:** `mobile/src/screens/TransactionHistoryScreen.js`

Currently has hardcoded data. Update to:

```javascript
import { issuesService } from '../services';

useEffect(() => {
  const loadHistory = async () => {
    setLoading(true);
    try {
      const result = await issuesService.getTransactionHistory(
        type,
        currentPage,
        15
      );
      setTransactions(result.transactions);
      setTotalCount(result.totalCount);
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };
  
  loadHistory();
}, [type, currentPage]);
```

**Checklist:**
- [ ] Replace hardcoded transactions with API
- [ ] Implement type filtering (issue/return/payment)
- [ ] Add pagination
- [ ] Show transaction details
- [ ] Format dates properly

---

## Phase 4: Payment Integration

### 4.1 Payment Fines Screen
**File:** `mobile/src/screens/PaymentFinesScreen.js`

Currently has hardcoded fines. Update to:

```javascript
import { paymentsService } from '../services';

useEffect(() => {
  const loadFines = async () => {
    try {
      const finesData = await paymentsService.getUserFines();
      setFines(finesData.fines);
      setTotalAmount(finesData.totalAmount);
    } catch (error) {
      Alert.alert('Error', 'Failed to load fines');
    }
  };
  
  loadFines();
}, []);

const handlePayNow = async () => {
  try {
    const selectedFineIds = fines
      .filter(f => f.selected)
      .map(f => f.id);
    
    const payment = await paymentsService.initiatePayment(
      selectedFineIds,
      selectedMethod
    );
    
    // Open payment URL or modal
    // After payment completion, verify
    const verified = await paymentsService.verifyPayment(
      payment.transactionId,
      paymentProvider,
      providerTransactionId
    );
    
    Alert.alert('Success', 'Payment received');
    loadFines(); // Refresh
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

**Checklist:**
- [ ] Fetch user's fines from API
- [ ] Display fine breakdown
- [ ] Implement payment method selection
- [ ] Integrate payment gateway (bKash/Nagad/Stripe)
- [ ] Verify payment after completion
- [ ] Show receipt
- [ ] Refresh fines list on success

---

## Phase 5: Profile & Settings

### 5.1 Profile Screen
**File:** `mobile/src/screens/ProfileScreen.js`

```javascript
import { userService } from '../services';

useEffect(() => {
  const loadProfile = async () => {
    try {
      const profileData = await userService.getUserProfile();
      setUser(profileData.user);
      setStats(profileData.stats);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };
  
  loadProfile();
}, []);

const handleUpdateProfile = async (updatedFields) => {
  try {
    const result = await userService.updateUserProfile(updatedFields);
    Alert.alert('Success', 'Profile updated');
    setUser(result.user);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

**Checklist:**
- [ ] Fetch user profile from API
- [ ] Show borrowing stats
- [ ] Display current fines
- [ ] Show trust score/achievements
- [ ] Implement edit profile
- [ ] Upload profile picture
- [ ] Show active sessions

### 5.2 Edit Personal Details Screen
**File:** `mobile/src/screens/EditPersonalDetailsScreen.js`

```javascript
import { userService } from '../services';

const handleSave = async () => {
  try {
    await userService.updateUserProfile(formData);
    Alert.alert('Success', 'Details updated');
    navigation.goBack();
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

**Checklist:**
- [ ] Implement form validation
- [ ] Call update API
- [ ] Show success message
- [ ] Handle error cases

### 5.3 Settings Screen
**File:** (New or existing) `mobile/src/screens/SettingsScreen.js`

```javascript
import { userService } from '../services';

useEffect(() => {
  const loadSettings = async () => {
    const preferences = await userService.getUserPreferences();
    const notifications = await userService.getNotificationSettings();
    setPreferences(preferences.preferences);
    setNotifications(notifications.notifications);
  };
  
  loadSettings();
}, []);

const handleToggleNotification = async (type) => {
  try {
    await userService.updateNotificationSettings({
      ...notifications,
      [type]: !notifications[type],
    });
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

**Checklist:**
- [ ] Load user preferences
- [ ] Load notification settings
- [ ] Implement toggle switches
- [ ] Save changes to API
- [ ] Show language/theme options

---

## Phase 6: Notifications

### 6.1 Notifications Screen
**File:** `mobile/src/screens/NotificationsScreen.js`

```javascript
import { notificationsService } from '../services';

useEffect(() => {
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationsService.getNotifications(
        currentPage,
        15,
        false
      );
      setNotifications([...notifications, ...result.notifications]);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  loadNotifications();
}, [currentPage]);

const handleMarkAsRead = async (notificationId) => {
  await notificationsService.markAsRead(notificationId);
  // Update local state
};

const handleDeleteNotification = async (notificationId) => {
  await notificationsService.deleteNotification(notificationId);
  setNotifications(notifications.filter(n => n.id !== notificationId));
};
```

**Checklist:**
- [ ] Fetch notifications from API
- [ ] Implement pagination
- [ ] Show unread count
- [ ] Mark notifications as read
- [ ] Delete notifications
- [ ] Show urgent notifications at top
- [ ] Implement real-time updates (WebSocket)

### 6.2 Push Notification Setup
**File:** `mobile/src/config/firebase.js` or new file

```javascript
import messaging from '@react-native-firebase/messaging';
import { userService } from '../services';

// Request notification permission
export const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
};

// Get FCM token and register device
export const registerDeviceForNotifications = async () => {
  try {
    const token = await messaging().getToken();
    await userService.registerDeviceForNotifications(token, 'android');
    
    // Listen for notifications
    messaging().onMessage(async (remoteMessage) => {
      // Handle notification when app is in foreground
      showNotificationAlert(remoteMessage);
    });
    
    messaging().onNotificationOpenedApp(remoteMessage => {
      // Handle notification when app is opened from background
      handleNotificationTap(remoteMessage);
    });
  } catch (error) {
    console.error('Error registering device:', error);
  }
};
```

**Checklist:**
- [ ] Request notification permissions
- [ ] Get FCM token from Firebase
- [ ] Register device with backend
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Handle notification taps
- [ ] Test with test notifications

---

## Phase 7: Other Screens

### 7.1 Attendance Dashboard Screen
- [ ] Fetch attendance data from API
- [ ] Show library access records
- [ ] Display visit statistics

### 7.2 Premium Dashboard Screen
- [ ] Fetch premium features status
- [ ] Show subscription details
- [ ] Implement upgrade flow

### 7.3 Biometric Verification Screen
- [ ] Integrate with device biometrics
- [ ] Store biometric auth status
- [ ] Use for login/transactions

### 7.4 QR Scanner Screen
- [ ] Integrate camera and QR scanning library
- [ ] Parse QR codes (book copies)
- [ ] Trigger issue/return operations
- [ ] Handle multiple scans

### 7.5 Contact Support Screen
- [ ] Load support categories
- [ ] Submit support tickets
- [ ] Track ticket status

---

## Testing Checklist

### Authentication Tests
- [ ] Test sign-up with valid institution email
- [ ] Test sign-up with invalid domain (should fail)
- [ ] Test 11-digit phone validation
- [ ] Test login with correct credentials
- [ ] Test login with incorrect password (should fail)
- [ ] Test token refresh
- [ ] Test logout

### Book Operations
- [ ] Search books by title
- [ ] Filter by category
- [ ] View book details
- [ ] Check availability
- [ ] Bookmark/unbookmark book
- [ ] Reserve book

### Issue & Return
- [ ] Issue a book (borrow)
- [ ] View borrowed books
- [ ] Renew a book
- [ ] Return a book
- [ ] Report damage
- [ ] View transaction history

### Payments
- [ ] View fines
- [ ] Initiate payment
- [ ] Verify payment
- [ ] View payment history
- [ ] Download receipt

### Profile
- [ ] View profile
- [ ] Update profile
- [ ] Upload profile picture
- [ ] Change notification settings
- [ ] View achievements

### Notifications
- [ ] Receive notifications
- [ ] Mark as read
- [ ] Delete notification
- [ ] Filter by type
- [ ] Test push notifications

---

## Deployment Checklist

### Before Production
- [ ] All API endpoints tested
- [ ] All screens connected to backend
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Network error handling
- [ ] Offline mode (if needed)
- [ ] Token refresh working
- [ ] Environment variables secure
- [ ] No hardcoded URLs or credentials
- [ ] Error boundary implemented

### Production Steps
1. [ ] Update `EXPO_PUBLIC_API_URL` to production URL
2. [ ] Update Supabase project to production
3. [ ] Configure Firebase for production
4. [ ] Set up error logging (Sentry/DataDog)
5. [ ] Configure analytics
6. [ ] Test all flows end-to-end
7. [ ] Build and sign APK
8. [ ] Deploy to App Store/Play Store
9. [ ] Monitor logs for errors
10. [ ] Get user feedback

---

## Troubleshooting

### Issue: API calls returning 401 Unauthorized
**Solution:**
- Check auth token is stored in AsyncStorage
- Verify token format: `Bearer <token>`
- Check token expiry
- Try login again to get fresh token

### Issue: CORS errors
**Solution:**
- Check `CORS_ORIGIN` in backend .env
- Ensure localhost:8081 or your domain is included

### Issue: Notifications not showing
**Solution:**
- Check Firebase credentials
- Verify FCM token registration
- Check notification permissions granted
- Review Firebase Console for debug info

### Issue: API calls slow or timing out
**Solution:**
- Check backend is running
- Verify network connectivity
- Check backend logs for errors
- Increase timeout if needed

---

## Reference Documentation

- **Supabase Integration Guide:** `SUPABASE_FRONTEND_INTEGRATION.md`
- **Backend API Specification:** Backend `/docs` endpoint or Swagger
- **Firebase Setup:** Backend `FIREBASE_SETUP.md`
- **Deployment Guide:** `DEPLOYMENT_AND_TESTING_CHECKLIST.md`

---

## Support & Questions

- Check backend logs: `npm run dev` in backend directory
- Check mobile logs: `npx expo start --clear`
- Review Supabase Console: https://app.supabase.com/
- Check Firebase Console: https://console.firebase.google.com/
