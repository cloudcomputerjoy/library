# 📚 Smart Library Management System - API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.smartlibrary.com/api/v1`  
**Updated:** April 2026

---

## 🔑 Authentication

### API Key Authentication
All endpoints require either JWT token or API Key authentication.

**Request Header:**
```
Authorization: Bearer <JWT_TOKEN>
X-API-Key: <API_KEY> (optional alternative)
X-API-Secret: <API_SECRET> (if using API Key)
```

### JWT Token Generation
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "securepassword"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refresh_token_here",
  "expires_in": 86400,
  "user": {
    "id": "user_uuid",
    "name": "John Doe",
    "role": "student"
  }
}
```

---

## 🌐 AUTHENTICATION ENDPOINTS

### 1. User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "phone": "+880-1700000000",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePassword@123",
  "confirm_password": "SecurePassword@123"
}

Response (201):
{
  "message": "Registration successful. OTP sent to email.",
  "user_id": "uuid",
  "otp_expires_in": 300
}
```

### 2. Email OTP Verification
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "student@university.edu",
  "otp": "123456",
  "type": "signup"
}

Response (200):
{
  "message": "Email verified successfully",
  "access_token": "jwt_token_here",
  "user": { ... }
}
```

### 3. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "password"
}

Response (200):
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 86400,
  "user": { ... }
}
```

### 4. Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "token_here"
}

Response (200):
{
  "access_token": "new_jwt_token",
  "expires_in": 86400
}
```

### 5. Logout
```http
POST /auth/logout
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "Logged out successfully"
}
```

---

## 👤 USER MANAGEMENT ENDPOINTS

### 1. Get User Profile
```http
GET /users/profile
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "id": "user_uuid",
  "email": "student@university.edu",
  "first_name": "John",
  "last_name": "Doe",
  "student_id": "STU2024001",
  "qr_code_id": "QR12345",
  "rfid_card_id": "RFID98765",
  "profile_image_url": "https://...",
  "role": "student",
  "is_active": true,
  "is_suspended": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Update User Profile
```http
PUT /users/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+880-1700000000",
  "profile_image_url": "https://..."
}

Response (200):
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### 3. Get All Users (Admin only)
```http
GET /users?role=student&is_active=true&page=1&limit=20
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "total": 1250,
  "page": 1,
  "limit": 20,
  "users": [ ... ]
}
```

### 4. Get User by ID (Admin only)
```http
GET /users/{user_id}
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "user": { ... }
}
```

### 5. Suspend/Block User (Admin only)
```http
PATCH /users/{user_id}/suspend
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "suspension_reason": "Multiple overdue items",
  "duration_days": 7
}

Response (200):
{
  "message": "User suspended successfully"
}
```

### 6. Bulk Import Users (Admin only)
```http
POST /users/bulk-import
Authorization: Bearer <ADMIN_JWT>
Content-Type: multipart/form-data

Form Data:
- file: <Excel CSV file>
- role: "student"

Response (200):
{
  "message": "Import initiated",
  "total_records": 500,
  "successful": 498,
  "failed": 2,
  "errors": [ ... ]
}
```

### 7. Delete User (Admin only)
```http
DELETE /users/{user_id}
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "message": "User deleted successfully"
}
```

---

## 🔐 API KEY MANAGEMENT

### 1. Create API Key
```http
POST /api-keys
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "key_name": "Mobile App Key",
  "permissions": ["read", "write"],
  "rate_limit_per_minute": 100
}

Response (201):
{
  "api_key": "sk_live_abc123...",
  "api_secret": "sk_secret_xyz789...",
  "message": "⚠️ Save your secret key securely. You won't see it again."
}
```

### 2. List API Keys
```http
GET /api-keys
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "keys": [
    {
      "id": "key_uuid",
      "key_name": "Mobile App Key",
      "api_key": "sk_live_abc123...",
      "permissions": ["read", "write"],
      "is_active": true,
      "last_used": "2024-04-03T10:30:00Z",
      "created_at": "2024-02-01T15:00:00Z"
    }
  ]
}
```

### 3. Revoke API Key
```http
DELETE /api-keys/{key_id}
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "API key revoked successfully"
}
```

---

## 🎫 QR CODE SYSTEM (Dynamic)

### 1. Generate Dynamic QR Code
```http
POST /qr/generate
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "user_id": "user_uuid"
}

