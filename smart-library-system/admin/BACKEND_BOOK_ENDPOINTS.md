# Backend API Endpoints - Book Management System

## Required Endpoints

### 1. POST /api/admin/books/add
**Purpose:** Add a new book with multiple copies to the system

**Request Body:**
```javascript
{
  isbn: "9780135957073",
  title: "JavaScript Design Patterns",
  author: "Addy Osmani",
  publisher: "O'Reilly Media",
  publishedDate: "2012",
  pages: 268,
  category: "Technology",
  imageUrl: "https://...",
  description: "Learn JavaScript Design Patterns...",
  quantity: 5,
  copies: [
    { qrCode: "BK-1713318751234-ABC123", status: "available" },
    { qrCode: "BK-1713318751234-ABC124", status: "available" },
    { qrCode: "BK-1713318751234-ABC125", status: "available" },
    { qrCode: "BK-1713318751234-ABC126", status: "available" },
    { qrCode: "BK-1713318751234-ABC127", status: "available" }
  ]
}
```

**Response:**
```javascript
{
  success: true,
  message: "Book added successfully with 5 copies",
  book: {
    id: "uuid-123",
    isbn: "9780135957073",
    title: "JavaScript Design Patterns",
    quantity: 5,
    createdAt: "2024-04-16T10:30:00Z"
  }
}
```

**Error Responses:**
- **409:** Book already exists → Update quantity instead
- **400:** Missing required fields
- **500:** Database error

**Notes:**
- Check if ISBN already exists
- If exists → Update quantity, add new copies
- If new → Create book record, then create copies
- Each copy record stores: qr_code, isbn, book_id, status

---

### 2. GET /api/admin/books
**Purpose:** Retrieve all books with pagination and filtering

**Query Parameters:**
```
?page=1
&limit=10
&search=JavaScript    (search by title/author)
&category=Technology  (filter by category)
&sortBy=title         (sort field: title, author, createdAt)
&sortOrder=asc        (asc or desc)
```

**Response:**
```javascript
{
  success: true,
  books: [
    {
      id: "uuid-123",
      isbn: "9780135957073",
      title: "JavaScript Design Patterns",
      author: "Addy Osmani",
      publisher: "O'Reilly Media",
      pages: 268,
      category: "Technology",
      imageUrl: "https://...",
      quantity: 5,
      availableCopies: 4,      // Not issued
      issuedCopies: 1,         // Currently issued
      status: "active",
      createdAt: "2024-04-16T10:30:00Z",
      updatedAt: "2024-04-16T10:30:00Z"
    },
    // ... more books
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    pages: 3
  }
}
```

**Error Responses:**
- **400:** Invalid query parameters
- **500:** Database error

---

### 3. GET /api/admin/books/:id
**Purpose:** Get detailed information about a specific book with all its copies

**Response:**
```javascript
{
  success: true,
  book: {
    id: "uuid-123",
    isbn: "9780135957073",
    title: "JavaScript Design Patterns",
    author: "Addy Osmani",
    publisher: "O'Reilly Media",
    pages: 268,
    category: "Technology",
    imageUrl: "https://...",
    description: "Learn JavaScript Design Patterns...",
    quantity: 5,
    availableCopies: 4,
    issuedCopies: 1,
    createdAt: "2024-04-16T10:30:00Z",
    copies: [
      {
        id: "copy-uuid-1",
        qrCode: "BK-1713318751234-ABC123",
        status: "available",
        issuedTo: null,
        issuedDate: null,
        dueDate: null
      },
      {
        id: "copy-uuid-2",
        qrCode: "BK-1713318751234-ABC124",
        status: "issued",
        issuedTo: "student-uuid-1",
        issuedDate: "2024-04-10T10:30:00Z",
        dueDate: "2024-04-24T23:59:59Z"
      },
      // ... more copies
    ]
  }
}
```

**Error Responses:**
- **404:** Book not found
- **500:** Database error

