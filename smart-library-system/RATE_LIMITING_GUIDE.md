# HTTP 429 Error - Too Many Requests

## 🚨 Problem

You're seeing a **429 status code** (Too Many Requests) warning next to the admin panel notification icon. This means the dashboard is making API requests faster than the backend rate limiter allows.

---

## 🔍 Root Cause

The issue occurs because:

1. **Multiple components polling simultaneously** - The dashboard has many hooks (useUsers, useBooks, usePendingActions, etc.) all making API calls
2. **Rate limiter was too strict** - The original limit was only 100 requests per 15 minutes
3. **Real-time updates need frequent refreshes** - Dashboard notifications and data need to update quickly

---

## ✅ Solution Applied

### What Was Fixed:

1. **Increased Global Rate Limit**
   - Before: 100 requests per 15 minutes (6-7 req/min)
   - After: 300 requests per 15 minutes (20 req/min)

2. **Added Admin API Rate Limiter**
   - Separate, more lenient limit for `/api/admin/*` endpoints
   - Allows 500 requests per 5 minutes (100 req/min)
   - This is specifically for dashboard operations

3. **Excluded Health Checks**
   - Health check endpoints don't count against rate limit
   - Prevents false rate limit hits from monitoring

4. **Updated .env Configuration**
   ```env
   RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=300          # requests per window
   ENABLE_REQUEST_LOGGING=true          # for debugging
   ```

---

## 🎯 Current Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/*` (global) | 300 requests | 15 minutes |
| `/api/admin/*` | 500 requests | 5 minutes |
| `/health` | Unlimited | - |
| `/api/health` | Unlimited | - |

---

## 📊 Is 429 Still Appearing?

If you still see 429 errors:

### Option 1: Increase Rate Limits Further

Edit `backend/.env`:
```env
RATE_LIMIT_MAX_REQUESTS=500  # Increase to 500
```

Or for admin API specifically, modify `backend/server.js`:
```javascript
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,  // Increase to 1000
  ...
});
```

### Option 2: Reduce Polling Frequency

Make hooks refresh less frequently. Edit `admin/src/hooks/useDashboardHooks.js`:
```javascript
// Change from 60000ms (1 min) to 120000ms (2 min)
const interval = setInterval(loadMetrics, 120000);
```

### Option 3: Disable Auto-Refresh for Non-Critical Data

```javascript
// Don't auto-refresh books if not needed
const { books } = useBooks({}, false); // false = no auto-refresh
```

---

## 🔧 Recommendations

### Development Environment
- Keep rate limits high (300-500 requests per 15 minutes)
- Enable request logging: `ENABLE_REQUEST_LOGGING=true`
- Monitor server logs for 429 errors

### Production Environment
- Start with: 300 global, 500 admin per 5 min
- Monitor and adjust based on usage patterns
- Consider using Redis for distributed rate limiting
- Implement request queuing for better UX

---

## 📈 Performance Tips

1. **Use WebSocket instead of HTTP polling**
   - WebSocket is already initialized (Socket.IO)
   - Real-time events don't consume rate limit quota
   - More efficient than constant HTTP requests

2. **Batch API Requests**
   - Combine multiple data fetches into single endpoint
   - Reduce total number of requests

3. **Cache Response Data**
   - Store data in Context longer before refetching
   - Increase refresh interval for stable data

4. **Implement Request Deduplication**
   - If same request is made multiple times, return cached result
   - Clear cache when data changes

---

## 🧪 Testing

### Test 1: Check Rate Limit Status
```bash
# From terminal, make multiple requests
for i in {1..50}; do 
  curl http://localhost:5000/api/admin/dashboard/stats \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```

Look for 429 responses.

### Test 2: Monitor in Dashboard
- Open admin dashboard
- Check browser DevTools Network tab
- Look for 429 responses
- If you don't see any, rate limiting is working

---

## 📝 How to Adjust Rate Limits

### Method 1: Via Environment Variables

Edit `backend/.env`:
```env
RATE_LIMIT_WINDOW_MS=300000          # 5 minutes instead of 15
RATE_LIMIT_MAX_REQUESTS=500          # 500 requests instead of 300
```

Restart backend: `npm run dev`

### Method 2: Via Code Configuration

Edit `backend/server.js`:
```javascript
// For global limiter
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,     // 5 minutes
  max: 500,                     // 500 requests
  skip: (req) => req.path === '/health'
});

// For admin limiter (more lenient)
const adminLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,      // 2 minutes
  max: 1000,                    // 1000 requests
});
```

---

## ✨ Best Practices

✅ **DO:**
- Set limits based on actual usage patterns
- Monitor logs for rate limit hits
- Use WebSocket for real-time data
- Increase limits for admin APIs (more traffic)
- Disable auto-refresh for non-essential data

❌ **DON'T:**
- Set limits too high (security risk)
- Auto-refresh all data constantly
- Make duplicate API requests
- Forget to handle 429 errors in frontend

---

## 🔗 Related Files

- Backend rate limiter: `backend/server.js` (lines 73-85, 190-210)
- Frontend hooks: `admin/src/hooks/useDashboardHooks.js`
- Environment config: `backend/.env`
- Admin context: `admin/src/contexts/AdminDashboardContext.js`

---

## 🆘 If Problem Persists

1. **Check server logs** for rate limit messages
2. **Verify .env** is loaded correctly
3. **Restart backend server** after changing .env
4. **Clear browser cache** (DevTools → Storage → Clear)
5. **Check network latency** - might be timing issue
6. **Increase limits temporarily** for testing

---

**Status:** ✅ 429 error handling improved with better rate limiting configuration

Updated: April 18, 2026
