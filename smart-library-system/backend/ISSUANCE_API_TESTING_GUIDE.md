# Two-Step Book Issuance API - Complete Testing Guide

## ✅ Migration Deployment

Before testing, apply the database migration:

### Option 1: Manual (Recommended for first time)
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content from `backend/migrations/001_add_issuance_requests_table.sql`
3. Click "RUN" button
4. Verify table created: Tables → `issuance_requests`

### Option 2: Automated
```bash
cd backend
npm run migrate
```

---

## 🔄 Complete Two-Step Issuance Flow

```
STUDENT FLOW                          ADMIN FLOW
──────────────────────────────────────────────────────
1. Scan Book QR
   ↓
2. POST /books/scan-qr
   ← Get Book Details
   ↓
3. Biometric Verification
   ↓
4. POST /issues/create-request
   ← RequestId + Confirmation
                                  1. Auto-fetch pending
                                     GET /issues/pending-requests
                                     (every 5 seconds)
                                     ↓
                                  2. Select Request
                                     ↓
                                  3. Scan Any Book QR
                                     ↓
                                  4. POST /issues/complete-request
                                     ← Issue Complete
   
   ← Notification: Book Issued
```

---

## 🧪 API Endpoint Tests

### 1️⃣ POST `/api/books/scan-qr` - Student scans book

**Purpose:** Get book details when student scans a book QR code

**Request:**
```bash
curl -X POST http://localhost:5000/api/books/scan-qr \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "BOOK-123456" 
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "book": {
    "id": "uuid-here",
    "title": "The Great Gatsby",
    "isbn": "978-0743273565",
    "author": "F. Scott Fitzgerald",
    "available_copies": 3,
    "total_copies": 5,
    "category": {
      "id": "uuid-here",
      "name": "Fiction"
    }
  }
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "message": "Book not found"
}
```

**Test Cases:**
- ✅ Valid QR code → Returns book details
- ✅ Invalid/Unknown QR code → Returns 404
- ✅ ISBN-based fallback → Works with ISBN as QR

---

### 2️⃣ POST `/api/issues/create-request` - Create issuance request

**Purpose:** Student creates a request after biometric verification

**Request:**
```bash
curl -X POST http://localhost:5000/api/issues/create-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {student_jwt_token}" \
  -d '{
    "bookId": "uuid-here",
    "qrCode": "BOOK-123456",
    "bookTitle": "The Great Gatsby",
    "bookIsbn": "978-0743273565",
    "requestedAt": "2026-04-18T10:30:00Z"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "requestId": "request-uuid",
  "message": "Issuance request created successfully"
}
```

**Response (Errors):**

Account not active:
```json
{
  "success": false,
  "message": "Account is not active"
}
```

Pending fines:
```json
{
  "success": false,
  "message": "Cannot create request. Outstanding fine: ₹500",
  "fine_amount": 500
}
```

Borrow limit reached:
```json
{
  "success": false,
  "message": "Borrow limit reached. Already borrowed: 5/5"
}
```

Book already issued:
```json
{
  "success": false,
  "message": "Book already issued to you"
}
```

Book not available:
```json
{
  "success": false,
  "message": "Book is not available"
}
```

**Test Cases:**
- ✅ Valid request from active student → Creates request
- ✅ Inactive account → Returns error
- ✅ Pending fines exist → Returns error with fine amount
- ✅ Borrow limit exceeded → Returns error with count
- ✅ Book already issued → Returns error
- ✅ Book unavailable → Returns error
- ✅ Request expires after 5 minutes → Auto-expires

---

### 3️⃣ GET `/api/issues/pending-requests` - Admin fetches pending requests

**Purpose:** Admin dashboard fetches all pending requests (auto-refreshed every 5s)

**Request:**
```bash
curl -X GET http://localhost:5000/api/issues/pending-requests \
  -H "Authorization: Bearer {admin_jwt_token}"
```

**Response (Success):**
```json
{
  "success": true,
  "requests": [
    {
      "id": "request-uuid-1",
      "studentId": "student-uuid-1",
      "studentName": "John Doe",
      "studentEmail": "john@example.com",
      "bookId": "book-uuid-1",
      "bookTitle": "The Great Gatsby",
      "bookIsbn": "978-0743273565",
      "qrCode": "BOOK-123456",
      "status": "pending",
      "createdAt": "2026-04-18T10:25:00Z",
      "expiresAt": "2026-04-18T10:30:00Z"
    },
    {
      "id": "request-uuid-2",
      "studentId": "student-uuid-2",
      "studentName": "Jane Smith",
      "studentEmail": "jane@example.com",
      "bookId": "book-uuid-2",
      "bookTitle": "To Kill a Mockingbird",
      "bookIsbn": "978-0061120084",
      "qrCode": "BOOK-654321",
      "status": "pending",
      "createdAt": "2026-04-18T10:20:00Z",
      "expiresAt": "2026-04-18T10:25:00Z"
    }
  ],
  "count": 2
}
```

**Test Cases:**
- ✅ Multiple pending requests → Returns all active ones
- ✅ No pending requests → Returns empty array
- ✅ Auto-refresh every 5 seconds → Latest data
- ✅ Expired requests filtered out → Automatically marked as expired

---

### 4️⃣ POST `/api/issues/complete-request` - Admin issues the book

**Purpose:** Admin scans book QR to complete issuance request

**Request:**
```bash
curl -X POST http://localhost:5000/api/issues/complete-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -d '{
    "requestId": "request-uuid",
    "bookQrCode": "BOOK-999999",
    "completedAt": "2026-04-18T10:28:00Z"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "issueId": "transaction-uuid",
  "message": "Book issued successfully"
}
```

