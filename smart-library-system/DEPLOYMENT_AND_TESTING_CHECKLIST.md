# 🚀 Deployment & Testing Checklist

**Last Updated**: 2025  
**Status**: ✅ Ready for Testing  
**Integration Status**: All endpoints verified and aligned

---

## 📋 Pre-Deployment Checklist

### Backend Setup
- [ ] Install Node.js 18+ and npm
- [ ] Clone repository: `git clone <repo-url>`
- [ ] Navigate to backend: `cd smart-library-system/backend`
- [ ] Install dependencies: `npm install`
- [ ] Create `.env` file with required variables:
  ```env
  PORT=3000
  NODE_ENV=development
  DATABASE_URL=your_supabase_url
  SUPABASE_KEY=your_supabase_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  CLOUDFLARE_ACCOUNT_ID=your_cloudflare_id
  CLOUDFLARE_ACCESS_KEY_ID=your_cf_key
  CLOUDFLARE_SECRET_ACCESS_KEY=your_cf_secret
  CLOUDFLARE_BUCKET_NAME=your_bucket
  JWT_SECRET=your_jwt_secret_key
  REFRESH_TOKEN_SECRET=your_refresh_token_secret
  ```
- [ ] Run database migrations: `npm run migrate`
- [ ] Start server: `npm run dev`
- [ ] Verify backend running on `http://localhost:3000`

### Mobile Setup
- [ ] Install Expo CLI: `npm install -g expo-cli`
- [ ] Navigate to mobile: `cd smart-library-system/mobile`
- [ ] Install dependencies: `npm install`
- [ ] Create `.env` file:
  ```env
  EXPO_PUBLIC_API_URL=http://your-backend-ip:3000/api
  EXPO_PUBLIC_APP_NAME=Smart Library
  ```
- [ ] Start with Expo: `npx expo start`
- [ ] Scan QR code with Expo Go app
- [ ] Verify app launches successfully

---

## 🧪 Integration Tests

### Automated Testing
```bash
# Run integration test suite
cd backend
node tests/integration-test.js
```

**Expected Output:**
```
✓ Passed: 45+ | ✗ Failed: 0
Success Rate: 100%
```

### Manual Testing Flow

#### 1. Authentication Flow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1a | Register new user | ✓ Get token & refresh token |
| 1b | Login with credentials | ✓ Get token & refresh token |
| 1c | Get user profile | ✓ User data returned |
| 1d | Update profile | ✓ Profile updated |
| 1e | Change password | ✓ Password changed |
| 1f | Logout | ✓ Tokens cleared |

#### 2. Books & Search
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2a | Browse books (GET /books) | ✓ List of 20 books |
| 2b | View featured books | ✓ Featured collection |
| 2c | Search books (q=history) | ✓ Matching results |
| 2d | Filter by category | ✓ Category filtered results |
| 2e | View book details | ✓ Full book info |
| 2f | Check available copies | ✓ Copy count & status |

#### 3. Transactions
| Step | Action | Expected Result |
|------|--------|-----------------|
| 3a | Issue a book | ✓ Book issued, due date set |
| 3b | View active issues | ✓ Currently borrowed books |
| 3c | Renew a book | ✓ Due date extended |
| 3d | Return a book | ✓ Return recorded, fine calculated if needed |
| 3e | View history | ✓ All past transactions |

#### 4. QR System
| Step | Action | Expected Result |
|------|--------|-----------------|
| 4a | Generate user QR | ✓ QR code displayed |
| 4b | Generate book QR | ✓ Book QR generated |
| 4c | Auto-refresh QR | ✓ QR updates every 10s |
| 4d | Scan library card QR | ✓ User identified |
| 4e | Scan book QR | ✓ Book identified |
| 4f | Process transaction | ✓ Issue/return with QR |

#### 5. RFID System
| Step | Action | Expected Result |
|------|--------|-----------------|
| 5a | Register RFID card | ✓ Card registered |
| 5b | View registered cards | ✓ List of user cards |
| 5c | Scan RFID tag | ✓ Card identified |
| 5d | Process RFID transaction | ✓ Issue/return with RFID |
| 5e | View RFID logs | ✓ Transaction history |
| 5f | Deactivate card | ✓ Card marked inactive |

#### 6. File Sharing
| Step | Action | Expected Result |
|------|--------|-----------------|
| 6a | Upload file | ✓ File stored, ID returned |
| 6b | View my files | ✓ User's uploaded files |
| 6c | Share file with users | ✓ File shared, recipients notified |
| 6d | Download file | ✓ Signed URL generated |
| 6e | Revoke access | ✓ File access revoked |
| 6f | Delete file | ✓ File removed from storage |

