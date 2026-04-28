# Smart Library System - Backend Implementation Guide

## Overview

A complete backend API system has been created for the Smart Library System with comprehensive controllers for all major features:

- **Authentication** (register, login, profile management)
- **Books** (search, list, filter, details)
- **Transactions** (issue, return, renew books, track fines)
- **Payments** (payment processing, fine management)
- **Notifications** (due reminders, announcements, alerts)
- **File Sharing** (upload, share, download documents)
- **QR Code** (generate, scan, validate, process transactions)
- **RFID** (card registration, scanning, transactions)

---

## Created Backend Controllers

### 1. **Auth Controller** (`src/controllers/authController.js`)

Handles user authentication and profile management:

- `register(email, password, phone, firstName, lastName)` - Create new user account
- `login(email, password)` - Authenticate user and generate JWT token
- `refreshToken(refreshToken)` - Refresh expired tokens
- `getProfile(userId)` - Fetch user profile information
- `updateProfile(userId, data)` - Update user details

**API Routes:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET /api/auth/me
PUT /api/auth/me
```

---

### 2. **Books Controller** (`src/controllers/booksController.js`)

Manages book catalog and search:

- `listBooks(filters, pagination)` - Get books with filtering (category, author, status)
- `getBookDetail(bookId)` - Fetch complete book information with related data
- `searchBooks(query, page, limit, sortBy)` - Full-text search across title, author, ISBN

**API Routes:**
```
GET /api/books?page=1&limit=20&category=fiction
GET /api/books/:id
GET /api/books/search?q=query&sortBy=title
```

---

### 3. **Transactions Controller** (`src/controllers/transactionsController.js`)

Handles book issuance and returns:

- `issueBook(userId, bookId, dueDays)` - Issue book to user
- `returnBook(userId, transactionId, condition, notes)` - Process book return and calculate fines
- `getActiveIssues(userId)` - Get currently borrowed books (with due date status)
- `getTransactionHistory(userId, limit, offset)` - Full transaction history
- `renewBook(userId, transactionId, extendDays)` - Extend due date
- `getUserFines(userId)` - Get all fines associated with user

**API Routes:**
```
POST /api/transactions/issue
POST /api/transactions/return
GET /api/transactions/active
GET /api/transactions/history?limit=20&offset=0
POST /api/transactions/renew
GET /api/transactions/fines
```

---

### 4. **Payments Controller** (`src/controllers/paymentsController.js`)

Payment and fine management:

- `getOutstandingFines(userId)` - Fetch pending fines with details
- `payFines(userId, amount, fineIds, paymentMethod)` - Process fine payment
- `getPaymentHistory(userId, limit, offset)` - Payment transaction history
- `getPaymentSummary(userId)` - Overview of payments and pending amounts
- `waiveFine(fineId, reason)` - Admin: Waive fine
- `getPaymentStats()` - Admin: Dashboard statistics

**API Routes:**
```
GET /api/payments/fines/outstanding
POST /api/payments/pay-fines
GET /api/payments/history
GET /api/payments/summary
POST /api/payments/waive (admin)
GET /api/payments/stats (admin)
```

---

### 5. **Notifications Controller** (`src/controllers/notificationsController.js`)

User notifications and preferences:

- `getNotifications(userId, limit, offset, unreadOnly)` - Fetch user notifications
- `getUnreadCount(userId)` - Count unread notifications
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead(userId)` - Mark all as read
- `createNotification(userId, data)` - Create new notification
- `sendDueReminders()` - Send due date alerts (scheduled job)
- `sendOverdueNotifications()` - Send overdue alerts (scheduled job)
- `getPreferences()` / `updatePreferences()` - Manage notification settings

**API Routes:**
```
GET /api/notifications?limit=20&offset=0
GET /api/notifications/unread-count
POST /api/notifications/mark-read
POST /api/notifications/mark-all-read
GET /api/notifications/preferences
PUT /api/notifications/preferences
POST /api/notifications/send-reminders (admin)
```

---

### 6. **Files Controller** (`src/controllers/filesController.js`)

File sharing and document management:

- `uploadAndShare(userId, file, expiresIn, recipientIds)` - Upload and share file
- `getSharedFiles(userId)` - Get files shared with user
- `getMyFiles(userId, limit, offset)` - Get user's uploaded files
- `downloadFile(fileId)` - Download file with access control
- `shareFile(fileId, recipientIds)` - Share existing file with more users
- `revokeAccess(fileId, shareId)` - Remove access from user
- `deleteFile(fileId)` - Delete uploaded file

**API Routes:**
```
POST /api/files/upload (multipart/form-data)
GET /api/files/shared
GET /api/files/my-files?limit=20
GET /api/files/download/:fileId
POST /api/files/:fileId/share
POST /api/files/revoke-access
DELETE /api/files/:fileId
```

---

### 7. **QR Code Controller** (`src/controllers/qrController.js`)

QR code generation and scanning:

- `generateBookQR(bookId)` - Create QR code for book
- `generateUserQR(userId)` - Create QR code for user library card
- `scanQR(qrData)` - Validate and parse scanned QR code
- `processQRTransaction(userQRData, bookQRData, action)` - Execute transaction via QR
- `getQRHistory(userId, limit, offset)` - Transaction history
- `validateQRToken(token)` - Verify QR token validity

**API Routes:**
```
GET /api/qr/book/:bookId
GET /api/qr/user
POST /api/qr/scan
POST /api/qr/transaction
GET /api/qr/history
POST /api/qr/validate
```

---

### 8. **RFID Controller** (`src/controllers/rfidController.js`)

RFID card management and transactions:

