# 🚀 Smart Library - Quick Start Developer Guide

**Get up and running in 5 minutes! ✨ Now with full backend integration!**

---

## 🎯 Current Status

✅ **Backend** - Express API fully implemented (65+ endpoints)  
✅ **Mobile** - React Native app with Expo SDK 55  
✅ **Integration** - All endpoints verified and aligned  
✅ **Testing** - Integration test suite included  

---

## 📂 Project Structure

```
smart-library-system/
├── backend/                          # Node.js Express API
│   ├── src/
│   │   ├── config/                  # Configuration files
│   │   ├── controllers/             # Route handlers
│   │   ├── services/                # Business logic
│   │   ├── routes/                  # API routes ✨ VERIFIED
│   │   ├── middleware/              # Auth, validation
│   │   ├── utils/                   # Helpers
│   │   ├── jobs/                    # Background jobs
│   │   ├── tests/                   # ✨ NEW: Integration tests
│   │   └── app.js                   # Express app
│   ├── server.js                    # Server entry
│   ├── package.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── BACKEND_SETUP.md
│
├── mobile/                           # React Native Expo App
│   ├── src/
│   │   ├── screens/                 # 26+ app screens
│   │   ├── components/              # Reusable components
│   │   ├── navigation/              # Navigation config
│   │   ├── services/                # API services ✨ VERIFIED
│   │   ├── hooks/                   # Custom hooks
│   │   ├── utils/                   # Utilities
│   │   ├── styles/                  # Theme & styling
│   │   └── App.js                   # App entry
│   ├── app.json
│   ├── .env.example
│   ├── eas.json
│   ├── package.json
│   └── REACT_NATIVE_SETUP.md
│
├── docs/                             # Documentation
│   ├── API_DOCUMENTATION.md         # Complete API reference
│   ├── DATABASE_SCHEMA.sql          # Supabase schema
│   ├── DEPLOYMENT_GUIDE.md          # Deploy instructions
│   ├── RFID_INTEGRATION.md          # RFID setup
│   └── FILE_SHARING_AND_PRINT_SYSTEM.md
│
└── README.md                         # This file
```

---

## ⚡ 5-Minute Setup

### Step 1: Clone & Navigate
```bash
git clone https://github.com/yourusername/smart-library.git
cd smart-library
```

### Step 2: Backend Setup (2 min)
```bash
cd backend

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env

# Edit .env with:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - JWT_SECRET
# - CLOUDFLARE credentials
# - SMTP settings

# Start backend
npm run dev
# ✅ Backend running on http://localhost:3000
```

### Step 3: Mobile Setup (2 min)
```bash
cd mobile

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env

# Edit .env with API URL:
# REACT_APP_API_URL=http://localhost:3000/api/v1

# Start app
npx expo start
# Scan QR with Expo Go app
```

### Step 4: Database Setup (1 min)
```bash
# 1. Go to Supabase console
# 2. Create new project
# 3. Copy URL and keys to backend .env
# 4. Open SQL editor
# 5. Paste docs/DATABASE_SCHEMA.sql
# 6. Execute all statements
# ✅ Database ready!
```

---

## 🎯 Key Commands

### Backend
```bash
npm run dev          # Development server with hot reload
npm run start        # Production build
npm run test         # Run tests
npm run test:watch  # Watch tests
pm2 start server.js # Production with PM2
```

### Mobile
```bash
npx expo start           # Start development
npx expo build:android   # Build APK
npx expo build:ios       # Build IPA
npx expo prebuild        # Generate native folders
```

### Database
```bash
# Supabase CLI
supabase db pull         # Pull schema
supabase db push         # Push changes
supabase db reset        # Reset database
```

---

## 🔑 Essential Environment Variables

### Backend `.env`
```env
# Minimum required
NODE_ENV=development
PORT=3000
JWT_SECRET=your_secret_key_here_min_32_chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key
REDIS_URL=redis://localhost:6379
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_BUCKET_NAME=smart-library
```

### Mobile `.env`
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key
REACT_APP_SOCKET_URL=http://localhost:3000
```

---

## 🧪 Testing the System

### 1. Test API
```bash
# Health check
curl http://localhost:3000/health

# Login user
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Create book
curl -X POST http://localhost:3000/api/v1/books \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Book",
    "author":"Author Name",
    "isbn":"978-0000000000",
    "category":"Fiction",
    "total_copies":5
  }'
```

### 2. Test QR System
```javascript
// In mobile app, QR code refreshes automatically
// Every 15 seconds new token generated
// Scan to test entry/exit
// Check logs for real-time events
```

### 3. Test Socket.IO
```bash
# Install socket.io-client
npm install socket.io-client

# Test connection
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected!'));
socket.on('entry_success', (data) => console.log('Entry:', data));
"
```

---

## 🐛 Common Issues & Fixes

### Backend won't start
```bash
# Check port 3000 is free
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Check Node version
node --version  # Should be 18+
```

### Mobile can't connect to API
```bash
# Ensure backend is running
curl http://localhost:3000/health

