# 🚀 QUICK START - LOCAL TESTING GUIDE

**Last Updated**: April 11, 2026  
**Purpose**: Launch and test the Smart Library Admin Dashboard locally

---

## 📋 PRE-FLIGHT CHECKLIST

Before starting, verify you have:
- [ ] Node.js installed (v14+)
- [ ] npm or yarn package manager
- [ ] Port 5000 available (backend)
- [ ] Port 3000 available (frontend)
- [ ] Two terminal windows ready

---

## 🖥️ TERMINAL 1: START BACKEND SERVER

**Time**: ~30 seconds (first run: 2 minutes with npm install)

### Step 1: Navigate to Backend
```bash
cd c:\Users\USER\Desktop\library\smart-library-system\backend
```

### Step 2: Install Dependencies (First Time Only)
```bash
npm install
```

**Expected Output**:
```
added 156 packages in 45s
```

### Step 3: Start Backend Server
```bash
npm start
```

**✅ SUCCESS - Look for**:
```
✓ Server running on port 5000
✓ Database connected
✓ Socket.IO initialized
Ready for connections
```

**❌ If you see errors**:
- Port 5000 already in use → Change port in backend/server.js
- Missing dependencies → Run `npm install` again
- Database error → Check backend/.env file

---

## 🖥️ TERMINAL 2: START FRONTEND SERVER

**Time**: ~45 seconds (first run: 3 minutes with npm install)

### Step 1: Navigate to Frontend
```bash
cd c:\Users\USER\Desktop\library\smart-library-system\admin
```

### Step 2: Install Dependencies (First Time Only)
```bash
npm install
```

**Expected Output**:
```
added 847 packages in 2m 30s
```

### Step 3: Start Frontend Development Server
```bash
npm start
```

**✅ SUCCESS - Look for**:
```
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

---

## 🌐 BROWSER: NAVIGATE & TEST

### Step 1: Open Browser
- Go to: **http://localhost:3000/admin**

### Step 2: Verify Dashboard Loads
You should see:
- [ ] Admin Dashboard page
- [ ] Stats cards (even if empty - that's OK)
- [ ] Sidebar with 13 pages
- [ ] No red errors in console

### Step 3: Test Page Navigation
Click through each page:
- [ ] Dashboard ✓
- [ ] Users List
- [ ] Books List
- [ ] Transactions
- [ ] QR Logs
- [ ] Attendance
- [ ] Print Services
- [ ] Payments
- [ ] Reports
- [ ] AI Insights
- [ ] Support
- [ ] Settings
- [ ] System Logs

### Step 4: Check Browser Console
Press: **F12** or **Ctrl+Shift+I**

**Look for**:
- ✅ No red error messages
- ✅ Network tab shows API calls (even if 404 - that's expected)
- ✅ Console shows "AdminContext initialized"

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Port 5000 already in use"
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the number shown)
taskkill /PID <PID> /F

# Or use a different port in backend/.env
PORT=5001
```

### Issue: "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rmdir node_modules /s /q
npm install
npm start
```

### Issue: "Module not found: 'react'"
- Make sure you're in the correct directory
- Run `npm install` in that directory

### Issue: Blank page in browser
1. Press F12 to open console
2. Look for red errors
3. Check if backend is running on port 5000
4. Check if frontend is running on port 3000

### Issue: "Cannot GET /admin"
- Make sure you're using the full URL: `http://localhost:3000/admin`
- Not just `http://localhost:3000`

---

## ✅ VERIFICATION CHECKLIST

Once both servers are running:

### Backend (Terminal 1)
- [ ] "Server running on port 5000"
- [ ] "Socket.IO initialized"
- [ ] No error messages

### Frontend (Terminal 2)
- [ ] "Compiled successfully!"
- [ ] "You can now view the app in the browser"
- [ ] No warning messages

### Browser (http://localhost:3000/admin)
- [ ] Dashboard page visible
- [ ] Sidebar shows 13 pages
- [ ] All pages are clickable
- [ ] No red console errors

---

## 📊 NEXT PHASE: INTEGRATION TESTING

Once verified, these need backend integration:

1. **Database Setup** - Create tables (book_copies, fines, attendance, etc.)
2. **API Endpoints** - Connect 40+ endpoints to database
3. **Socket.IO Events** - Real-time entry/exit updates
4. **Authentication** - Verify JWT token validation
5. **File Uploads** - Test bulk import & file handling

---

## 🛑 TO STOP SERVERS

### Stop Backend (Terminal 1)
```
Press: Ctrl + C
```

### Stop Frontend (Terminal 2)
```
Press: Ctrl + C
```

---

## 📱 USEFUL COMMANDS

```bash
# Clear npm cache if having issues
npm cache clean --force

# Check Node version
node --version

# Check npm version
npm --version

# Run with specific port
PORT=3001 npm start

# Build for production (frontend)
npm run build

# Run tests
npm test

# Format code
npm run format
```

---

## 🎯 SUCCESS INDICATORS

| Check | Status | Issue |
|-------|--------|-------|
| Backend starts | ✓ | Port in use / Missing .env |
| Frontend compiles | ✓ | Missing dependencies |
| Dashboard loads | ✓ | Backend not running |
| 13 pages accessible | ✓ | Routing issue |
| No console errors | ✓ | Missing imports |

---

## 📞 SUPPORT

If you encounter issues:

1. **Check console errors** (F12 in browser)
2. **Check terminal output** for error messages
3. **Verify ports** are available (5000, 3000)
4. **Reinstall dependencies** if stuck
5. **Check .env** files exist with correct values

---

**Ready to test? Run both commands below in separate terminals! 🚀**

```bash
# Terminal 1 - Backend
cd c:\Users\USER\Desktop\library\smart-library-system\backend
npm install && npm start

# Terminal 2 - Frontend  
cd c:\Users\USER\Desktop\library\smart-library-system\admin
npm install && npm start
```

Then visit: http://localhost:3000/admin
