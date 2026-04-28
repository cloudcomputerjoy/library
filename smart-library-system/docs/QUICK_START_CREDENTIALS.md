# Credential Management & Environment Setup - Quick Start

## 🚀 5-Minute Quick Start

### Prerequisites
- Running backend server with credential routes mounted
- Database migrations executed
- Admin panel loaded

---

## Part 1: Credential Management 🔑

### Setup Email Credentials (Gmail SMTP)

```
1. Click "Credentials" in admin menu
2. Click "Email Credentials" tab
3. Click "+ Add Email Credential" button
4. Fill in:
   Email: your-email@gmail.com
   Password: [Your Gmail App Password]
   Host: smtp.gmail.com
   Port: 587
   TLS: Checked ✓
5. Click "Add"
```

**Get Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. App passwords → Select Mail & Windows
4. Copy the generated app password
5. Paste into the form

**Add More Credentials:**
- Repeat steps 3-5 with different Gmail accounts
- System auto-rotates between them
- Lower priority = higher priority (1 = first choice)

### Setup API Keys (OpenRouter)

```
1. Click "API Keys" tab in Credentials
2. Click "+ Add API Key" button
3. Fill in:
   Service: openrouter
   API Key: [Your OpenRouter API Key]
   Priority: 1
4. Click "Add"
```

