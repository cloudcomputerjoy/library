# Supabase Frontend Integration Guide

## Overview

This document explains how to properly integrate the frontend mobile app with the Supabase backend for the Smart Library System.

**Current Status:**
- ✅ Supabase backend configured
- ✅ Database tables created
- ✅ API endpoints available
- ✅ Mobile app Supabase client initialized
- ⚠️ **Frontend API services need enhancement for proper backend connection**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                │
├─────────────────────────────────────────────────────────────┤
│  Services Layer:                                            │
│  - api.js (Backend API calls via axios)                    │
│  - supabaseAuthService.js (Supabase auth)                  │
│  - Custom query services (Books, Issues, etc.)             │
├─────────────────────────────────────────────────────────────┤
│              Backend (Node.js/Express)                      │
├─────────────────────────────────────────────────────────────┤
│  Routes: auth, books, issues, returns, payments, etc.      │
│  Controllers: Handle business logic                        │
│  Supabase Client: Database queries                         │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL Database + Auth)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Services Setup

### 1. Supabase Client (`mobile/src/config/supabase.js`)

**Current State:** ✅ Properly configured

```javascript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### 2. API Service (`mobile/src/services/api.js`)

**Purpose:** Centralized axios client for backend HTTP requests

**Key Features:**
- Base URL: `$EXPO_PUBLIC_API_URL` (default: http://192.168.1.117:5000/api)
- Auth token injection in all requests
- Error handling with token refresh
- Response interceptors

**Usage Example:**
```javascript
import { apiClient } from '../services/api';

// GET request with auth
const books = await apiClient.get('/books');

// POST request with data
const response = await apiClient.post('/issues/issue-book', {
  bookId: 123,
  copyId: 456,
});
```

### 3. Authentication Service (`mobile/src/services/supabaseAuthService.js`)

**Purpose:** Handle user authentication via Supabase

**Key Methods:**
- `register(email, password, profile)` - User sign-up
- `login(email, password)` - User login
- `logout()` - Sign out
- `resetPassword(email)` - Password reset
- `getCurrentUser()` - Get current session

---

## Backend API Endpoints

### Authentication

```
POST /api/auth/register
- Body: { email, password, firstName, lastName, phone, studentId }
- Returns: { user, token, refreshToken }

POST /api/auth/login
- Body: { email, password }
- Returns: { user, token, refreshToken }

POST /api/auth/refresh
- Body: { refreshToken }
- Returns: { token, refreshToken }

POST /api/auth/logout
- Headers: Authorization: Bearer <token>

POST /api/auth/forgot-password
- Body: { email }

POST /api/auth/reset-password
- Body: { token, newPassword }
```

### Books

```
GET /api/books
- Query: search, category, page, limit
- Returns: { books[], totalCount, page, limit }

GET /api/books/:id
- Returns: { book, copies[], availability }

POST /api/issues/issue-book
- Headers: Authorization: Bearer <token>
- Body: { bookId, copyId }
- Returns: { issue, dueDate, finePerDay }

POST /api/issues/return-book
- Headers: Authorization: Bearer <token>
- Body: { issueId, condition }
- Returns: { return, fine, overdueDetails }
```

### User Profile

```
GET /api/users/profile
- Headers: Authorization: Bearer <token>
- Returns: { user, borrowedBooks, fineAmount, reservations }

PUT /api/users/profile
- Headers: Authorization: Bearer <token>
- Body: { firstName, lastName, phone, departmentId }
- Returns: { user }

GET /api/users/transactions
- Headers: Authorization: Bearer <token>
- Query: page, limit, type (issue|return|payment)
- Returns: { transactions[], totalCount }
```

### Payments

```
GET /api/payments/fines
- Headers: Authorization: Bearer <token>
- Returns: { fines[], totalAmount }

POST /api/payments/init
- Headers: Authorization: Bearer <token>
- Body: { amount, method, fineIds[] }
- Returns: { transactionId, checkoutUrl }

POST /api/payments/verify
- Body: { transactionId, provider, status }
- Returns: { payment, receipt }
```

### Notifications

```
GET /api/notifications
- Headers: Authorization: Bearer <token>
- Query: page, limit, unreadOnly
- Returns: { notifications[], unreadCount }

PUT /api/notifications/:id/read
- Headers: Authorization: Bearer <token>