Response (200):
{
  "qr_token": "encrypted_token_here",
  "qr_data": {
    "user_id": "user_uuid",
    "timestamp": 1712145678,
    "token": "hash_value"
  },
  "qr_image_url": "https://api.smartlibrary.com/qr/image/token",
  "expires_in": 15,
  "expires_at": "2024-04-03T10:20:45Z"
}
```

### 2. Validate QR Token (Scan)
```http
POST /qr/validate
Content-Type: application/json

{
  "qr_token": "encrypted_token_here"
}

Response (200):
{
  "is_valid": true,
  "user_id": "user_uuid",
  "user_name": "John Doe",
  "action": "entry"
}

Response (400):
{
  "is_valid": false,
  "error": "Token expired or invalid",
  "error_code": "QR_EXPIRED"
}
```

### 3. Get QR Code History
```http
GET /qr/history?limit=10&offset=0
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 145,
  "qr_scans": [
    {
      "id": "scan_uuid",
      "action": "entry",
      "scanned_at": "2024-04-03T09:15:00Z",
      "location": "Main Gate"
    }
  ]
}
```

---

## 📚 BOOK MANAGEMENT ENDPOINTS

### 1. Create Book
```http
POST /books
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "category": "Fiction",
  "tags": ["classic", "american", "romance"],
  "shelf_number": "A-12-03",
  "total_copies": 5,
  "description": "A novel of the Jazz Age",
  "cover_image_url": "https://...",
  "pdf_url": "https://..."
}

Response (201):
{
  "message": "Book created successfully",
  "book": {
    "id": "book_uuid",
    "title": "The Great Gatsby",
    "isbn": "978-0743273565",
    "available_copies": 5,
    "total_copies": 5
  }
}
```

### 2. Get All Books
```http
GET /books?category=Fiction&search=gatsby&available_only=true&page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 450,
  "page": 1,
  "limit": 20,
  "books": [
    {
      "id": "book_uuid",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0743273565",
      "category": "Fiction",
      "available_copies": 3,
      "total_copies": 5,
      "cover_image_url": "https://..."
    }
  ]
}
```

### 3. Get Book by ID
```http
GET /books/{book_id}
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "book": {
    "id": "book_uuid",
    "title": "...",
    "author": "...",
    "isbn": "...",
    "description": "...",
    "available_copies": 3,
    "total_copies": 5,
    "copies": [
      {
        "copy_number": 1,
        "barcode": "BOOK001",
        "status": "available"
      }
    ],
    "reviews": [ ... ],
    "similar_books": [ ... ]
  }
}
```

### 4. Update Book
```http
PUT /books/{book_id}
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "title": "The Great Gatsby (Revised Edition)",
  "shelf_number": "A-12-04"
}

Response (200):
{
  "message": "Book updated successfully"
}
```

### 5. Search Books (Advanced)
```http
GET /books/search?q=gatsby&filters[category]=Fiction&filters[author]=Fitzgerald&sort=relevance
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "results": [ ... ]
}
```

### 6. Bulk Import Books (CSV)
```http
POST /books/bulk-import
Authorization: Bearer <ADMIN_JWT>
Content-Type: multipart/form-data

Form Data:
- file: <CSV file with ISBN, title, author, etc.>

Response (200):
{
  "message": "Import successful",
  "total": 1000,
  "successful": 995,
  "failed": 5
}
```

### 7. Delete Book
```http
DELETE /books/{book_id}
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "message": "Book deleted successfully"
}
```

---

## 🔄 TRANSACTION ENDPOINTS (Issue/Return)

### 1. Issue Book (One-Click)
```http
POST /transactions/issue
Authorization: Bearer <LIBRARIAN_JWT>
Content-Type: application/json

{
  "user_id": "user_uuid",
  "book_copy_id": "book_copy_uuid",
  "duration_days": 14
}

Response (200):
{
  "message": "Book issued successfully",
  "transaction": {
    "id": "transaction_uuid",
    "user_id": "user_uuid",
    "book": { ... },
    "issue_date": "2024-04-03T10:30:00Z",
    "due_date": "2024-04-17T10:30:00Z",
    "fine_applicable": 10.00
  }
}
```

### 2. Return Book
```http
POST /transactions/return
Authorization: Bearer <LIBRARIAN_JWT>
Content-Type: application/json

{
  "transaction_id": "transaction_uuid"
}

