# Books Management System - Quick Start Guide

## 🎯 What Was Done

Merged two separate pages into one unified Books Management system:
- ✅ `/books` → View and manage book inventory
- ✅ `/add-books` → Add books via ISBN + QR scanning  
- ✅ Merged into: `http://localhost:3000/books` (single page)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Backend
cd smart-library-system/backend
npm install

# Admin Frontend
cd smart-library-system/admin
npm install
```

### 2. Set Environment Variables

**Backend** (`smart-library-system/backend/.env`):
```env
# Supabase
SUPABASE_URL=https://wwlcmewowcwsbeebalxh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=smart_library

# Google Books API
GOOGLE_BOOKS_API_KEY=your_key_here

# Other
JWT_SECRET=your_secret_key
PORT=5000
```

### 3. Start Services

```bash
# Terminal 1: Backend
cd smart-library-system/backend
npm start
# Runs on http://localhost:5000

# Terminal 2: Admin Frontend
cd smart-library-system/admin
npm start
# Runs on http://localhost:3000
```

### 4. Access the Application
```
http://localhost:3000/books
```

## 📱 Using Books Management

### Tab 1: Book List
1. **View Books**: Loads all books from database
2. **Search**: Filter by title, author, ISBN, category
3. **Add Book**: Click "Add Book Manually" button
4. **Edit**: Click edit icon to modify book details
5. **Delete**: Click delete icon (validates no active transactions)

### Tab 2: Add Books (ISBN Search)
1. **Scan/Enter ISBN**: Input ISBN barcode
2. **Click Search**: Fetches data from Google Books API
3. **Scan QR Codes**: Scan physical QR code for each copy
4. **Add Copy**: Press ENTER after each QR scan
5. **Save**: Click "Save Book" to add to database

### Tab 3: Generate QR Codes
1. **Set Count**: Choose 1-500 QR codes to generate
2. **Generate**: Click to create batch
3. **Download**: Save printable HTML sheet
4. **Print**: Print the sheet, cut, and stick on books

## 🔌 API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/books` | Fetch all books |
| POST | `/admin/books` | Create new book |
| PUT | `/admin/books/:id` | Update book |
| DELETE | `/admin/books/:id` | Delete book |
| POST | `/api/admin/books/add` | Add book with QR copies |

## ✨ Key Features

### ✓ Unified Interface
- All book management in one place
- Tab-based navigation
- No page reloads needed

### ✓ Google Books Integration
- ISBN lookup automatically populates:
  - Title, Author
  - Publisher, Pages
  - Book cover image

### ✓ QR Code Management
- Generate unique QR codes
- Track copies individually
- Printable sheets with layout

### ✓ Supabase Connection
- Real-time database sync
- Proper authentication
- Service role for admin operations

### ✓ Error Handling
- User-friendly error messages
- Validation before save
- Transaction checks before delete
- Fallback demo data

## 📊 Data Flow

```
User Input
    ↓
BooksManagement Component
    ↓
API (axios)
    ↓
Backend Routes (/admin or /api/admin)
    ↓
Controllers
    ↓
Supabase Database
    ↓
Response back to UI
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check database connection
npm run test:db

# Check port 5000 is free
netstat -ano | findstr :5000
```

### Books not loading
```bash
# Check backend logs
npm start

# Test API directly
curl http://localhost:5000/admin/books

# Check browser console (F12)
```

### ISBN search not working
```bash
# Verify API key
echo $GOOGLE_BOOKS_API_KEY

# Test Google API
curl "https://www.googleapis.com/books/v1/volumes?q=isbn:978-0-123456789-0&key=$GOOGLE_BOOKS_API_KEY"
```

## 📋 File Structure

```
smart-library-system/
├── admin/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BooksManagement.jsx    ← NEW: Merged page
│   │   │   ├── Books.js               ← (deprecated)
│   │   │   └── AddBooks.jsx           ← (deprecated)
│   │   ├── components/
│   │   │   └── Sidebar.js             ← UPDATED: Menu
│   │   ├── services/
│   │   │   ├── googleBooksAPI.js
│   │   │   └── qrCodeService.js
│   │   ├── App.js                     ← UPDATED: Routes
│   │   └── context/AdminContext.js
│   └── BOOKS_MERGE_DOCUMENTATION.md   ← NEW: Full docs
│
└── backend/
    ├── src/
    │   ├── routes/
    │   │   ├── admin.js
    │   │   └── advancedBooks.js
    │   ├── controllers/
    │   │   └── adminBooksController.js
    │   └── config/
    │       └── supabase.js
    └── .env                           ← Set credentials here
```

## ✅ Verification Checklist

After starting the application, verify:

- [ ] Backend starts without errors: `npm start`
- [ ] Frontend starts without errors: `npm start`
- [ ] Can access `http://localhost:3000/books`
- [ ] Book list loads (may show demo data)
- [ ] Can search books by title
- [ ] Can toggle between 3 tabs
- [ ] Can add book via ISBN search
- [ ] Can generate QR codes
- [ ] Can download QR sheet as HTML

## 🎓 Common Tasks

### Add a new book
1. Go to Tab 1: "Book List"
2. Click "Add Book Manually"
3. Fill form and click "Create Book"

### Add book with ISBN
1. Go to Tab 2: "Add Books (ISBN)"
2. Scan/enter ISBN
3. Scan each QR code (press ENTER)
4. Click "Save Book"

### Generate QR codes to print
1. Go to Tab 3: "Generate QR Codes"
2. Enter count (e.g., 50)
3. Click "Generate 50 Codes"
4. Click "Download Print Sheet"
5. Print the HTML file

## 🔐 Authentication

The page requires:
- Valid admin/librarian token
- Token stored in `localStorage.adminToken`
- Auto-logout on invalid/expired token

If you get 401 errors:
1. Log in via admin login page
2. Token should be stored automatically
3. Retry the operation

## 📞 Support

For issues or questions:
1. Check browser console (F12)
2. Check backend logs (npm start output)
3. Verify .env variables are set
4. Check database connection
5. Review `BOOKS_MERGE_DOCUMENTATION.md` for detailed info

## 🎉 You're Ready!

The merged Books Management page is fully functional and connected to Supabase. Start using it to manage your library's book inventory efficiently!