DELETE /api/notifications/:id
- Headers: Authorization: Bearer <token>
```

---

## Frontend Data Flow Examples

### Example 1: Sign-Up Flow

```javascript
// 1. SignupScreen.js calls register
const handleSignup = async () => {
  const { register, isRegistering } = useRegister();
  
  const result = await register({
    email: formData.email,
    password: formData.password,
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone,
    studentId: formData.studentId,
  });
  
  if (result.success) {
    navigation.navigate('LoginScreen');
  }
};

// 2. useAuth hook uses supabaseAuthService
export const useRegister = () => {
  const register = async (credentials) => {
    try {
      const user = await supabaseAuthService.register(
        credentials.email,
        credentials.password,
        {
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          phone: credentials.phone,
          studentId: credentials.studentId,
        }
      );
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  return { register };
};

// 3. supabaseAuthService calls backend
export const register = async (email, password, profile) => {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    ...profile,
  });
  
  // Store auth tokens
  await AsyncStorage.setItem('userToken', response.data.token);
  await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data.user;
};
```

### Example 2: Issue Book Flow

```javascript
// 1. BookDetailScreen.js -> User clicks "Borrow"
const handleBorrowBook = async () => {
  try {
    const response = await apiClient.post('/issues/issue-book', {
      bookId: book.id,
      copyId: selectedCopy.id,
    });
    
    setDueDate(response.data.dueDate);
    Alert.alert('Success', `Book issued! Due: ${response.data.dueDate}`);
  } catch (error) {
    Alert.alert('Error', error.response?.data?.message || 'Failed to issue book');
  }
};

// 2. Backend receives request
router.post('/issues/issue-book', authenticateToken, async (req, res) => {
  const { bookId, copyId } = req.body;
  const userId = req.user.id;
  
  // Verify copy is available
  const { data: copy } = await supabase
    .from('book_copies')
    .select('*')
    .eq('id', copyId)
    .eq('book_id', bookId)
    .single();
  
  if (copy.status !== 'available') {
    return res.status(400).json({ message: 'Copy not available' });
  }
  
  // Create issue record
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period
  
  const { data: issue } = await supabase
    .from('issues')
    .insert({
      book_id: bookId,
      copy_id: copyId,
      user_id: userId,
      issued_date: new Date(),
      due_date: dueDate,
      status: 'active',
    })
    .select()
    .single();
  
  // Update copy status
  await supabase
    .from('book_copies')
    .update({ status: 'issued', issued_to: userId })
    .eq('id', copyId);
  
  res.json({ issue, dueDate });
});
```

### Example 3: Fetch User Profile

```javascript
// 1. ProfileScreen.js
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/users/profile');
      setUser(response.data.user);
      setBorrowedBooks(response.data.borrowedBooks);
      setFineAmount(response.data.fineAmount);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  fetchProfile();
}, []);

// 2. Backend endpoint
router.get('/users/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  // Fetch user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  // Fetch borrowed books
  const { data: borrowedBooks } = await supabase
    .from('issues')
    .select('*, books(title, author, cover_url)')
    .eq('user_id', userId)
    .eq('status', 'active');
  
  // Calculate fines
  const { data: overdueIssues } = await supabase
    .from('issues')
    .select('due_date')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('due_date', new Date());
  
  const fineAmount = overdueIssues.length * 5; // $5 per day per book
  
  res.json({
    user,
    borrowedBooks,
    fineAmount,
    reservations: [],
  });
});
```

---

## Environment Variable Configuration

### Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=86400

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Firebase (for push notifications)
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json
```

### Mobile (.env)

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_xxxxx

# Backend API
EXPO_PUBLIC_API_URL=http://192.168.1.117:5000/api

# Firebase
EXPO_PUBLIC_FIREBASE_PROJECT_ID=smart-library-system-bf387
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...

# Institution configuration
EXPO_PUBLIC_ALLOWED_DOMAINS=@aaub.edu.bd,@aiub.edu.bd
```

---

## Common Integration Patterns

### Pattern 1: Protected API Call with Auth Token

```javascript
// Frontend
const response = await apiClient.post('/protected-endpoint', {
  data: value,
});

