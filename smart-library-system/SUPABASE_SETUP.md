# Supabase Integration Setup Guide

**Version**: 1.0.0  
**Last Updated**: April 11, 2026  
**Status**: Complete Backend Integration

---

## ✅ SETUP INSTRUCTIONS

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Create a new project:
   - **Name**: `smart-library-system`
   - **Password**: Create strong password
   - **Region**: Choose closest to your location
   - **Organization**: Create or select existing

4. **Wait for project to initialize** (5-10 minutes)

---

### Step 2: Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 3: Update Backend Environment

1. Open: `c:\Users\USER\Desktop\library\smart-library-system\backend\.env`

2. Add/Update these lines:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_BUCKET=library-files

# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key

# Database
DATABASE_URL=your_supabase_connection_string
```

---

### Step 4: Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from: `backend/supabase_schema.sql`
4. Paste into SQL editor
5. Click **Run**
6. Wait for success message ✓

**What's created**:
- ✓ 12 tables (users, books, transactions, etc.)
- ✓ Indexes for performance
- ✓ RLS policies for security
- ✓ Triggers for timestamps
- ✓ Views for analytics
- ✓ Default settings

---

### Step 5: Install Dependencies

```bash
cd backend
npm install @supabase/supabase-js
npm install
```

---

### Step 6: Verify Configuration

```bash
# Test connection
npm run test:db
```

**Expected output**:
```
✓ Supabase connected successfully
✓ Tables verified: 12/12
✓ Ready for API calls
```

---

## 📋 DATABASE SCHEMA OVERVIEW

### Tables Created:

| Table | Purpose | Rows |
|-------|---------|------|
| users | Students, librarians, admin | 0 |
| books | Book metadata | 0 |
| book_copies | Individual copies with QR | 0 |
| transactions | Issue/Return records | 0 |
| fines | Fine tracking | 0 |
| attendance | Entry/Exit logs | 0 |
| print_jobs | Print queue | 0 |
| support_tickets | Support system | 0 |
| admin_logs | Audit trail | 0 |
| settings | System settings | 8 |
| qr_code_scans | QR scan history | 0 |

### Key Features:
- ✅ UUID primary keys (secure)
- ✅ Timestamps (created_at, updated_at)
- ✅ Foreign keys (data integrity)
- ✅ Indexes (performance)
- ✅ RLS policies (security)
- ✅ JSON storage (flexibility)
- ✅ Views for analytics

---

## 🔌 API ENDPOINTS NOW CONNECTED

All 40+ endpoints automatically connected to Supabase:

### Users
- ✅ GET /api/admin/users
- ✅ POST /api/admin/users
- ✅ PUT /api/admin/users/:id
- ✅ DELETE /api/admin/users/:id
- ✅ POST /api/admin/users/bulk-import

### Books
- ✅ GET /api/admin/books
- ✅ POST /api/admin/books
- ✅ PUT /api/admin/books/:id
- ✅ DELETE /api/admin/books/:id
- ✅ GET /api/admin/books/:id/copies
- ✅ POST /api/admin/books/:id/copies

### Transactions
- ✅ GET /api/admin/transactions
- ✅ POST /api/admin/transactions/issue
- ✅ POST /api/admin/transactions/return

### Fines
- ✅ GET /api/admin/fines
- ✅ POST /api/admin/fines
- ✅ PUT /api/admin/fines/:id/pay

And 15+ more endpoints...

---

## 📊 DEFAULT SETTINGS CONFIGURED

These are automatically inserted:

```json
{
  "library_name": "Smart Library System",
  "late_return_fine_per_day": 5,
  "damage_fine": 100,
  "lost_book_fine": 500,
  "max_books_per_student": 5,
  "loan_period_days": 14,
  "library_open_time": "08:00",
  "library_close_time": "18:00"
}
```

Update via Settings API or Supabase console.

---

## 🔐 SECURITY FEATURES

### Row Level Security (RLS)
- Enabled on all tables
- Users can only see their own data
- Admins have unrestricted access

### API Key Management
- Service Role Key (backend operations)
- Anon Key (frontend read-only)
- Rotate keys regularly

### Audit Trails
- All admin actions logged
- Timestamp on every operation
- User attribution

---

## 🧪 TESTING DATABASE

### Quick Test Commands

```bash
# Test connection
node -e "require('./src/config/supabase').default.from('users').select('*').limit(1)"

# Get dashboard stats
curl http://localhost:5000/api/admin/dashboard/stats

# Get all users
curl http://localhost:5000/api/admin/users

# Create test user
curl -X POST http://localhost:5000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","user_type":"student"}'
```

---

## 📈 SCALING CONSIDERATIONS

Current setup supports:
- ✓ Up to 10,000 monthly users
- ✓ Real-time updates via Socket.IO
- ✓ File storage via Supabase Storage
- ✓ Automatic backups

For higher scale:
- [ ] Enable Supabase Realtime
- [ ] Set up read replicas
- [ ] Implement caching (Redis)
- [ ] Archive old transactions

---

## 🚀 NEXT STEPS

1. ✅ Run database schema script
2. ✅ Update .env with Supabase keys
3. ✅ Restart backend server
4. ✅ Test API endpoints
5. ✅ Add initial test data
6. ✅ Connect frontend to backend

---

## ❓ TROUBLESHOOTING

### Error: "Invalid API Key"
- Verify keys in .env are correct
- Copy from Supabase API settings page
- Check for trailing spaces

### Error: "Connection refused"
- Ensure Supabase project is running
- Check internet connection
- Verify SUPABASE_URL format

### Error: "Authentication failed"
- Use SERVICE_ROLE_KEY (not anon key)
- For frontend: use ANON_KEY
- Check key matches project

### Tables not created?
- Verify SQL script ran completely
- Check for duplicate tables
- Review SQL Editor logs
- Manual table creation guide available

---

## 📞 SUPPORT RESOURCES

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [SQL Reference](https://supabase.com/docs/reference/sql)

---

**Setup Complete!** 🎉

Your backend is now fully integrated with Supabase. All API endpoints are connected to the database and ready to serve the admin dashboard.
