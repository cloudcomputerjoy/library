# Backend-Mobile API Endpoint Mapping & Analysis

## Current Status Report (April 27, 2026)

### Network Error Root Cause
```
Mobile App Error: "AxiosError: Network Error"
Root Cause: Backend endpoints not properly mapped for mobile app requirements
```

### API Configuration
- **Backend Base**: `http://192.168.1.117:5000`
- **Backend Routes Prefix**: `/api`
- **Mobile API Base URL**: `http://192.168.1.117:5000/api`
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT with Supabase

---

## Endpoint Mapping Analysis

### ✅ WORKING ENDPOINTS

| Service | Mobile Calls | Backend Route | Status |
|---------|-------------|--------------|--------|
| Books | `/books`, `/books/featured` | `/api/books` | ✅ Working |
| Categories | `/categories` | `/api/categories` | ✅ Working (with fallback) |
| Payments | `/payments/fines` | `/api/payments/fines` | ✅ Working |
| Users | `/users/profile`, `/users/stats` | `/api/users/*` | ✅ Working |
| Notifications | `/notifications` | `/api/notifications` | ✅ Working |
| Support | `/support/tickets` | `/api/support` | ✅ Working |

### ❌ BROKEN ENDPOINTS (Path Mismatch)

| Mobile Endpoint | Current Backend | Required Action |
|----------------|-----------------|-----------------|
| `/issues/active` | ❌ NOT FOUND | Create endpoint |
| `/issues/history` | ❌ NOT FOUND | Create endpoint |
| `/issues/overdue` | ❌ NOT FOUND | Create endpoint |
| `/issues/stats` | ❌ NOT FOUND | Create endpoint |
| `/issues/issue-book` | ❌ NOT FOUND | Create endpoint |
| `/issues/return-book` | ❌ NOT FOUND | Create endpoint |
| `/issues/batch-return` | ❌ NOT FOUND | Create endpoint |
| `/issues/bulk-issue` | ❌ NOT FOUND | Create endpoint |
| `/issues/create-request` | `/api/issue/create-request` | ✅ Exists (use `/api/issue/`) |
| `/issues/pending-requests` | `/api/issue/pending-requests` | ✅ Exists (use `/api/issue/`) |
| `/issues/complete-request` | `/api/issue/complete-request` | ✅ Exists (use `/api/issue/`) |

---

## Mobile Dashboard Data Requirements

### PremiumDashboardScreen.js fetches:

1. **Borrowed Books Count**
   - Mobile: `issuesService.getBorrowedBooks()`
   - Endpoint: `/issues/active` (GET)
   - Response: `{ books: [...], count: N }`

2. **Due Soon Books Count**
   - Mobile: `issuesService.getOverdueBooks()`
   - Endpoint: `/issues/overdue` (GET)
   - Response: `{ books: [...] }`

3. **Pending Fines**
   - Mobile: `paymentsService.getUserFines()` ✅
   - Endpoint: `/payments/fines` (GET)
   - Response: `{ fines: [...], totalAmount: N }`

4. **Print Jobs**
   - Mobile: `userService.getUserProfile()`
   - Endpoint: `/users/profile` (GET)
   - Response: `{ user: { printJobsCount: N } }`

5. **Recent Activity**
   - Mobile: `notificationsService.getNotifications()` ✅
   - Endpoint: `/notifications` (GET)
   - Response: `{ notifications: [...] }`

---

## Solution: Add Missing Endpoints to Backend

### Option 1: Add Missing Routes to `/api/issue/` (Recommended)
Edit: `backend/src/routes/issue.js`

Add these endpoints:
- `GET /active` - Get user's active borrowed books
- `GET /overdue` - Get overdue books
- `GET /history` - Get complete issue history
- `GET /stats` - Get issue statistics
- `POST /issue-book` - Issue a book
- `POST /return-book` - Return a book
- `POST /batch-return` - Batch return books
- `POST /bulk-issue` - Bulk issue books

### Option 2: Create Alias Route
Edit: `backend/server.js`

Add after line 188:
```javascript
// Alias for issues endpoints (mobile app compatibility)
app.use('/api/issues', issueRoutes);
```

This allows both `/api/issue/` and `/api/issues/` to work.

---

## Database Schema Check - Supabase

Required tables for dashboard:
- ✅ `issues` - Book issue transactions
- ✅ `payments/fines` - Fine records
- ✅ `users` - User profiles
- ✅ `books` - Book catalog
- ✅ `notifications` - Notifications log

---

## Testing Checklist

- [ ] Backend running: `http://192.168.1.117:5000/health`
- [ ] Verify `/api/issues/active` returns borrowed books
- [ ] Verify `/api/issues/overdue` returns overdue books
- [ ] Verify `/api/payments/fines` returns fines
- [ ] Verify `/api/users/profile` returns user data
- [ ] Verify `/api/notifications` returns notifications
- [ ] PremiumDashboardScreen fetches all 5 data sources
- [ ] Mobile app connects without "Network Error"

---

## Next Steps

1. ✅ **Backend**: Add missing issue endpoints or create alias route
2. ✅ **Database**: Verify Supabase MCP server connection
3. ✅ **Mobile**: Fix service layer paths if needed
4. ✅ **Testing**: Full integration test of PremiumDashboardScreen