Response (200):
{
  "message": "Book returned successfully",
  "transaction": { ... },
  "fine_amount": 0,
  "book_status": "available"
}
```

### 3. Get User's Issued Books
```http
GET /users/{user_id}/issued-books
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 3,
  "issued_books": [
    {
      "transaction_id": "transaction_uuid",
      "book": { ... },
      "issue_date": "2024-03-20T10:30:00Z",
      "due_date": "2024-04-03T10:30:00Z",
      "is_overdue": true,
      "fine_amount": 25.00
    }
  ]
}
```

### 4. Get Overdue Books (Admin)
```http
GET /transactions/overdue?limit=50&offset=0
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "total": 42,
  "overdue_books": [ ... ]
}
```

### 5. Bulk Return (Multiple Books)
```http
POST /transactions/bulk-return
Authorization: Bearer <LIBRARIAN_JWT>
Content-Type: application/json

{
  "transaction_ids": ["id1", "id2", "id3"]
}

Response (200):
{
  "message": "Bulk return successful",
  "successful": 3,
  "failed": 0
}
```

---

## 📅 RESERVATION & QUEUE SYSTEM

### 1. Reserve Book
```http
POST /reservations
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "book_id": "book_uuid",
  "priority_level": 0
}

Response (201):
{
  "message": "Book reserved successfully",
  "reservation": {
    "id": "reservation_uuid",
    "book_id": "book_uuid",
    "queue_position": 5,
    "status": "pending",
    "expires_at": "2024-05-03T23:59:59Z"
  }
}
```

### 2. Cancel Reservation
```http
DELETE /reservations/{reservation_id}
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "Reservation cancelled successfully"
}
```

### 3. Get User's Reservations
```http
GET /users/reservations
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 2,
  "reservations": [ ... ]
}
```

### 4. Get Reservation Queue (Admin)
```http
GET /books/{book_id}/queue
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "book": { ... },
  "queue": [
    {
      "queue_position": 1,
      "user": { ... },
      "is_vip": false,
      "reserved_at": "2024-04-01T10:30:00Z"
    }
  ]
}
```

---

## 🚪 ATTENDANCE & ENTRY/EXIT SYSTEM

### 1. Record Entry via QR
```http
POST /attendance/entry
Content-Type: application/json

{
  "qr_token": "token_here",
  "location": "Main Gate"
}

Response (200):
{
  "message": "Entry recorded successfully",
  "user_name": "John Doe",
  "entry_time": "2024-04-03T09:15:00Z",
  "attendance_log": {
    "id": "log_uuid",
    "user_id": "user_uuid",
    "entry_time": "2024-04-03T09:15:00Z"
  }
}
```

### 2. Record Entry via RFID
```http
POST /attendance/entry-rfid
Content-Type: application/json

{
  "rfid_code": "RFID98765",
  "location": "Main Gate",
  "reader_id": "READER_001"
}

Response (200):
{
  "message": "Entry recorded via RFID",
  "user_name": "John Doe"
}
```

### 3. Record Exit
```http
POST /attendance/exit
Content-Type: application/json

{
  "qr_token": "token_here",
  "location": "Main Gate"
}

Response (200):
{
  "message": "Exit recorded successfully",
  "user_name": "John Doe",
  "duration_inside": "3 hours 45 minutes",
  "entry_time": "2024-04-03T09:15:00Z",
  "exit_time": "2024-04-03T13:00:00Z"
}
```

### 4. Get User's Attendance History
```http
GET /attendance/history?date_from=2024-04-01&date_to=2024-04-30
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 25,
  "attendance_logs": [
    {
      "entry_time": "2024-04-03T09:15:00Z",
      "exit_time": "2024-04-03T13:00:00Z",
      "duration_minutes": 225
    }
  ]
}
```

### 5. Get Live Students in Library (Admin)
```http
GET /attendance/live-inside
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "current_count": 42,
  "students_inside": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "entry_time": "2024-04-03T09:15:00Z",
      "location": "Main Gate",
      "duration_so_far": "3 hours 45 minutes"
    }
  ]
}
```

### 6. Get Daily Entry/Exit Statistics (Admin)
```http
GET /attendance/statistics?date=2024-04-03
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "date": "2024-04-03",
  "total_entries": 245,
  "total_exits": 238,
  "peak_hours": [
    { "hour": "10:00-11:00", "count": 35 },
    { "hour": "14:00-15:00", "count": 42 }
  ],
  "average_duration_minutes": 180
}
```

---

## 💰 FINE & PAYMENT SYSTEM

### 1. Get User's Fines
```http
GET /fines
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total_amount": 75.00,
  "total_fines": 3,
  "pending_fines": 2,
  "paid_fines": 1,
  "fines": [
    {
      "id": "fine_uuid",
      "transaction_id": "transaction_uuid",
      "amount": 25.00,
      "reason": "14 days overdue",
      "is_paid": false,
      "created_at": "2024-04-01T10:30:00Z"
    }
  ]
}
```

### 2. Initiate Payment (SSLCommerz)
```http
POST /payments/initiate
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fine_ids": ["fine_uuid1", "fine_uuid2"],
  "payment_method": "card"
}