// Interceptor automatically adds: Authorization: Bearer <token>
```

### Pattern 2: Error Handling & Token Refresh

```javascript
// If 401 response received:
1. Retrieve refreshToken from AsyncStorage
2. Call POST /api/auth/refresh
3. Store new token
4. Retry original request automatically
```

### Pattern 3: Pagination

```javascript
const fetchBooks = async (page = 1, limit = 10) => {
  const response = await apiClient.get('/books', {
    params: { page, limit, search: searchQuery },
  });
  
  return {
    books: response.data.books,
    totalCount: response.data.totalCount,
    hasMore: response.data.page < Math.ceil(response.data.totalCount / limit),
  };
};
```

### Pattern 4: Offline Queue (for critical operations)

```javascript
// Save to local storage on offline
const issueBookOffline = async (bookId, copyId) => {
  const queue = await AsyncStorage.getItem('offlineQueue');
  const items = queue ? JSON.parse(queue) : [];
  
  items.push({
    action: 'issue-book',
    bookId,
    copyId,
    timestamp: Date.now(),
  });
  
  await AsyncStorage.setItem('offlineQueue', JSON.stringify(items));
};

// Sync when online
const syncOfflineQueue = async () => {
  const queue = await AsyncStorage.getItem('offlineQueue');
  const items = queue ? JSON.parse(queue) : [];
  
  for (const item of items) {
    try {
      if (item.action === 'issue-book') {
        await apiClient.post('/issues/issue-book', {
          bookId: item.bookId,
          copyId: item.copyId,
        });
      }
      // Remove from queue
      items.splice(items.indexOf(item), 1);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
  
  await AsyncStorage.setItem('offlineQueue', JSON.stringify(items));
};
```

---

## Testing Integration

### 1. Test Authentication

```bash
# Sign up
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

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@aaub.edu.bd",
    "password": "SecurePass123"
  }'
```

### 2. Test Protected Endpoint

```bash
# Get profile (requires token)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <your-token>"
```

### 3. Test Issue Book

```bash
curl -X POST http://localhost:5000/api/issues/issue-book \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": 1,
    "copyId": 1
  }'
```

---

## Database Tables Schema

### users
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- phone (VARCHAR)
- student_id (VARCHAR, UNIQUE)
- role (ENUM: student, librarian, admin)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### books
```sql
- id (UUID, PK)
- isbn (VARCHAR, UNIQUE)
- title (VARCHAR)
- author (VARCHAR)
- publisher (VARCHAR)
- pages (INT)
- category (VARCHAR)
- cover_url (VARCHAR)
- quantity (INT)
- available_copies (INT)
- created_at (TIMESTAMP)
```

### book_copies
```sql
- id (UUID, PK)
- book_id (UUID, FK)
- qr_code (VARCHAR, UNIQUE)
- status (ENUM: available, issued, damaged, lost)
- issued_to (UUID, FK to users)
- created_at (TIMESTAMP)
```

### issues
```sql
- id (UUID, PK)
- book_id (UUID, FK)
- copy_id (UUID, FK)
- user_id (UUID, FK)
- issued_date (TIMESTAMP)
- due_date (TIMESTAMP)
- returned_date (TIMESTAMP)
- status (ENUM: active, returned, overdue)
- fine_amount (DECIMAL)
- created_at (TIMESTAMP)
```

---

## Troubleshooting

### Issue: "CORS error on API call"
**Solution:** Check `CORS_ORIGIN` in backend .env includes your mobile app/web origin

### Issue: "401 Unauthorized even with token"
**Solution:** 
- Check token format: `Authorization: Bearer <token>`
- Verify JWT_SECRET matches between frontend and backend
- Check token expiry time

### Issue: "Token refresh failing"
**Solution:**
- Verify `refreshToken` stored in AsyncStorage
- Check `/api/auth/refresh` endpoint exists
- Ensure REFRESH_TOKEN_EXPIRE is set in .env

### Issue: "Supabase connection refused"
**Solution:**
- Verify SUPABASE_URL is correct
- Check SUPABASE_SERVICE_ROLE_KEY is valid
- Ensure Supabase project is active and accessible

---

## Next Steps

1. ✅ Verify all environment variables are set correctly
2. ✅ Test each API endpoint with curl or Postman
3. ✅ Run mobile app and test authentication flow
4. ✅ Test critical operations (issue, return, payment)
5. ✅ Implement error boundary and logging
6. ✅ Set up monitoring and analytics
7. ✅ Deploy to production

---

## Support

For issues or questions:
- Check backend logs: `npm run dev` in backend directory
- Check mobile logs: `npx expo start --clear`
- Review Supabase Console: https://app.supabase.com/