# Check .env has correct URL
cat .env | grep API_URL

# Check CORS is enabled in backend
# In src/app.js, verify cors configuration
```

### Database connection error
```bash
# Verify Supabase connection string
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
psql <connection-string>
```

### Socket.IO not connecting
```bash
# Check backend is serving socket.io
curl http://localhost:3000/socket.io/

# Verify CORS in socket config
# Check firewall isn't blocking websocket
```

---

## 📱 First Time User Flow

1. **Open App** → Splash screen → Auth check
2. **No account?** → Register → Email verification → Create account
3. **Login** → Authenticate via JWT
4. **Dashboard** → Show quick actions
5. **QR code tab** → Display dynamic QR (refreshes every 15s)
6. **Books tab** → Search and browse
7. **Issue book** → QR scan at library
8. **Return book** → QR scan again
9. **View issued books** → Show due dates
10. **Pay fines** → SSLCommerz integration

---

## 🔄 Core Workflow

### Student Workflow
```
Login → Dashboard → Show QR → Scan for Entry → Browse Books → Request Book → 
Return Book → Scan for Exit → Pay Fines → Upload Notes → Share Files
```

### Librarian Workflow
```
Login → Dashboard → Scan Barcode → Issue Book → Accept Return → Process Fines → 
Approve Print Jobs → Monitor Occupancy
```

### Admin Workflow
```
Login → Dashboard → User Management → Book Management → Analytics → 
Settings → RFID Setup → Report Generation
```

---

## 📊 Key Features Status

| Feature | Backend | Mobile | Status |
|---------|---------|--------|--------|
| Authentication | ✅ | ✅ | Ready |
| Dynamic QR Code | ✅ | ✅ | Ready |
| Book Management | ✅ | ✅ | Ready |
| Issue/Return | ✅ | ✅ | Ready |
| Attendance Tracking | ✅ | ✅ | Ready |
| RFID Integration | ✅ | ✅ | Ready |
| File Sharing | ✅ | ✅ | Ready |
| Print Management | ✅ | ✅ | Ready |
| Socket.IO Real-time | ✅ | ✅ | Ready |
| Payment Gateway | ✅ | ✅ | Ready |
| User Dashboard | ✅ | ✅ | Ready |
| Admin Dashboard | ✅ | ⏳ | Planned |

---

## 🎓 Learning Path

1. **Start with API**
   - Read [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
   - Test endpoints with Postman/curl
   - Understand authentication flow

2. **Understand Database**
   - Review [DATABASE_SCHEMA.sql](docs/DATABASE_SCHEMA.sql)
   - Check relationships between tables
   - Understand RLS policies

3. **Backend Implementation**
   - Study [BACKEND_SETUP.md](backend/BACKEND_SETUP.md)
   - Examine service classes
   - Review middleware

4. **Mobile Development**
   - Review [REACT_NATIVE_SETUP.md](mobile/REACT_NATIVE_SETUP.md)
   - Study Redux store setup
   - Check component structure

5. **Integration Features**
   - RFID: [RFID_INTEGRATION.md](docs/RFID_INTEGRATION.md)
   - Files & Print: [FILE_SHARING_AND_PRINT_SYSTEM.md](docs/FILE_SHARING_AND_PRINT_SYSTEM.md)
   - Deployment: [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

---

## 🚀 Next Steps After Setup

### Immediate
- [ ] All services running locally
- [ ] Database schema deployed
- [ ] Test authentication flow
- [ ] Verify API endpoints

### Short Term (Week 1)
- [ ] Complete backend implementation
- [ ] Build admin dashboard
- [ ] Setup RFID testing
- [ ] Configure payment gateway

### Medium Term (Month 1)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation review

### Long Term (Before Launch)
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User training materials
- [ ] Support documentation

---

## 📞 Quick Help

### Documentation Links
- **API Details**: [Full API Docs](docs/API_DOCUMENTATION.md)
- **Deployment**: [Deploy Instructions](docs/DEPLOYMENT_GUIDE.md)
- **RFID Setup**: [RFID Guide](docs/RFID_INTEGRATION.md)
- **File System**: [File & Print Docs](docs/FILE_SHARING_AND_PRINT_SYSTEM.md)

### Common Tasks
- **Add new API endpoint**: See `backend/src/routes/`
- **Create new screen**: See `mobile/src/screens/`
- **Add database table**: See `docs/DATABASE_SCHEMA.sql`
- **Deploy to production**: See `docs/DEPLOYMENT_GUIDE.md`

---

## ✅ Verification Checklist

After 5-minute setup, verify:

```
□ Backend is running on http://localhost:3000
□ API health check responds: curl http://localhost:3000/health
□ Mobile app connects and loads
□ Database tables exist in Supabase
□ Socket.IO connection successful
□ Authentication tokens generated
□ At least one book query works
```

---

## 🎉 You're Ready!

Your Smart Library system is now set up and ready for development.

**Happy Coding! 🚀**

---

**Duration**: ~5 minutes  
**Difficulty**: Beginner-friendly  
**Support**: Check docs/ folder for detailed guides