**Response (Errors):**

Request not found:
```json
{
  "success": false,
  "message": "Issuance request not found or already completed"
}
```

Request expired:
```json
{
  "success": false,
  "message": "Issuance request has expired"
}
```

Book QR not recognized:
```json
{
  "success": false,
  "message": "Book QR code not recognized"
}
```

Book not available:
```json
{
  "success": false,
  "message": "Scanned book is not available"
}
```

**Test Cases:**
- ✅ Valid request + valid book QR → Creates transaction & issues book
- ✅ Request already completed → Returns error
- ✅ Request expired → Returns error
- ✅ Invalid book QR code → Returns error
- ✅ Book unavailable → Returns error
- ✅ Book availability decremented → `available_copies - 1`
- ✅ Transaction record created → With 14-day due date
- ✅ Student notified → Notification created

---

### 5️⃣ POST `/api/issues/cancel-request` - Cancel pending request

**Purpose:** Cancel a pending request (optional)

**Request:**
```bash
curl -X POST http://localhost:5000/api/issues/cancel-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -d '{
    "requestId": "request-uuid"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Request cancelled successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Issuance request not found or already processed"
}
```

**Test Cases:**
- ✅ Valid pending request → Cancels successfully
- ✅ Already completed request → Returns error
- ✅ Student notified → Cancellation notification sent

---

## 🔑 Authentication Notes

**Student Token Format:**
```javascript
// Generated from authentication
{
  "id": "student-uuid",
  "email": "student@university.edu",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Admin/Librarian Token Format:**
```javascript
{
  "id": "admin-uuid",
  "email": "admin@university.edu", 
  "role": "admin" | "librarian",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 📊 Database Schema Reference

### issuance_requests Table
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| student_id | UUID | FK to users |
| student_name | TEXT | Denormalized for performance |
| student_email | TEXT | For notifications |
| book_id | UUID | FK to books |
| book_title | TEXT | Denormalized |
| book_isbn | TEXT | ISBN for lookup |
| qr_code | TEXT | Original QR scanned |
| status | TEXT | pending\|completed\|cancelled\|expired |
| completed_by | UUID | Admin who completed |
| issue_id | UUID | FK to transactions |
| created_at | TIMESTAMP | Request creation |
| completed_at | TIMESTAMP | When issued |
| expires_at | TIMESTAMP | Auto-expires after 5 min |

### Transactions Table (Updated)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary Key |
| user_id | UUID | Student |
| book_id | UUID | Book issued |
| transaction_type | TEXT | 'issue' |
| status | TEXT | 'completed' |
| issued_date | TIMESTAMP | When issued |
| due_date | TIMESTAMP | 14 days from issue |

---

## ⚙️ Backend Configuration Required

Ensure `.env` contains:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

---

## 🚀 Testing Workflow

### Step 1: Apply Migration
```bash
cd backend
npm run migrate
# OR manually in Supabase SQL Editor
```

### Step 2: Start Backend
```bash
cd backend
npm run dev
```

### Step 3: Test Endpoints (In Order)
1. **Test book scanning** → POST `/api/books/scan-qr`
2. **Test request creation** → POST `/api/issues/create-request`
3. **Test pending requests** → GET `/api/issues/pending-requests`
4. **Test completion** → POST `/api/issues/complete-request`
5. **Test cancellation** → POST `/api/issues/cancel-request`

### Step 4: Verify in Supabase
- Check `issuance_requests` table for created requests
- Check `transactions` table for issued books
- Check `notifications` table for sent notifications

---

## 📱 Mobile Integration Test

From **QRScannerScreen**:
```javascript
// 1. Scan book QR
const bookDetails = await booksService.getBookByQRCode(qrCode);

// 2. Navigate to biometric verification
// 3. Create request
const response = await issuesService.createIssuanceRequest({
  bookId: bookDetails.id,
  qrCode: qrCode,
  bookTitle: bookDetails.title,
  bookIsbn: bookDetails.isbn
});
```

---

## 🖥️ Admin Integration Test

From **AdminIssueBooks**:
```javascript
// 1. Fetch pending requests (every 5s)
const requests = await issuesService.getPendingIssuanceRequests();

// 2. When admin scans book
const result = await issuesService.completeIssuanceRequest({
  requestId: selectedRequest.id,
  bookQrCode: scannedQRCode
});
```

---

## ✅ Success Criteria

- [ ] Migration table created with all columns and indexes
- [ ] RLS policies enforce row-level security
- [ ] All 4 controller functions implemented
- [ ] All endpoints return correct status codes
- [ ] Database transactions are atomic
- [ ] Requests expire after 5 minutes
- [ ] Notifications sent to students and admins
- [ ] Book availability decremented correctly
- [ ] Mobile integration works end-to-end
- [ ] Admin dashboard auto-refreshes correctly

---

## 🐛 Troubleshooting

### "Request expired" error
- Check system clock is correct
- Verify `expires_at` > current time in database

### "Book not found" when scanning
- Verify QR code format in `qr_codes` table
- Check ISBN in `books` table

### Auth errors
- Ensure JWT token is valid
- Verify token contains correct `role` field
- Check `SUPABASE_SERVICE_ROLE_KEY` for admin operations

### No pending requests showing
- Verify request was created successfully
- Check `issuance_requests` table directly
- Ensure admin has correct role in `users` table

---

## 📝 Notes

- Requests auto-expire after 5 minutes
- Admin can scan ANY available book (not just requested one)
- 14-day borrow period for issued books
- Default 5-book borrow limit per student
- Students cannot borrow if pending fines exist