Response (200):
{
  "message": "Payment gateway initialized",
  "payment_url": "https://securepay.sslcommerz.com/...",
  "session_key": "session_key_here",
  "amount": 75.00
}
```

### 3. Payment Callback (SSLCommerz)
```http
POST /payments/callback
Content-Type: application/x-www-form-urlencoded

{
  "status": "VALID",
  "tran_id": "transaction_id",
  "amount": "75.00",
  "card_type": "VISA"
}

Response (200):
{
  "message": "Payment processed successfully",
  "payment_id": "payment_uuid"
}
```

### 4. Request Fine Waiver (Student)
```http
POST /fines/{fine_id}/waiver-request
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "reason": "Financial hardship"
}

Response (200):
{
  "message": "Waiver request submitted for admin review"
}
```

### 5. Approve/Reject Waiver (Admin)
```http
PATCH /fines/{fine_id}/waiver
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "action": "approve",
  "notes": "Approved due to student's condition"
}

Response (200):
{
  "message": "Fine waived successfully"
}
```

---

## 📄 FILE SHARING & PRINT SYSTEM

### 1. Upload File
```http
POST /file-shares/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Form Data:
- file: <PDF/DOC file>
- subject: "Data Science"
- description: "Complete notes and assignments"
- tags: ["notes", "important"]
- shared_with: "public"

Response (201):
{
  "message": "File uploaded successfully",
  "file_share": {
    "id": "file_share_uuid",
    "file_name": "data_science_notes.pdf",
    "file_url": "https://cdn.smartlibrary.com/files/...",
    "file_size_bytes": 5242880,
    "page_count": 45,
    "cloudflare_file_id": "cf_file_id",
    "auto_delete_at": "2024-04-04T10:30:00Z"
  }
}
```

### 2. Get All File Shares
```http
GET /file-shares?subject=DataScience&sort=newest&page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 234,
  "files": [
    {
      "id": "file_share_uuid",
      "file_name": "...",
      "uploader": { ... },
      "page_count": 45,
      "download_count": 125,
      "created_at": "2024-04-03T10:30:00Z",
      "auto_delete_at": "2024-04-04T10:30:00Z"
    }
  ]
}
```

### 3. Download File
```http
GET /file-shares/{file_id}/download
Authorization: Bearer <JWT_TOKEN>

Response (200):
[File binary data with headers]

Response Headers:
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="data_science_notes.pdf"
```

### 4. Request File Printing
```http
POST /file-shares/{file_id}/print
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "total_pages": 45,
  "copies": 1,
  "page_range": "1-45",
  "priority": "normal"
}

Response (201):
{
  "message": "Print job created",
  "print_job": {
    "id": "print_job_uuid",
    "status": "queued",
    "position_in_queue": 3,
    "estimated_ready_time": "2024-04-03T11:30:00Z",
    "total_pages": 45,
    "copies": 1,
    "cost": 2.25
  }
}
```

### 5. Get Print Job Status
```http
GET /print-jobs/{print_job_id}
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "print_job": {
    "id": "print_job_uuid",
    "status": "printing",
    "file_details": { ... },
    "total_pages": 45,
    "copies": 1,
    "cost": 2.25,
    "start_time": "2024-04-03T10:45:00Z",
    "estimated_completion": "2024-04-03T11:00:00Z",
    "printer_id": "PRINTER_001"
  }
}
```

### 6. Print Job Completion & Collection
```http
POST /print-jobs/{print_job_id}/collected
Authorization: Bearer <LIBRARIAN_JWT>
Content-Type: application/json

{
  "collected_by": "user_uuid"
}

