# Supabase Admin Authentication Setup

**Version**: 1.0.0  
**Last Updated**: April 11, 2026  
**Status**: Complete Setup Guide

---

## 📋 Overview

This guide sets up production-grade authentication for the admin panel using Supabase Auth. Features include:

- ✅ Email/Password authentication
- ✅ JWT token management
- ✅ Automatic token refresh
- ✅ Role-based access control (Admin only)
- ✅ Session persistence
- ✅ Logout and token revocation

---

## Step 1: Enable Supabase Auth

### In Supabase Console:

1. Go to your Supabase project
2. Navigate to **Authentication** → **Providers**
3. Click **Email** provider
4. Enable **Email/Password** authentication
5. Configure email settings:
   - Confirm email: **ON** (recommended)
   - Double confirm changes: **OFF**
   - Secure password required: **ON**

### Create Admin User:

1. Go to **Authentication** → **Users**
2. Click **Invite user**
3. Enter admin email
4. Copy the invitation link and set password
5. Verify the email

---

## Step 2: Update Backend .env

```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

JWT_SECRET=your-jwt-secret-for-additional-signing
JWT_EXPIRY=24h

# Email Configuration for sending
SENDGRID_API_KEY=your-sendgrid-key
ADMIN_EMAIL=admin@yourlibrary.com
```

---

## Step 3: Create Admin User Role

Run this SQL in Supabase SQL Editor:

```sql
-- Create admin role/policy
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT now(),
  last_login TIMESTAMP
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to read other admins
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

-- Only service role can insert
CREATE POLICY "Service role can manage admin users"
  ON admin_users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add your admin user
INSERT INTO admin_users (id, email, full_name)
SELECT id, email, 'Admin Name'
FROM auth.users
WHERE email = 'admin@yourlibrary.com'
ON CONFLICT DO NOTHING;
```

---

## Step 4: Install Backend Dependencies

```bash
cd backend
npm install @supabase/supabase-js jsonwebtoken
npm install -D @types/jsonwebtoken
```

---

## Step 5: Install Frontend Dependencies

```bash
cd admin
npm install @supabase/auth-helpers-react
```

Versions:
```json
{
  "@supabase/supabase-js": "^2.38.4",
  "@supabase/auth-helpers-react": "^0.4.2",
  "jsonwebtoken": "^9.1.2"
}
```

---

## Step 6: Backend Setup

### 1. Create Supabase Client

**File:** `backend/src/config/supabaseAuth.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
```

### 2. Create Auth Middleware

**File:** `backend/src/middleware/adminAuth.js`

```javascript
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseAuth');

const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized as admin' 
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      admin: adminUser
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

module.exports = adminAuth;
```

---

## Step 7: Frontend Setup

### 1. Update .env

```bash
# .env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:5000
```

### 2. Create Protected Route Wrapper

See `ProtectedRoute.jsx` for implementation

### 3. Create Login Component

See `Login.jsx` for implementation

---

## Step 8: Integration with AdminContext

Update AdminContext to use Supabase Auth:

```javascript
// In AdminContext.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Add to AdminProvider
const setupAuthListener = () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (session) {
        setToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email
        });
      } else {
        setToken(null);
        setUser(null);
      }
    }
  );
  return subscription;
};

useEffect(() => {
  setupAuthListener();
}, []);
```

---

## Step 9: API Integration

### Login Endpoint

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Logout Endpoint

```
POST /api/auth/logout
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Verify Token Endpoint

```
GET /api/auth/verify
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": { ... }
}
```

---

## Step 10: Database Schema for Audit

```sql
-- Auth audit table
CREATE TABLE auth_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  action TEXT, -- 'login', 'logout', 'failed_attempt', 'token_refresh'
  ip_address INET,
  user_agent TEXT,
  status TEXT, -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view logs
CREATE POLICY "Admins can view auth logs"
  ON auth_logs
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));
```

---

## Security Best Practices ✅

### 1. Token Storage
- ✅ Store tokens in httpOnly cookies (recommended)
- ✅ Or secure localStorage with CSRF protection
- ❌ Never store in regular cookies (XSS vulnerable)

### 2. Password Requirements
- ✅ Minimum 8 characters
- ✅ Mix of uppercase, lowercase, numbers
- ✅ Special characters recommended

### 3. Session Management
- ✅ Token refresh every 1 hour
- ✅ Logout on window close
- ✅ Refresh on tab visibility change

### 4. Rate Limiting
- ✅ Limit login attempts (5 per minute)
- ✅ Progressive delays on failures
- ✅ IP-based blocking after threshold

### 5. Audit Logging
- ✅ Log all auth events
- ✅ Track failed attempts
- ✅ Monitor suspicious activity

---

## Testing Authentication

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Test Protected Route:
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Token Verification:
```bash
curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Error: "Invalid token"
- Ensure token is from correct Supabase project
- Check token hasn't expired
- Verify Authorization header format: `Bearer {token}`

### Error: "Not authorized as admin"
- User not in admin_users table
- Add user to admin_users table manually

### Error: "Email not confirmed"
- User needs to confirm email
- Check spam folder for confirmation link
- Request new confirmation email

### Session Not Persisting
- Check if cookies are enabled
- Verify secure cookie flags for HTTPS
- Check localStorage is accessible

---

## Production Deployment Checklist

- [ ] Enable HTTPS only
- [ ] Set httpOnly, Secure, SameSite flags
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up audit logging
- [ ] Configure email templates
- [ ] Test password reset flow
- [ ] Enable MFA (optional)
- [ ] Monitor auth_logs table
- [ ] Set up alerts for suspicious activity
- [ ] Document admin recovery procedures

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/signup` | Register new admin (invite only) |
| POST | `/api/auth/login` | Authenticate with email/password |
| POST | `/api/auth/logout` | End session and revoke token |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/verify` | Verify current token validity |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Complete password reset |

### Usage Example

```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
});

const data = await response.json();
localStorage.setItem('adminToken', data.session.access_token);
```

---

## Next Steps

1. ✅ Complete Supabase setup
2. ✅ Create admin user
3. ✅ Deploy backend auth endpoints
4. ✅ Add login component to frontend
5. ✅ Protect admin routes
6. ✅ Test full auth flow
7. ✅ Monitor auth logs
8. ✅ Handle token refresh
9. ✅ Implement MFA (optional)
10. ✅ Deploy to production

---

**Setup Complete!** 🎉 Your admin panel now has secure Supabase authentication.

For detailed implementation, see:
- Backend: `SUPABASE_AUTH_BACKEND.md`
- Frontend: `SUPABASE_AUTH_FRONTEND.md`
- Integration: `AUTH_INTEGRATION_GUIDE.md`
