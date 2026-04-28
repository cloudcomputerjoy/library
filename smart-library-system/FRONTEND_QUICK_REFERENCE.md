# Frontend-Supabase Quick Reference

**Quick integration guide for developers**

---

## 1. Quick Setup (5 minutes)

### Environment Variables

**Backend (.env):**
```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx
JWT_SECRET=your-secret
PORT=5000
```

**Mobile (.env):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_xxxxx
EXPO_PUBLIC_API_URL=http://192.168.1.117:5000/api
EXPO_PUBLIC_ALLOWED_DOMAINS=@aaub.edu.bd,@aiub.edu.bd
```

### Start Services
```bash
# Backend
cd backend
npm install
npm run dev  # Runs on http://localhost:5000

# Mobile
cd mobile
npm install
npx expo start --clear
```

---

## 2. Using Services in Screens

### Pattern 1: Simple Data Fetch
```javascript
import { booksService } from '../services';
import { useEffect, useState } from 'react';

export const MyScreen = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const result = await booksService.searchBooks('Harry Potter');
        setBooks(result.books);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, []);
  
  return <FlatList data={books} renderItem={...} />;
};
```

### Pattern 2: Action with Confirmation
```javascript
import { issuesService } from '../services';
import { Alert } from 'react-native';

const handleBorrow = async () => {
  try {
    const result = await issuesService.issueBook(bookId);
    Alert.alert('Success', `Due date: ${result.dueDate}`);
  } catch (error) {
    Alert.alert('Error', error.response?.data?.message || error.message);
  }
};
```

### Pattern 3: Form Submission
```javascript
import { userService } from '../services';

const handleSaveProfile = async () => {
  try {
    await userService.updateUserProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    });
    Alert.alert('Success', 'Profile updated');
    navigation.goBack();
  } catch (error) {
    setError(error.message);
  }
};
```

---

## 3. Common Service Calls

### Authentication
```javascript
import { useRegister, useLogin } from '../hooks/useAuth';

// Sign up
const { register } = useRegister();
await register({ email, password, firstName, phone });

// Login
const { login } = useLogin();
await login({ email, password });
```

### Books
```javascript
// Search
const result = await booksService.searchBooks(query, category, 1, 10);

// Get detail
const bookData = await booksService.getBookDetail(bookId);

// Bookmark
await booksService.bookmarkBook(bookId);

// Check availability
const avail = await booksService.checkBookAvailability(bookId);
```

### Issues
```javascript
// Borrow
const issue = await issuesService.issueBook(bookId);

// Get borrowed books
const borrowed = await issuesService.getBorrowedBooks();

// Return
const result = await issuesService.returnBook(issueId, 'good');

// History
const history = await issuesService.getBorrowingHistory(1, 10);

// Overdue
const overdue = await issuesService.getOverdueBooks();
```

### Payments
```javascript
// Get fines
const finesData = await paymentsService.getUserFines();

// Pay
const payment = await paymentsService.initiatePayment(fineIds, 'bKash');

// Verify
await paymentsService.verifyPayment(transactionId, 'bKash', providerTxnId);

// History
const history = await paymentsService.getPaymentHistory(1, 10);
```

### Profile
```javascript
// Get profile
const profile = await userService.getUserProfile();

// Update
await userService.updateUserProfile({ firstName, lastName });

// Upload picture
await userService.uploadProfilePicture(imageUri);

// Preferences
await userService.updateUserPreferences({ theme: 'dark' });
```

### Notifications
```javascript
// Get notifications
const result = await notificationsService.getNotifications(1, 15, false);

// Mark read
await notificationsService.markAsRead(notificationId);

// Delete
await notificationsService.deleteNotification(notificationId);

// Filter by type
const urgent = await notificationsService.getUrgentNotifications();
```

---

## 4. Error Handling

### Standard Pattern
```javascript
try {
  const result = await apiService.someOperation();
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    navigation.navigate('Login');
  } else if (error.response?.status === 400) {
    // Bad request validation error
    Alert.alert('Validation Error', error.response.data.message);
  } else if (error.response?.status === 500) {
    // Server error
    Alert.alert('Server Error', 'Please try again later');
  } else {
    // Network or unknown error
    Alert.alert('Error', error.message);
  }
}
```

### Error Messages
```javascript
// API error with message
error.response?.data?.message

// Network error
error.message

// Validation errors (array)
error.response?.data?.errors
```

---

## 5. Loading & State Management

### With Loading State
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await service.getData();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

return (
  <>
    {loading && <ActivityIndicator />}
    {error && <Text style={styles.error}>{error}</Text>}
    {data && <FlatList data={data} ... />}
  </>
);
```

### With Zustand Store
```javascript
import { create } from 'zustand';
import { booksService } from '../services';

export const useBookStore = create((set) => ({
  books: [],
  loading: false,
  
  fetchBooks: async (query) => {
    set({ loading: true });
    try {
      const result = await booksService.searchBooks(query);
      set({ books: result.books });
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },
}));

// In component:
const { books, loading, fetchBooks } = useBookStore();
```