Response (200):
{
  "message": "Print job marked as collected",
  "receipt": {
    "job_id": "print_job_uuid",
    "file_name": "data_science_notes.pdf",
    "total_pages": 45,
    "copies": 1,
    "cost": 2.25,
    "collected_at": "2024-04-03T11:05:00Z"
  }
}
```

### 7. Get User's Print History
```http
GET /print-jobs/my-jobs?status=collected
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 12,
  "print_jobs": [
    {
      "id": "print_job_uuid",
      "file_name": "...",
      "total_pages": 45,
      "copies": 1,
      "cost": 2.25,
      "collected_at": "2024-04-03T11:05:00Z"
    }
  ]
}
```

### 8. Delete File (Auto after 30 mins)
```http
DELETE /file-shares/{file_id}
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "File scheduled for deletion",
  "will_delete_at": "2024-04-03T11:00:00Z"
}
```

---

## 🔔 NOTIFICATIONS

### 1. Get User Notifications
```http
GET /notifications?limit=20&is_read=false
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "total": 5,
  "unread_count": 3,
  "notifications": [
    {
      "id": "notification_uuid",
      "title": "Book Due Tomorrow",
      "message": "...",
      "notification_type": "due_reminder",
      "is_read": false,
      "created_at": "2024-04-03T10:00:00Z"
    }
  ]
}
```

### 2. Mark Notification as Read
```http
PATCH /notifications/{notification_id}/read
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "Notification marked as read"
}
```

### 3. Mark All as Read
```http
PATCH /notifications/mark-all-read
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "message": "All notifications marked as read"
}
```

---

## 🎫 RFID CARD SYSTEM

### 1. Assign RFID Card to User (Admin)
```http
POST /rfid/assign
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "user_id": "user_uuid",
  "rfid_code": "RFID98765"
}

Response (200):
{
  "message": "RFID card assigned successfully",
  "rfid_card": {
    "id": "rfid_card_uuid",
    "rfid_code": "RFID98765",
    "user_id": "user_uuid",
    "assigned_at": "2024-04-03T10:30:00Z"
  }
}
```

### 2. RFID Scan Registration
```http
POST /rfid/scan
Content-Type: application/json

{
  "rfid_code": "RFID98765",
  "reader_location": "Main Gate",
  "scan_type": "entry",
  "signal_strength": 85
}

Response (200):
{
  "message": "RFID scan recorded",
  "user_name": "John Doe",
  "action": "entry",
  "timestamp": "2024-04-03T09:15:00Z"
}
```

### 3. Get RFID Scan Logs (Admin)
```http
GET /rfid/logs?date_from=2024-04-01&location=Main%20Gate&limit=100
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "total": 458,
  "logs": [
    {
      "user_name": "John Doe",
      "rfid_code": "RFID98765",
      "scan_type": "entry",
      "location": "Main Gate",
      "timestamp": "2024-04-03T09:15:00Z",
      "signal_strength": 85
    }
  ]
}
```

### 4. Deactivate RFID Card (Admin)
```http
PATCH /rfid/{rfid_card_id}/deactivate
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "message": "RFID card deactivated"
}
```

---

## 🤖 AI & RECOMMENDATIONS

### 1. Get Personalized Recommendations
```http
GET /recommendations?limit=10
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "recommendations": [
    {
      "book_id": "book_uuid",
      "title": "...",
      "author": "...",
      "reason": "Similar to books you've read",
      "score": 0.92,
      "cover_image_url": "..."
    }
  ]
}
```

### 2. Get Trending Books
```http
GET /books/trending?limit=10
Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "trending_books": [ ... ]
}
```

---

## 📊 DASHBOARD & ANALYTICS

### 1. Get Admin Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "dashboard": {
    "total_users": 4250,
    "active_users_today": 1205,
    "total_books": 8500,
    "available_books": 6240,
    "issued_books": 2100,
    "overdue_books": 42,
    "today_entries": 1205,
    "today_exits": 1198,
    "currently_inside": 45,
    "total_revenue": 3500.00,
    "pending_fines": 42500.00,
    "alerts": [
      {
        "alert_type": "overdue",
        "count": 42,
        "severity": "high"
      }
    ]
  }
}
```

### 2. Get Attendance Analytics
```http
GET /analytics/attendance?date_from=2024-04-01&date_to=2024-04-30
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "analytics": {
    "total_entries": 25480,
    "total_exits": 25320,
    "average_daily_visitors": 850,
    "peak_hours": [ ... ],
    "peak_days": [ ... ],
    "average_duration_minutes": 180
  }
}
```

### 3. Generate Report (PDF/Excel)
```http
POST /reports/generate
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "report_type": "monthly_summary",
  "date_from": "2024-04-01",
  "date_to": "2024-04-30",
  "export_format": "pdf"
}

Response (200):
[PDF File]
```

---

## 🔐 SECURITY & ACTIVITY LOGS