**Get OpenRouter API Key:**
1. Go to [OpenRouter](https://openrouter.ai)
2. Sign in → Dashboard
3. API Keys → Create new key
4. Copy and paste into form

**Add Multiple Keys:**
- Add unlimited API keys
- System auto-rotates on rate limits
- auto-disables only on 401 (invalid key)

### Test Your Credentials

```
1. Find credential in the list
2. Click "Test" button
3. View results in popup
4. Success ✓ = ready for production
```

### Health Check

```
1. Click "Health Check" in Actions
2. System verifies all credentials
3. Auto-disables unhealthy ones
4. View results in modal
```

### Enable/Disable Credentials

```
1. Find credential in list
2. Toggle the status switch
3. "Enabled" credentials are used for rotation
4. "Disabled" credentials are skipped
```

### View Statistics

```
In the statistics panel:
- Total: All credentials in system
- Enabled: Currently active credentials
- Current Index: Which credential is currently selected
```

---

## Part 2: Environment File Generator ⚙️

### Create .env for Backend

```
1. Click "Environment Setup" in admin menu
2. Click "Backend" folder button
3. Click "Insert Backend Template"
   (Adds: SUPABASE_URL, JWT_SECRET, SMTP_HOST, etc.)
4. Fill in your actual values
5. Click "Copy to Clipboard" or "Download .env.backend"
```

### Create .env for Admin

```
1. Click "Admin" folder button
2. Click "Insert Admin Template"
   (Adds: REACT_APP_API_URL, REACT_APP_SUPABASE_URL, etc.)
3. Fill in your frontend URLs
4. Download or copy
```

### Create .env for Mobile

```
1. Click "Mobile" folder button
2. Click "Insert Mobile Template"
   (Adds: API_URL, SUPABASE_URL, APP_ENV, etc.)
3. Fill in values
4. Download or copy
```

### Download All at Once

```
1. Configure Backend variables
2. Switch to Admin, configure
3. Switch to Mobile, configure
4. Click "📦 Download All 3 Folders"
   - Gets .env.backend
   - Gets .env.admin
   - Gets .env.mobile
```

### Save Configuration as Template

```
1. Setup all your variables
2. Click "Save as Template"
3. Enter name: "Production Setup" or "Development"
4. Click "Save"
```

### Reuse Saved Template

```
Left sidebar → Saved Templates:
1. Click "Load" on your saved template
2. All variables populate instantly
3. Modify as needed
4. Download or copy
```

### Backup & Restore

```
Backup to JSON:
1. Click "📤 Export as JSON"
2. Saves entire configuration

Restore from JSON:
1. Click "📥 Import JSON"
2. Select previously saved JSON file
3. All templates and variables restored
```

---

## Common Workflows

### Workflow 1: First-Time Setup

```
1. Go to Credential Management
2. Add 2-3 Gmail accounts for email rotation
3. Add 2-3 OpenRouter API keys for API rotation
4. Run Health Check → all should pass ✓
5. Go to Environment Setup
6. Create backend, admin, mobile .env files
7. Download all 3 and place in folders
8. Done! 🎉
```

### Workflow 2: Add New Email Account

```
1. Credentials → Email Credentials
2. Click "+ Add Email Credential"
3. Fill Gmail details
4. Click "Test" to verify
5. If successful ✓, it's active and in rotation
6. System auto-switches to it when needed
```

### Workflow 3: Rotate Out Bad Key

```
1. Credentials → API Keys
2. Find problematic key
3. Click "Delete" or toggle Off
4. System continues with other keys
5. Click "Health Check" to verify
```

### Workflow 4: Deploy to Production

```
1. Environment Setup → Backend
2. Insert template + fill values
3. Download .env.backend
4. Credentials → Test all keys/emails ✓
5. Deploy backend with .env file
6. Repeat for Admin and Mobile
7. Monitor via Health Check dashboard
```

---

## Keyboard Shortcuts & Tips

| Action | Shortcut/Tip |
|--------|--------------|
| Copy to clipboard | Click 📋 Copy button (faster than download) |
| Add variable | Click "+ Add Variable" or refill same field |
| Remove variable | Click "✕" button at end of row |
| Test credential | Click "Test" and wait for result |
| Health check all | Click "Health Check" in actions |
| Save template | Name it for easy reference later |
| Load template | Click "Load" from Saved Templates list |
| Clear all | Click "Clear All" (with confirmation) |

---

## Troubleshooting Quick Fixes

### Email Credential Test Fails
```
Problem: "Authentication failed"
Solution: 
  → Use Gmail App Password (not regular password)
  → Check Gmail 2FA is enabled
  → Verify email address is correct
```

### API Key Test Fails
```
Problem: "401 Unauthorized"
Solution: 
  → Verify API key from OpenRouter dashboard
  → Check key hasn't expired
  → Confirm key has required permissions
```

### .env File Won't Download
```
Problem: Download button doesn't work
Solution: 
  → Try "Copy to Clipboard" instead
  → Add at least one variable (KEY=VALUE)
  → Check browser download permissions
```

### Credentials Disabled After Health Check
```
Problem: "Some credentials disabled"
Solution: 
  → Click "Test" on disabled credential
  → Verify configuration
  → If persistent issue, delete and re-add
```

### Can't Load Template
```
Problem: Template not appearing
Solution: 
  → Refresh page (templates stored in browser)
  → Try import JSON backup if available
  → Re-add credentials manually
```

---

## Best Practices Checklist ✓

- [ ] Always test credentials before enabling
- [ ] Set up 2+ credentials for redundancy
- [ ] Run health check weekly
- [ ] Save templates for different environments
- [ ] Backup with "Export as JSON" monthly
- [ ] Rotate API keys quarterly
- [ ] Use Gmail App Passwords, not regular passwords
- [ ] Review email/API logs regularly
- [ ] Monitor auto-triggered failovers
- [ ] Document which credentials are for which service

---

## Quick Reference: Variable Names

### Backend Required Variables
```
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
OPENROUTER_API_KEY=your-api-key
PORT=3000
NODE_ENV=production
```

### Admin Required Variables
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_ENVIRONMENT=production
```

### Mobile Required Variables
```
API_URL=http://localhost:3000/api
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
APP_ENV=production
```

---

## When Things Break 🔧

### Admin Panel Won't Load Components

Check browser console (F12):
```
Look for: "CredentialManagement is not defined"
Solution: Verify components imported in App.js
```

### API Calls 404 Not Found

Check backend is running:
```
POST /api/credentials/email should return list
If 404: Routes not mounted in server.js
```

### Credentials Lost After Refresh

Credentials stored in database, email settings in browser localStorage:
```
If lost: Check if logged in as admin
If still lost: Database connection issue
```

### All Credentials Disabled After Restart

Health check ran and all failed:
```
Check: Email SMTP accessible from server IP
Check: OpenRouter API key still valid
Check: Network/firewall not blocking requests
```

---

## Getting Help

If you encounter issues:

1. **Check Logs:**
   - Backend logs: View server.js console
   - Browser logs: Press F12 → Console tab
   - Database logs: Check Supabase dashboard

2. **Verify Status:**
   - Click "Health Check" to see current status
   - Test individual credentials
   - Check error messages in modals

3. **Review Configuration:**
   - Email: Verify Gmail app password
   - API Key: Verify key from dashboard
   - Network: Check firewall rules

4. **Reference:**
   - See CREDENTIAL_ROTATION_INTEGRATION.md for technical details
   - Check error logs in database tables
   - Review Best Practices section above

---

## That's It! 🎉

You're now ready to manage credentials and environment variables like a pro. The system handles auto-failover automatically, so you can add multiple credentials without worry!

**Happy coding! 🚀**
