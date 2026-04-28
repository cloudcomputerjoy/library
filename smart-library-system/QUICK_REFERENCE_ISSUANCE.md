# Quick Reference - Two-Step Issuance System

## 🎯 What Was Built

A complete two-step book issuance system:
- **Student**: Scan book QR → Biometric verification → Request created
- **Admin**: Auto-fetch pending → Scan any book QR → Book issued
- **Database**: New `issuance_requests` table with auto-expiration
- **API**: 5 new endpoints for the complete flow

---

## 📍 Key Files Location

### Backend
```
backend/
  ├── migrations/
  │   └── 001_add_issuance_requests_table.sql    ← Apply this first
  ├── scripts/
  │   └── migrate.js                             ← Run migrations
  ├── src/routes/
  │   ├── issue.js                               ← 4 new endpoints
  │   └── books.js                               ← 1 new endpoint
  ├── src/controllers/
  │   └── issueController.js                     ← 4 new methods
  └── ISSUANCE_API_TESTING_GUIDE.md              ← Test all endpoints
```

### Mobile
```
mobile/
  └── src/
      ├── screens/
      │   ├── QRScannerScreen.js                 ← Real scanning
      │   └── BiometricVerificationScreen.js     ← Verification
      ├── services/
      │   ├── issuesService.js                   ← 4 new functions
      │   └── booksService.js                    ← Book QR scan
      └── navigation/
          └── AppStack.js                         ← New route
```

### Admin
```
admin/
  └── src/pages/
      └── AdminIssueBooks.jsx                    ← Pending requests panel
```

---

## 🚀 Quick Start (5 Steps)

### 1. Apply Migration
```bash
# Manually:
1. Supabase Dashboard → SQL Editor
2. Paste: backend/migrations/001_add_issuance_requests_table.sql
3. Click "RUN"

# Or automated:
cd backend && npm run migrate
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Test API Endpoints
```bash
# See ISSUANCE_API_TESTING_GUIDE.md for all tests
curl -X POST http://localhost:5000/api/books/scan-qr \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "BOOK-123456"}'
```

### 4. Start Mobile
```bash
cd mobile
npm run dev
```

### 5. Test End-to-End
- Scan book QR on mobile
- Verify biometric screen appears
- Check admin dashboard auto-fetches pending

---

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/books/scan-qr` | Student scans book, get details |
| POST | `/api/issues/create-request` | Student creates issuance request |
| GET | `/api/issues/pending-requests` | Admin fetches pending requests |
| POST | `/api/issues/complete-request` | Admin issues book |
| POST | `/api/issues/cancel-request` | Cancel pending request |

---

## 🔑 Authentication

Add header to all endpoints:
```
Authorization: Bearer {jwt_token}
```

Token must have `role` field:
- `"student"` - Students create requests
- `"librarian"` or `"admin"` - Can view/complete requests

---

## 💡 Key Features

✅ **5-minute auto-expiration** - Requests auto-expire if not completed  
✅ **Admin flexibility** - Can issue ANY available book, not just requested  
✅ **Auto-refresh** - Admin dashboard updates every 5 seconds  
✅ **RLS policies** - Students see own, admins see all  
✅ **Transaction tracking** - Every issue creates transaction record  
✅ **Notifications** - Student notified when book issued  
✅ **Validation** - Checks fines, borrow limit, book availability  

---

## 📋 Database Schema

### New Table: issuance_requests
```sql
id                 UUID (Primary Key)
student_id         UUID (Student who requested)
student_name       TEXT
student_email      TEXT
book_id            UUID (Book requested)
book_title         TEXT
book_isbn          TEXT
qr_code            TEXT
status             TEXT ('pending', 'completed', 'cancelled', 'expired')
completed_by       UUID (Admin who completed)
issue_id           UUID (Transaction reference)
created_at         TIMESTAMP
completed_at       TIMESTAMP
expires_at         TIMESTAMP (Auto 5 minutes)
updated_at         TIMESTAMP
```

---

## 🧪 Test Cases (Quick)

### 1. Scan Book QR
```bash
curl -X POST http://localhost:5000/api/books/scan-qr \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "BOOK-123456"}'
```
Expected: `{ success: true, book: {...} }`

### 2. Create Request (as Student)
```bash
curl -X POST http://localhost:5000/api/issues/create-request \
  -H "Authorization: Bearer {student_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "uuid",
    "qrCode": "BOOK-123456",
    "bookTitle": "The Great Gatsby",
    "bookIsbn": "978-0743273565"
  }'
```
Expected: `{ success: true, requestId: "uuid" }`

### 3. Get Pending (as Admin)
```bash
curl -X GET http://localhost:5000/api/issues/pending-requests \
  -H "Authorization: Bearer {admin_token}"
```
Expected: `{ success: true, requests: [...], count: n }`

### 4. Complete Request (as Admin)
```bash
curl -X POST http://localhost:5000/api/issues/complete-request \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "uuid",
    "bookQrCode": "BOOK-999999"
  }'
```
Expected: `{ success: true, issueId: "uuid" }`

---

## 🔗 Data Flow

```
Student QRScanner
    ↓
Scan Book QR
    ↓
POST /books/scan-qr ← Get details
    ↓
BiometricVerification Screen
    ↓
Verify Fingerprint/Passcode
    ↓
POST /create-request ← Create request
    ↓
"Request created!" (expires in 5 min)
    
                        Admin Dashboard
                            ↓
                        GET /pending-requests (every 5s)
                            ↓
                        Display list
                            ↓
                        Admin selects
                            ↓
                        Scan book QR
                            ↓
                        POST /complete-request
                            ↓
                        Book issued ✅
                        Student notified
```

---

## ⚙️ Configuration

Ensure `.env` has:
```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_secret
NODE_ENV=development
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Table not found" | Apply migration first |
| "Book not found" | QR code doesn't exist in qr_codes table |
| "Authentication required" | Add Authorization header with JWT |
| "Borrow limit exceeded" | Student already has 5 books |
| "Outstanding fine" | Student must pay fine first |
| Requests not auto-expiring | Check database time |
| Admin can't see requests | Verify user has librarian/admin role |

---

## 📖 Full Docs

- **Complete Implementation**: `TWO_STEP_ISSUANCE_IMPLEMENTATION.md`
- **API Testing Guide**: `ISSUANCE_API_TESTING_GUIDE.md`
- **Backend README**: `backend/README.md`

---

## ✅ Status

**Implementation: 100% Complete**

- ✅ Database migration created
- ✅ Backend API endpoints added
- ✅ Controller functions implemented
- ✅ Mobile screens updated
- ✅ Admin dashboard enhanced
- ✅ Testing guide provided

Ready for deployment and testing!