---

### 4. PUT /api/admin/books/:id
**Purpose:** Update book details (but NOT copies or quantity)

**Request Body:**
```javascript
{
  title: "JavaScript Design Patterns (2nd Edition)",
  author: "Addy Osmani",
  publisher: "O'Reilly Media",
  pages: 300,
  category: "Technology",
  description: "Updated description...",
  imageUrl: "https://...",
  status: "active"  // or "inactive"
}
```

**Response:**
```javascript
{
  success: true,
  message: "Book updated successfully",
  book: {
    id: "uuid-123",
    isbn: "9780135957073",
    title: "JavaScript Design Patterns (2nd Edition)",
    // ... updated fields
  }
}
```

**Error Responses:**
- **404:** Book not found
- **400:** Invalid data
- **500:** Database error

---

### 5. PUT /api/admin/books/:id/quantity
**Purpose:** Adjust book quantity (add more copies or remove)

**Request Body:**
```javascript
{
  quantityChange: 5,     // Positive to add, negative to remove
  action: "add",         // "add" or "remove"
  copies: [              // Only for "add" action
    { qrCode: "BK-1713318751234-NEW1" },
    { qrCode: "BK-1713318751234-NEW2" },
    // ... new QR codes
  ]
}
```

**Response:**
```javascript
{
  success: true,
  message: "Quantity updated: 5 → 10 copies",
  book: {
    id: "uuid-123",
    isbn: "9780135957073",
    quantity: 10,
    availableCopies: 9
  }
}
```

**Validations:**
- Cannot remove more copies than available
- Cannot add duplicate QR codes
- Preserve existing copy states

---

### 6. DELETE /api/admin/books/:id
**Purpose:** Remove a book and all its copies from the system

**Query Parameters:**
```
?force=false    (if true, delete even if copies are issued)
```

**Response:**
```javascript
{
  success: true,
  message: "Book and 5 copies deleted successfully",
  deletedBook: {
    id: "uuid-123",
    isbn: "9780135957073",
    title: "JavaScript Design Patterns",
    quantity: 5
  }
}
```

**Validations:**
- Check if any copies are issued
- If issued and force=false → Return error with copy count
- If force=true → Delete all (admin override)
- Cascade delete all book_copies records

**Error Responses:**
- **404:** Book not found
- **409:** Book has issued copies (use force=true to override)
- **500:** Database error

---

### 7. DELETE /api/admin/books/:id/copies/:copyId
**Purpose:** Remove a single book copy (for damaged books)

**Response:**
```javascript
{
  success: true,
  message: "Book copy deleted successfully",
  remaining: {
    quantity: 4,
    availableCopies: 3
  }
}
```

**Validations:**
- Copy must be available (not issued)
- Cannot delete if it's the only copy

---

### 8. POST /api/admin/books/search-qr
**Purpose:** Find book by scanning QR code

**Request Body:**
```javascript
{
  qrCode: "BK-1713318751234-ABC123"
}
```

**Response:**
```javascript
{
  success: true,
  book: {
    id: "uuid-123",
    isbn: "9780135957073",
    title: "JavaScript Design Patterns",
    author: "Addy Osmani",
    quantity: 5
  },
  copy: {
    id: "copy-uuid-1",
    qrCode: "BK-1713318751234-ABC123",
    status: "available"
  }
}
```

**Error Responses:**
- **404:** QR code not found
- **500:** Database error

---

### 9. POST /api/admin/books/generate-qr-codes
**Purpose:** Generate batch of QR codes (just the codes, no book association yet)

**Request Body:**
```javascript
{
  quantity: 50,
  format: "html"  // html, pdf, csv, json
}
```

**Response:**
```javascript
{
  success: true,
  codes: [
    "BK-1713318751234-ABC123",
    "BK-1713318751234-ABC124",
    // ... 50 total codes
  ],
  downloadUrl: "https://api.../qr-codes-2024-04-16.html"
}
```