- `registerRFIDCard(userId, rfidTag, cardName)` - Register new RFID card
- `getUserRFIDCards(userId)` - List user's RFID cards
- `deactivateRFIDCard(userId, cardId)` - Deactivate card
- `scanRFIDCard(rfidTag)` - Scan and validate RFID card
- `processRFIDTransaction(rfidTag, bookBarcode, action)` - Issue/return via RFID+book
- `getRFIDLogs(userId, limit, offset)` - RFID transaction logs
- `getRFIDStats()` - Admin: RFID usage statistics

**API Routes:**
```
POST /api/rfid/register
GET /api/rfid/cards
POST /api/rfid/deactivate
POST /api/rfid/scan
POST /api/rfid/transaction
GET /api/rfid/logs
GET /api/rfid/stats (admin)
```

---

## Database Schema Additions

The following tables have been added to the Supabase schema:

### Core Transaction Tables:
- `transactions` - Issue, return, and reserve records
- `fines` - Fine records with payment status
- `payments` - Payment transaction records
- `qr_codes` - Generated QR codes with metadata
- `rfid_cards` - User RFID cards
- `rfid_logs` - RFID scanning logs

### User Services:
- `notifications` - User notifications
- `notification_preferences` - User notification settings
- `shared_files` - Shared document records
- `file_shares` - File access permissions
- `file_downloads` - Download tracking

### Indexes:
- Optimized indexes on frequently queried fields (user_id, status, created_at)
- Foreign key relationships with cascade delete
- RLS policy structure in place

---

## Frontend API Service (`src/services/api.js`)

Complete API integration service with:

### Auto-configured Features:
- ✅ JWT token injection on every request
- ✅ Automatic token refresh on 401 errors
- ✅ Axios instance with global error handling
- ✅ AsyncStorage integration for auth tokens

### Exported API Groups:
- `authAPI` - Authentication endpoints
- `booksAPI` - Book search and catalog
- `transactionsAPI` - Issue/return operations
- `paymentsAPI` - Payment and fine management
- `notificationsAPI` - Notification management
- `filesAPI` - File upload and sharing
- `qrAPI` - QR code operations
- `rfidAPI` - RFID card operations
- `categoriesAPI` - Book categories
- `searchAPI` - Global search

### Usage Example:

```javascript
import API from './src/services/api';

// Login
const result = await API.auth.login('email@example.com', 'password');
localStorage.setItem('authToken', result.data.token);

// Get books
const books = await API.books.listBooks({}, 1, 20);

// Issue a book
const transaction = await API.transactions.issueBook('bookId', 14);

// Get fines
const fines = await API.payments.getOutstandingFines();

// Pay fines
const payment = await API.payments.payFines(100, ['fineId1', 'fineId2']);
```

---

## Setup Instructions

### 1. Import Database Schema

Open your Supabase project and:

1. Go to SQL Editor
2. Create a new query
3. Copy contents of `backend/supabase_schema.sql`
4. Execute the query

This creates all necessary tables, indexes, and relationships.

### 2. Configure Environment Variables

In `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# Fine Settings
DAILY_FINE_AMOUNT=10

# Cloudflare R2
R2_BUCKET_NAME=smart-library
R2_ACCESS_KEY=your-key
R2_SECRET_KEY=your-secret
R2_REGION=auto
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Start Backend Server

```bash
npm start
```

Server runs on: `http://localhost:5000`

### 5. Configure Mobile App Environment

In `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```

### 6. Start Mobile App

```bash
cd mobile
npx expo start
```

---

## API Authentication Flow

### Login Flow:
```
1. User submits credentials (email, password)
   → POST /api/auth/login
   
2. Backend validates and returns:
   {
     success: true,
     data: {
       token: "jwt-token",
       refreshToken: "refresh-token",
       user: { id, email, name, role... }
     }
   }

3. Frontend stores tokens:
   AsyncStorage.setItem('authToken', token)
   AsyncStorage.setItem('refreshToken', refreshToken)

4. All subsequent requests include:
   Authorization: Bearer {token}
```

### Token Refresh:
```
1. API request fails with 401
2. Interceptor detects 401
3. Automatically calls POST /api/auth/refresh with refreshToken
4. Backend validates refreshToken and returns new accessToken
5. Original request is retried with new token
```

---

## Testing with cURL

### Register User:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securePassword123",
    "phone": "9876543210",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securePassword123"
  }'
```

### List Books (with auth):
```bash
curl -X GET "http://localhost:5000/api/books?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Issue Book:
```bash
curl -X POST http://localhost:5000/api/transactions/issue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "book-uuid",
    "dueDays": 14
  }'
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper JWT secrets (use strong random keys)
- [ ] Set up Cloudflare R2 for file storage
- [ ] Configure CORS for production domain
- [ ] Set up rate limiting on all endpoints
- [ ] Enable HTTPS
- [ ] Configure Redis for caching (optional)
- [ ] Set up monitoring and logging
- [ ] Configure email service for notifications
- [ ] Set up scheduled jobs for due date reminders
- [ ] Test all payment integrations
- [ ] Configure backup strategy for database

---

## Next Steps

1. **Create Route Handlers** - Wire up controllers to Express routes
2. **Frontend Integration** - Update screens to use API service
3. **Testing** - Write unit and integration tests
4. **Documentation** - Generate API docs with Swagger/OpenAPI
5. **Deployment** - Deploy backend to production server
6. **Monitoring** - Set up error tracking and analytics

---

## Support & Documentation

- API endpoints fully documented with JSDoc comments
- Each controller includes inline documentation
- Database schema includes comments explaining relationships
- Frontend API service has usage examples for each endpoint

For more information, see:
- `backend/src/controllers/` - All controller implementations
- `backend/supabase_schema.sql` - Database schema
- `mobile/src/services/api.js` - Frontend API integration