### 1. Get Activity Logs (Admin)
```http
GET /activity-logs?user_id=user_uuid&limit=50&offset=0
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "total": 450,
  "logs": [
    {
      "id": "log_uuid",
      "user_name": "John Doe",
      "action": "issued_book",
      "resource_type": "book",
      "timestamp": "2024-04-03T10:30:00Z",
      "ip_address": "192.168.1.100"
    }
  ]
}
```

### 2. Get Admin Alerts
```http
GET /admin/alerts?severity=high&is_resolved=false
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "total": 12,
  "alerts": [
    {
      "id": "alert_uuid",
      "alert_type": "suspicious_activity",
      "severity": "high",
      "title": "Multiple failed login attempts",
      "description": "...",
      "created_at": "2024-04-03T10:30:00Z"
    }
  ]
}
```

---

## 🔧 SETTINGS & CONFIGURATION

### 1. Get Library Settings (Admin)
```http
GET /settings
Authorization: Bearer <ADMIN_JWT>

Response (200):
{
  "settings": [
    {
      "setting_key": "library_opening_time",
      "setting_value": "09:00 AM",
      "description": "Library opening time"
    },
    {
      "setting_key": "fine_per_day",
      "setting_value": 5.00
    },
    {
      "setting_key": "qr_expiry_seconds",
      "setting_value": 15
    },
    {
      "setting_key": "book_issue_duration_days",
      "setting_value": 14
    }
  ]
}
```

### 2. Update Settings (Admin)
```http
PUT /settings
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "settings": {
    "library_opening_time": "08:00 AM",
    "fine_per_day": 7.50,
    "qr_expiry_seconds": 20,
    "language": "bangla"
  }
}

Response (200):
{
  "message": "Settings updated successfully"
}
```

---

## 🔌 SOCKET.IO REAL-TIME EVENTS

### Connection
```javascript
io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Connected to library system' });
});
```

### Events Emitted by Server

**Entry Success**
```javascript
socket.on('entry_success', {
  user_name: "John Doe",
  entry_time: "2024-04-03T09:15:00Z",
  location: "Main Gate"
});
```

**Exit Recorded**
```javascript
socket.on('exit_success', {
  user_name: "John Doe",
  exit_time: "2024-04-03T13:00:00Z",
  duration_inside: "3 hours 45 minutes"
});
```

**Book Available**
```javascript
socket.on('book_available', {
  user_id: "user_uuid",
  book_title: "The Great Gatsby",
  book_id: "book_uuid",
  message: "Book you reserved is now available"
});
```

**Due Date Reminder**
```javascript
socket.on('due_reminder', {
  user_id: "user_uuid",
  book_title: "...",
  due_date: "2024-04-10T23:59:59Z",
  days_remaining: 7
});
```

**Print Job Ready**
```javascript
socket.on('print_ready', {
  user_id: "user_uuid",
  job_id: "print_job_uuid",
  message: "Your print is ready for collection"
});
```

**Live Occupancy Update**
```javascript
socket.on('occupancy_update', {
  current_inside: 45,
  timestamp: "2024-04-03T10:30:00Z"
});
```

### Events Received by Server

**Join Entry/Exit Channel**
```javascript
socket.emit('join_attendance_channel');
```

**Subscribe to Notifications**
```javascript
socket.emit('subscribe_notifications');
```

---

## ⚠️ ERROR RESPONSES

### Common Error Codes
```json
{
  "400": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters"
  },
  "401": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  },
  "403": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  },
  "404": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  },
  "409": {
    "code": "CONFLICT",
    "message": "Resource already exists"
  },
  "429": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later"
  },
  "500": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An internal server error occurred"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QR_TOKEN",
    "message": "QR token has expired",
    "error_details": {
      "token_generated_at": "2024-04-03T10:00:00Z",
      "token_expired_at": "2024-04-03T10:00:15Z"
    }
  }
}
```

---

## 📋 RATE LIMITING

- **Default:** 60 requests per minute per IP
- **Authenticated Users:** 300 requests per minute
- **API Key:** Customizable (default 100/minute)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1712151015
```

---

## 📚 PAGINATION

All list endpoints support pagination:
```
?page=1&limit=20&sort=-created_at&filter[status]=active
```

**Response:**
```json
{
  "total": 1250,
  "page": 1,
  "limit": 20,
  "total_pages": 63,
  "has_next": true,
  "has_previous": false,
  "data": [ ... ]
}
```

---

**Last Updated:** April 3, 2026  
**Maintained By:** Smart Library Development Team