---

## Database Schema

### Users Table (existing)
Keep as is - no changes

### Books Table (NEW)
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isbn VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  publisher VARCHAR(255),
  published_date DATE,
  pages INT,
  category VARCHAR(100),
  image_url TEXT,
  description TEXT,
  quantity INT DEFAULT 0,
  available_copies INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Book_Copies Table (NEW)
```sql
CREATE TABLE book_copies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  qr_code VARCHAR(100) UNIQUE NOT NULL,
  isbn VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  issued_to UUID REFERENCES users(id),
  issued_date TIMESTAMP,
  due_date TIMESTAMP,
  condition VARCHAR(50) DEFAULT 'good',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_book_copies_qr ON book_copies(qr_code);
CREATE INDEX idx_book_copies_isbn ON book_copies(isbn);
CREATE INDEX idx_book_copies_status ON book_copies(status);
```

---

## Implementation Workflow

### Priority 1: POST /api/admin/books/add
```javascript
// Steps in controller:
1. Check if ISBN already exists
2. If exists:
   a. Get existing book record
   b. Update quantity: quantity + new_quantity
   c. Insert new copies with qr_code + isbn
   d. Return success with updated book
3. If new:
   a. Insert into books table
   b. Get inserted book_id
   c. Insert all copies with qr_code + isbn + book_id
   d. Update quantity field on books
   e. Return success with new book
4. Error handling:
   - Duplicate QR codes → Error + message
   - Database errors → Log + return 500
```

### Priority 2: GET /api/admin/books
```javascript
// Steps in controller:
1. Parse query params (page, limit, search, sortBy)
2. Build SQL query with filtering
3. Execute count query for pagination
4. Execute select query with pagination
5. For each book:
   - Count available copies (WHERE status='available')
   - Count issued copies (WHERE status='issued')
6. Transform data to camelCase
7. Return with pagination info
```

### Priority 3: DELETE /api/admin/books/:id
```javascript
// Steps in controller:
1. Get book by id
2. Check if any copies are issued:
   - If yes and force=false → Return 409 conflict
   - If yes and force=true → Continue with warning
3. Delete all book_copies for this book (CASCADE)
4. Delete book record
5. Return success
```

---

## Notes for Backend Developer

1. **ISBN Field:**
   - Must be UNIQUE constraint
   - Format validation: 10 or 13 digits
   - Can be "ISBN-13: 9780135957073" format

2. **QR Code Field:**
   - Must be UNIQUE (no duplicates)
   - Format: BK-{timestamp}-{random}
   - Store as VARCHAR(100)

3. **Quantity Tracking:**
   - quantity = total copies
   - available_copies = quantity - issued - damaged
   - Recalculate on every transaction

4. **Status Field:**
   - Book: 'active', 'inactive'
   - Copy: 'available', 'issued', 'damaged', 'lost'

5. **Cascade Deletion:**
   - Delete book → Delete all copies
   - Consider soft-delete for audit trail

6. **Authentication:**
   - All endpoints require JWT token
   - Verify token is admin role
   - Log all modifications

---

## Testing Guide

### Test Endpoint 1: Add Book with Copies
```bash
curl -X POST http://localhost:5000/api/admin/books/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "9780135957073",
    "title": "JavaScript Design Patterns",
    "quantity": 5,
    "copies": [...]
  }'
```

### Test Endpoint 2: Get All Books
```bash
curl http://localhost:5000/api/admin/books?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Endpoint 3: Find by QR Code
```bash
curl -X POST http://localhost:5000/api/admin/books/search-qr \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode": "BK-1713318751234-ABC123"}'
```

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Proceed |
| 201 | Created | Resource created |
| 400 | Bad Request | Fix input data |
| 404 | Not Found | Book/Copy doesn't exist |
| 409 | Conflict | ISBN/QR already exists or copies issued |
| 500 | Server Error | Check server logs |

