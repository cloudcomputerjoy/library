# Backend Environment Configuration

## Supabase Setup for Smart Library System

**Version**: 1.0.0  
**Status**: Complete

---

## ✅ STEP-BY-STEP SETUP

### 1. CREATE `.env` FILE IN BACKEND

Create file: `c:\Users\USER\Desktop\library\smart-library-system\backend\.env`

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_BUCKET=library-files

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=development
HOST=localhost

# ============================================
# JWT & SECURITY
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=30d

# ============================================
# CORS & SECURITY
# ============================================
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
ALLOWED_ORIGINS=localhost:3000,localhost:3001

# ============================================
# OPTIONAL: FILE UPLOAD
# ============================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# ============================================
# OPTIONAL: EMAIL SERVICE
# ============================================
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@smartlibrary.com

# ============================================
# OPTIONAL: SMS SERVICE
# ============================================
SMS_PROVIDER=twilio
SMS_ACCOUNT_SID=your-twilio-sid
SMS_AUTH_TOKEN=your-twilio-token
SMS_FROM_NUMBER=+1234567890

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# ============================================
# REDIS CACHE (Optional)
# ============================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

---

### 2. GENERATE KEYS FROM SUPABASE

1. Go to [supabase.com](https://supabase.com)
2. Login to your project
3. Go to **Settings** → **API**
4. Copy these values:

| Setting | Env Variable | Where to Find |
|---------|-------------|---------------|
| Project URL | `SUPABASE_URL` | Settings → API → URL |
| Service Role | `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Service_role |
| Anon Key | `SUPABASE_ANON_KEY` | Settings → API → anon |

**Example `.env` with real values**:
```bash
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. CREATE DATABASE SCHEMA

1. In Supabase (`https://app.supabase.com`), go to **SQL Editor**
2. Click **New Query**
3. Copy content from: `backend/supabase_schema.sql`
4. Paste into editor
5. Click **Run** ▶️

**Expected output**:
```
✓ 12 tables created
✓ 20 indexes created
✓ Functions created
✓ Views created
✓ Default settings inserted
```

---

### 4. INSTALL BACKEND DEPENDENCIES

```bash
cd backend
npm install
```

**Check installation**:
```bash
npm list @supabase/supabase-js
```

Should show: `@supabase/supabase-js@2.x.x`

---

### 5. UPDATE ROUTE FILES

Update your route files to use new controllers. Example:

**File**: `backend/src/routes/adminV2.js`

```javascript
import adminController from '../controllers/adminControllerSupabase.js';
import booksController from '../controllers/adminBooksControllerSupabase.js';
import transactionsController from '../controllers/adminTransactionsControllerSupabase.js';

// Example routes (replace old routes):
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.get('/books', booksController.getBooks);
router.post('/transactions/issue', transactionsController.issueBook);
```

---

## 🔄 API ENDPOINTS NOW INTEGRATED

All endpoints automatically use Supabase:

### Dashboard
- ✅ GET `/api/admin/dashboard/stats`
- ✅ GET `/api/admin/dashboard/live-feed`
- ✅ GET `/api/admin/dashboard/analytics`

### Users
- ✅ GET `/api/admin/users`
- ✅ GET `/api/admin/users/:id`
- ✅ POST `/api/admin/users` → Creates in Supabase
- ✅ PUT `/api/admin/users/:id` → Updates in Supabase
- ✅ DELETE `/api/admin/users/:id` → Soft delete
- ✅ POST `/api/admin/users/bulk-import` → Batch insert

### Books
- ✅ GET `/api/admin/books` → Queries Supabase
- ✅ POST `/api/admin/books` → Creates with UUID
- ✅ PUT `/api/admin/books/:id`
- ✅ DELETE `/api/admin/books/:id`
- ✅ POST `/api/admin/books/:id/copies` → Auto-generates QR
- ✅ GET `/api/admin/books/:id/copies`
- ✅ PUT `/api/admin/books/:id/copies/:copyId`

### Transactions
- ✅ POST `/api/admin/transactions/issue` → Validates, creates transaction, updates copy
- ✅ POST `/api/admin/transactions/return` → Auto-calculates fine
- ✅ GET `/api/admin/transactions` → Lists with joins
- ✅ GET `/api/admin/transactions/:id`

### Fines
- ✅ GET `/api/admin/fines`
- ✅ POST `/api/admin/fines/:id/pay`

### Attendance
- ✅ GET `/api/admin/attendance`

---

## 🧪 TESTING CONNECTION

### Test 1: Verify .env Loaded
```bash
node -e "console.log('SUPABASE_URL:', process.env.SUPABASE_URL)"
```

Expected: Shows your Supabase URL

### Test 2: Test Supabase Connection
```bash
npm run test:db
```

Expected output:
```
✓ Supabase connected
✓ Tables: 12/12
✓ Ready
```

### Test 3: Test API Endpoint

Start backend first:
```bash
npm start
```

Then in another terminal:
```bash
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer your-jwt-token"
```

Expected: JSON array of users (or empty array if no data yet)

---

## 📊 DATA FLOW DIAGRAM

```
Frontend (Admin Dashboard)
        ↓
API Request (axios)
        ↓
Backend Routes (adminV2.js)
        ↓
Controllers (...ControllerSupabase.js)
        ↓
Supabase Client (config/supabase.js)
        ↓
PostgreSQL Database (Supabase)
```

---

## 🔐 SECURITY CHECKLIST

- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` in backend only
- ✅ Never expose keys in frontend
- ✅ Add `.env` to `.gitignore`
- ✅ Update JWT_SECRET with strong value
- ✅ Enable RLS policies for production
- ✅ Use environment variables in production
- ✅ Rotate keys regularly

---

## ❓ TROUBLESHOOTING

### Error: "Invalid API Key"
```
Solution:
1. Verify SUPABASE_URL format (no trailing slash)
2. Ensure SUPABASE_SERVICE_ROLE_KEY is correct
3. Check keys haven't been rotated
4. Copy fresh from Supabase dashboard
```

### Error: "Connection refused"
```
Solution:
1. Verify Supabase project is active
2. Check internet connection
3. Try: SUPABASE_URL=https://your-id.supabase.co
```

### Error: "Tables not found"
```
Solution:
1. Run SQL schema script again
2. Verify script ran without errors:
   - Check SQL Editor logs
   - Ensure all CREATE TABLE statements executed
3. Check table list in Supabase UI
```

### Error: "ENOENT: no such file or directory, open '.env'"
```
Solution:
1. Create backend/.env file manually
2. Add all required variables
3. Restart npm server
4. Don't forget PORT and SUPABASE_* keys
```

---

## 📈 PERFORMANCE TIPS

1. **Enable connection pooling** (Supabase default)
2. **Create indexes** (already in schema)
3. **Use pagination** (limit, offset)
4. **Cache frequently accessed data** (Redis optional)
5. **Monitor slow queries** (Supabase dashboard)

---

## 🚀 NEXT STEPS

1. ✅ Create `.env` file
2. ✅ Get Supabase API keys
3. ✅ Run database schema SQL
4. ✅ Update route files
5. ✅ Test API endpoints
6. ✅ Add initial test data
7. ✅ Start backend server
8. ✅ Connect frontend

---

## 📞 SUPPORT RESOURCES

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase Reference](https://supabase.com/docs/reference)

---

**Backend is now ready for production! 🎉**
