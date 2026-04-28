# Smart Library Backend

Production-ready Node.js/Express.js backend for Smart Library Management System with real-time WebSocket support, Supabase integration, and Cloudflare storage.

## 📁 Project Structure

```
backend/
├── server.js                 # Main entry point
├── package.json             # Dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
│
└── src/
    ├── config/              # Configuration modules
    │   ├── database.js      # Supabase initialization
    │   └── socket.js        # Socket.IO setup
    │
    ├── middleware/          # Express middleware
    │   ├── auth.js          # JWT authentication
    │   └── errorHandler.js  # Error handling
    │
    ├── routes/              # API endpoints
    │   ├── auth.js          # Authentication routes
    │   ├── qr.js            # QR code scanning
    │   ├── books.js         # Book management
    │   ├── transactions.js  # Issue/return/reserve
    │   ├── files.js         # File sharing (30-min auto-delete)
    │   ├── print.js         # Print job management
    │   └── rfid.js          # RFID card integration
    │
    ├── controllers/         # Business logic (to be created)
    │
    ├── services/            # Business services (to be created)
    │
    └── utils/               # Utility functions
        ├── qr.js            # QR token generation & validation
        ├── password.js      # Password hashing & security
        ├── validator.js     # Input validation helpers
        └── cloudflare.js    # Cloudflare R2 integration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Cloudflare account (for R2 storage)

### Installation

1. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

2. **Fill in environment variables**
   ```bash
   # Edit .env with your credentials:
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   # ... etc
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Or production:
   ```bash
   npm start
   ```

Server starts on `http://localhost:5000`

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login with credentials
- `POST /refresh-token` - Refresh JWT token
- `GET /me` - Get current user profile
- `PUT /update-profile` - Update profile information
- `PUT /change-password` - Change password

### Books (`/api/books`)
- `GET /` - List all books with filters
- `GET /:id` - Get book details
- `POST /` - Create new book (Librarian/Admin)
- `PUT /:id` - Update book details (Librarian/Admin)
- `DELETE /:id` - Delete book soft-delete (Librarian/Admin)
- `POST /:id/review` - Add review to book (Students)
- `GET /:id/recommendations` - Get similar books

### QR System (`/api/qr`)
- `GET /generate` - Generate dynamic QR code (15-sec expiry)
- `POST /scan` - Scan QR code for entry/exit
- `GET /status` - Get current attendance status
- `GET /attendance-logs` - Get attendance history
- `GET /live-attendance` - Get real-time stats (Librarian/Admin)

### Transactions (`/api/transactions`)
- `POST /issue` - Issue book to student (Librarian/Admin)
- `POST /return` - Return book with fine calculation (Librarian/Admin)
- `POST /reserve` - Reserve book (Students)
- `GET /my-transactions` - Get user's transactions
- `GET /all` - Get all transactions (Librarian/Admin)

### File Sharing (`/api/files`)
- `POST /upload` - Upload file (auto-deleted after 30 minutes)
- `GET /my-files` - Get user's uploaded files
- `GET /shared` - Get shared files (Librarian/Admin)
- `DELETE /:id` - Delete file manually
- `GET /:id/download` - Get signed download URL

### Print System (`/api/print`)
- `POST /request` - Request print job with page count
- `GET /my-jobs` - Get user's print jobs
- `GET /queue` - Get print queue (Librarian/Admin)
- `PUT /:jobId/status` - Update print job status (Librarian/Admin)
- `POST /:jobId/verify` - Verify print completion (Librarian/Admin)
- `POST /:jobId/collect` - Mark as collected (Students)
- `GET /statistics` - Print system statistics

### RFID (`/api/rfid`)
- `POST /scan` - Scan RFID card for entry/exit
- `POST /register` - Register RFID card to user (Librarian/Admin)
- `PUT /:cardId/status` - Update card status (Librarian/Admin)
- `GET /:userId` - Get user's RFID cards (Librarian/Admin)
- `DELETE /:cardId` - Deactivate RFID card (Librarian/Admin)
- `GET /failed-scans` - Get failed scan attempts (Librarian/Admin)

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

Token expiry: 24 hours
QR token expiry: 15 seconds

## 🔌 WebSocket Events

### Entry/Exit Events
- `entry_success` - Entry scan successful
- `exit_success` - Exit scan successful
- `rfid_scan` - RFID card scanned