---

## 6. Pagination

### Multiple Fetches
```javascript
const [books, setBooks] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const fetchMoreBooks = async () => {
  try {
    const result = await booksService.searchBooks(query, 'all', page, 10);
    setBooks([...books, ...result.books]);
    setHasMore(result.hasMore);
    setPage(page + 1);
  } catch (error) {
    Alert.alert('Error', 'Failed to load more books');
  }
};

return (
  <FlatList
    data={books}
    onEndReached={fetchMoreBooks}
    hasMore={hasMore}
  />
);
```

---

## 7. Real-Time Updates

### Poll for Updates
```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const notifications = await notificationsService.getNotifications(1, 10);
    setNotifications(notifications.notifications);
  }, 30000); // Every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

### WebSocket/Socket.io (Future)
```javascript
// When implemented
import { subscribeToNotifications } from '../services';

useEffect(() => {
  const subscription = subscribeToNotifications();
  
  subscription.on('notification', (data) => {
    // Handle real-time notification
  });
  
  return () => subscription.off();
}, []);
```

---

## 8. Troubleshooting Commands

### Check Backend Running
```bash
curl http://localhost:5000/api/books
```

### Check Auth Token
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = await AsyncStorage.getItem('userToken');
console.log('Token:', token);
```

### Check API Call (Postman)
```
POST http://localhost:5000/api/auth/login
Header: Content-Type: application/json
Body: { "email": "test@aaub.edu.bd", "password": "test" }
```

### Check Supabase Connection
```bash
# Backend
npm run db:test

# Mobile
import { supabase } from '../config/supabase';
const { data, error } = await supabase.from('books').select('*').limit(1);
console.log(data, error);
```

---

## 9. Common Mistakes to Avoid

❌ **Don't:**
```javascript
// Making API calls in render
const MyScreen = () => {
  const books = booksService.searchBooks(); // ❌ Without useEffect
};

// Forgetting error handling
const result = await apiClient.get('/data'); // ❌ No try-catch

// Using hardcoded values
const books = [...]; // ❌ Instead of fetching from API

// Not awaiting async operations
fetchBooks(); // ❌ Should be await fetchBooks()

// Multiple API calls without dependencies
useEffect(() => {
  const data = await apiClient.get('/data1');
  const data2 = await apiClient.get('/data2');
}); // ❌ Runs on every render
```

✅ **Do:**
```javascript
// Use useEffect for data fetching
useEffect(() => {
  const fetchBooks = async () => {
    try {
      const result = await booksService.searchBooks();
      setBooks(result.books);
    } catch (error) {
      setError(error);
    }
  };
  fetchBooks();
}, []);

// Handle errors properly
try {
  const result = await apiClient.get('/data');
} catch (error) {
  console.error(error);
  Alert.alert('Error', error.message);
}

// Fetch from API, don't hardcode
const [books, setBooks] = useState([]);

// Await async operations
await fetchBooks();

// Use dependency array
useEffect(() => {
  fetchBooks();
}, [bookId]); // Re-fetch when bookId changes
```

---

## 10. File Structure

```
mobile/
├── src/
│   ├── screens/          # All UI screens
│   ├── services/         # API service layer
│   │   ├── api.js       # Axios client
│   │   ├── booksService.js
│   │   ├── issuesService.js
│   │   ├── paymentsService.js
│   │   ├── userService.js
│   │   ├── notificationsService.js
│   │   └── index.js     # Exports all services
│   ├── hooks/           # Custom React hooks
│   ├── config/          # Configuration
│   │   ├── supabase.js
│   │   └── env.js
│   ├── store/           # Zustand state management
│   ├── components/      # Reusable components
│   └── constants/       # Constants & config

backend/
├── src/
│   ├── routes/          # API route definitions
│   ├── controllers/      # Business logic
│   ├── middleware/      # Auth, error handling
│   ├── services/        # Database queries
│   ├── config/          # Supabase, Firebase config
│   └── utils/           # Helpers & validation
└── .env                 # Environment variables
```

---

## 11. Deployment Workflow

```bash
# 1. Test locally
npm run dev          # Backend
npx expo start       # Mobile

# 2. Build for production
npx expo build:android  # Build APK
eas build --platform android

# 3. Test production build
npx expo build download # Download and test

# 4. Deploy
# Upload APK to Play Store / TestFlight

# 5. Monitor
# Check logs in Supabase Console
# Check Firebase Console for push notifications
```

---

## 12. Useful Links

- **Supabase Docs:** https://supabase.com/docs
- **Firebase Reference:** https://firebase.google.com/docs
- **Expo Guide:** https://docs.expo.dev/
- **React Native:** https://reactnative.dev/
- **Backend API:** http://localhost:5000/api/docs (Swagger)

---

## 13. Support

For issues:
1. Check backend logs: `npm run dev` in backend directory
2. Check mobile logs: `npx expo start --clear`
3. Review Supabase Console: https://app.supabase.com/
4. Check Firebase Console: https://console.firebase.google.com/
5. Reference documentation files in root directory