#### 7. Payments & Fines
| Step | Action | Expected Result |
|------|--------|-----------------|
| 7a | View outstanding fines | ✓ Fine list & amounts |
| 7b | Pay fines | ✓ Payment processed |
| 7c | View payment history | ✓ Past payments listed |
| 7d | Check payment summary | ✓ Total paid & balance |

#### 8. Notifications
| Step | Action | Expected Result |
|------|--------|-----------------|
| 8a | Get notifications | ✓ User notifications |
| 8b | Check unread count | ✓ Unread count accurate |
| 8c | Mark as read | ✓ Notification marked |
| 8d | Update preferences | ✓ Preferences saved |

#### 9. Print System
| Step | Action | Expected Result |
|------|--------|-----------------|
| 9a | Request print job | ✓ Job created, notification sent |
| 9b | View print jobs | ✓ User's pending/completed jobs |
| 9c | Check job status | ✓ Current job status |

---

## 🔍 Critical Checks

### API Connectivity
```bash
# Test API is accessible
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer YOUR_TOKEN"

# Expected: { "success": true, "data": { user profile... } }
```

### Database Connection
- [ ] Supabase credentials in `.env`
- [ ] Database schema applied
- [ ] Tables created: users, books, transactions, etc.

### Real-time Features (Socket.IO)
- [ ] Backend Socket.IO running
- [ ] Mobile app connecting to Socket
- [ ] Real-time notifications working

### File Storage (Cloudflare)
- [ ] Cloudflare R2 bucket created
- [ ] Credentials in `.env`
- [ ] File upload functional

### Token Refresh
- [ ] Token expiry set correctly
- [ ] Refresh token mechanism working
- [ ] 401 response triggers refresh flow

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port
kill -9 <PID>

# Try different port
PORT=5000 npm run dev
```

### Mobile Can't Connect to Backend
```bash
# Check backend is running
curl http://localhost:3000 -v

# Verify API URL in mobile .env
cat mobile/.env | grep EXPO_PUBLIC_API_URL

# Check network connectivity
# If on different machine, use: http://your-ip:3000/api
```

### Database Connection Error
```bash
# Verify Supabase credentials
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check schema exists
psql $DATABASE_URL -d smart_library -c "\dt"
```

### File Upload Fails
```bash
# Verify Cloudflare credentials
echo $CLOUDFLARE_BUCKET_NAME

# Check bucket exists and is accessible
# Test with AWS CLI or Cloudflare console
```

### QR Code Not Refreshing
```bash
# Backend QR generation
curl http://localhost:3000/api/qr/user -H "Authorization: Bearer TOKEN"

# Should return new QR every 10 seconds
```

---

## 📊 Performance Baseline

Target metrics for production:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| API Response Time | <200ms | Check browser Network tab |
| Database Query | <100ms | Check backend logs |
| QR Refresh | <300ms | QR update interval |
| File Upload | <5s | Measure from UI |
| Search Query | <500ms | Search response time |

---

## 🚢 Production Deployment

### Environment Setup
```bash
# Production .env
NODE_ENV=production
DATABASE_URL=<prod_supabase_url>
JWT_SECRET=<strong_random_secret>
REFRESH_TOKEN_SECRET=<strong_random_secret>
```

### Server Deployment (Example: PM2)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start backend/server.js --name "smart-library"

# Save process list
pm2 save

# Enable startup
pm2 startup
```

### Mobile App Deployment
```bash
# Build for Android
cd mobile
eas build --platform android

# Build for iOS
eas build --platform ios

# Standalone APK
eas build --platform android --type apk
```

### Database Backup
```bash
# Backup PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# Schedule daily backups (cron)
0 2 * * * pg_dump $DATABASE_URL > /backups/backup-$(date +\%Y\%m\%d).sql
```

---

## 📞 Support & Documentation

- **API Docs**: [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Integration Status**: [BACKEND_FRONTEND_INTEGRATION.md](BACKEND_FRONTEND_INTEGRATION.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Database Schema**: [DATABASE_SCHEMA.sql](docs/DATABASE_SCHEMA.sql)

---

## ✅ Final Checklist Before Launch

- [ ] All 65+ endpoints tested and working
- [ ] Mobile app connects successfully to backend
- [ ] Authentication flow complete (register → login → refresh)
- [ ] Books, transactions, and payments functional
- [ ] QR and RFID systems operational
- [ ] File sharing with auto-deletion working
- [ ] Real-time notifications via Socket.IO
- [ ] Database backups configured
- [ ] Error logging and monitoring in place
- [ ] CORS and security headers configured
- [ ] Rate limiting active
- [ ] Environment variables secured

---

**🎉 Ready to Deploy!**

Once all items are checked, the Smart Library system is production-ready and can handle real-world library operations.