### Book Events
- `book_issued` - Book issued to student
- `book_returned` - Book returned
- `book_availability_updated` - Book availability changed
- `book_available` - Book becomes available

### File Events
- `file_uploaded` - File uploaded by student
- `file_shared` - File shared with user
- `file_auto_deleted` - File auto-deleted after 30 minutes

### Print Events
- `new_print_job` - New print job created
- `print_status_updated` - Print job status changed
- `print_ready_for_pickup` - Print ready for collection

### Other Events
- `notification` - General notifications
- `live_stats` - Real-time dashboard statistics

## 📊 Key Features

### QR Code System
- Dynamic QR tokens with 15-second expiry
- HMAC encryption for security
- Entry/exit scanning with automatic duration calculation

### File Sharing & Auto-Deletion
- 30-minute auto-deletion using Node.js setTimeout
- Backup cron job (hourly) for orphaned files
- Page count extraction for PDFs
- Cloudflare R2 integration for storage

### Print Management
- Print job queue with status tracking
- Page count and cost calculation
- Admin verification and approval
- Student pickup confirmation

### Real-time Features (Socket.IO)
- Live entry/exit notifications
- Book availability alerts
- Print job status updates
- File sharing notifications

### RFID Integration
- Card registration and management
- Entry/exit dual-mode detection
- Failed scan logging
- Card status management (active/inactive/lost/replaced)

## 🗄️ Database Schema

Complete PostgreSQL schema includes 20+ tables:
- `users` - User accounts and profiles
- `library_cards` - QR ID mapping
- `books` - Book inventory
- `transactions` - Issue/return/reserve records
- `attendance_logs` - Entry/exit tracking
- `qr_tokens` - Dynamic QR tokens (15-sec expiry)
- `file_shares` - Uploaded files (30-min expiry)
- `print_jobs` - Print queue with page tracking
- `rfid_cards` - RFID hardware mapping
- `fines` - Fine/fee tracking
- `book_reservations` - Reservations
- `book_reviews` - Ratings and reviews
- `api_keys` - Developer API access
- And more...

See [DATABASE_SCHEMA.sql](../docs/DATABASE_SCHEMA.sql) for complete schema.

## 🔧 Configuration

All configuration is in `.env` file. Key variables:

```
# Server
NODE_ENV=development
PORT=5000

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=86400

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=xxxxx
CLOUDFLARE_ACCESS_KEY_ID=xxxxx
CLOUDFLARE_SECRET_ACCESS_KEY=xxxxx
CLOUDFLARE_BUCKET_NAME=library-files

# File Sharing
FILE_SHARE_EXPIRY_MINUTES=30

# RFID
RFID_ENABLED=true
RFID_SERIAL_PORT=/dev/ttyUSB0

# Features
ENABLE_FILE_SHARING=true
ENABLE_PRINT_SYSTEM=true
```

## 📦 Dependencies

### Core
- **express** - Web framework
- **@supabase/supabase-js** - Supabase client
- **socket.io** - Real-time communication
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing

### File Handling
- **multer** - File upload handling
- **pdf-parse** - PDF page counting
- **@aws-sdk/client-s3** - Cloudflare R2 integration

### Utilities
- **node-cron** - Scheduled jobs (file cleanup)
- **bull** - Job queue (for production)
- **axios** - HTTP client
- **helmet** - Security headers
- **express-rate-limit** - API rate limiting

## 💾 Development

### Start Development Server
```bash
npm run dev
```
Watches for file changes and auto-restarts

### Run Tests
```bash
npm test
```

### Database Migration
```bash
npm run migrate
```

## 🐛 Troubleshooting

### Database Connection Failed
- Check SUPABASE_URL and keys in .env
- Ensure Supabase project is active
- Test connection with `/health` endpoint

### File Upload Fails
- Check Cloudflare R2 credentials
- Verify bucket exists and is accessible
- Check file size limit in .env

### Socket.IO Connection Issues
- Verify CORS_ORIGIN in .env
- Check WebSocket support on server
- Look for firewall blocking port 5000

### QR Scanning Issues
- Verify JWT_SECRET is correct
- Check QR_TOKEN_SECRET in .env
- Ensure QR token hasn't expired (15 seconds)

## 📄 License

MIT

## 👥 Authors

Smart Library Team (2026)

---

For complete API documentation, see [API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md)

For deployment instructions, see [DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md)
