# Environment Variables Quick Reference

## 📋 Complete .env Variables Guide

### Backend .env Variables

```env
# ============================================================
# BACKEND ENVIRONMENT CONFIGURATION
# ============================================================

# APPLICATION & SERVER
NODE_ENV=development|staging|production
PORT=5000
API_URL=http://localhost:5000
APP_NAME=Smart Library
DEBUG=true|false
TRACE=true|false
LOG_REQUEST_BODY=true|false
LOG_RESPONSE_BODY=true|false

# DATABASE CONNECTION (SUPABASE)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AUTHENTICATION
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# PAYMENT GATEWAY - BKASH
BKASH_API_KEY=your_bkash_key
BKASH_API_SECRET=your_bkash_secret
BKASH_MODE=sandbox|production
BKASH_USERNAME=your_username
BKASH_PASSWORD=your_password

# PAYMENT GATEWAY - NAGAD
NAGAD_API_KEY=your_nagad_key
NAGAD_API_SECRET=your_nagad_secret
NAGAD_MODE=sandbox|production

# EMAIL SERVICE (SMTP)
SMTP_ENABLED=true|false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@library.com
SMTP_SECURE=true|false

# SMS SERVICE (TWILIO)
TWILIO_ENABLED=true|false
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# STORAGE SERVICE (CLOUDFLARE R2)
CLOUDFLARE_ENABLED=true|false
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_BUCKET_NAME=your-bucket-name
CLOUDFLARE_PUBLIC_URL=https://your-bucket-name.cdnjs.dev

# AI SERVICE (OPENROUTER)
OPENROUTER_ENABLED=true|false
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-3.5-turbo

# SECURITY & CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true|false

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# LOGGING
LOG_FORMAT=json|text
LOG_LEVEL=debug|info|warn|error
```

### Admin Panel .env Variables

```env
# ============================================================
# ADMIN PANEL ENVIRONMENT CONFIGURATION
# ============================================================

# APPLICATION
REACT_APP_NAME=Smart Library
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development|staging|production

# API CONFIGURATION
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=30000

# DATABASE (SUPABASE)
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AUTHENTICATION
REACT_APP_JWT_STORAGE_KEY=auth_token
REACT_APP_AUTH_TOKEN_EXPIRY=7d

# FEATURES & FLAGS
REACT_APP_ENABLE_ANALYTICS=true|false
REACT_APP_ENABLE_ERROR_TRACKING=true|false
REACT_APP_ENABLE_DEBUG_MODE=true|false

# LOGGING
REACT_APP_LOG_LEVEL=debug|info|warn|error
REACT_APP_LOG_REQUESTS=true|false
REACT_APP_LOG_RESPONSES=true|false

# STORAGE
REACT_APP_CLOUDFLARE_DOMAIN=https://your-bucket-name.cdnjs.dev

# PAYMENT INTEGRATION
REACT_APP_BKASH_ENABLED=true|false
REACT_APP_NAGAD_ENABLED=true|false
REACT_APP_PAYMENT_TIMEOUT=30000

# COMMUNICATION
REACT_APP_EMAIL_ENABLED=true|false
REACT_APP_SMS_ENABLED=true|false

# AI
REACT_APP_AI_ENABLED=true|false
REACT_APP_AI_MODEL=openai/gpt-3.5-turbo

# UI/UX SETTINGS
REACT_APP_THEME_COLOR=#1976d2
REACT_APP_ITEMS_PER_PAGE=10
REACT_APP_ENABLE_DARK_MODE=true|false

# CACHE
REACT_APP_CACHE_TIMEOUT=3600000
REACT_APP_CACHE_ENABLED=true|false
```

### Mobile App .env Variables

```env
# ============================================================
# MOBILE APP ENVIRONMENT CONFIGURATION
# ============================================================

# APPLICATION
APP_NAME=Smart Library
APP_VERSION=1.0.0
ENV=development|staging|production

# API CONFIGURATION
API_URL=http://localhost:5000
API_TIMEOUT=30000
REQUEST_TIMEOUT=10000

# DATABASE (SUPABASE)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AUTHENTICATION
JWT_STORAGE_KEY=mobile_auth_token
AUTH_TOKEN_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# FEATURES
ENABLE_NOTIFICATIONS=true|false
ENABLE_OFFLINE_MODE=true|false
ENABLE_BIOMETRIC=true|false
ENABLE_DEBUG_MODE=true|false

# LOGGING
LOG_LEVEL=debug|info|warn|error
ENABLE_CRASH_REPORTING=true|false
ENABLE_ANALYTICS=true|false

# STORAGE
CLOUDFLARE_DOMAIN=https://your-bucket-name.cdnjs.dev
LOCAL_STORAGE_PATH=./app_data

# PAYMENT
BKASH_ENABLED=true|false
NAGAD_ENABLED=true|false
PAYMENT_TIMEOUT=30000

# COMMUNICATION
SMS_ENABLED=true|false
EMAIL_ENABLED=true|false

# AI
AI_ENABLED=true|false
AI_MODEL=openai/gpt-3.5-turbo

# PUSH NOTIFICATIONS
PUSH_NOTIF_ENABLED=true|false
FCM_ENABLED=true|false

# DEVICE PERMISSIONS
CAMERA_PERMISSION_REQUIRED=true|false
PHOTO_LIBRARY_REQUIRED=true|false

# LOCATION
LOCATION_ENABLED=true|false
LOCATION_PERMISSION_REQUIRED=true|false

# UI/UX
THEME_COLOR=#1976d2
ENABLE_DARK_MODE=true|false
ITEMS_PER_PAGE=15

# CACHE
CACHE_TIMEOUT=3600000
LOCAL_CACHE_ENABLED=true|false
```

---

## 🔑 API Keys & Credentials Needed

### Services Required

| Service | Type | Purpose | Location |
|---------|------|---------|----------|
| Supabase | Database | Data storage & auth | supabase.com |
| bKash | Payment | Mobile payments | developer.bkash.com |
| Nagad | Payment | Telecom payments | developer.nagad.com.bd |
| Gmail/SMTP | Email | Send emails | mail.google.com |
| Twilio | SMS | Send SMS messages | twilio.com |
| Cloudflare R2 | Storage | File storage | cloudflare.com |
| OpenRouter | AI | AI integration | openrouter.ai |

---

## 🚀 Getting Started

### Quick Setup Command

```bash
# 1. Clone repository
git clone <repo-url>

# 2. Install dependencies for all folders
cd backend && npm install
cd ../admin && npm install
cd ../mobile && npm install

# 3. Generate .env files using admin panel
# Access: http://localhost:3000/settings/env-generator
# Fill credentials and copy/download .env files

# 4. Place .env files
# backend/.env, admin/.env, mobile/.env

# 5. Start services
cd backend && npm start
cd ../admin && npm start
cd ../mobile && npm start
```

---

## ✅ Validation Checklist

After setting up .env files:

### Backend
- [ ] `NODE_ENV` is set correctly
- [ ] `SUPABASE_URL` and keys are valid
- [ ] `JWT_SECRET` is strong (64+ characters)
- [ ] Payment gateway credentials are correct
- [ ] SMTP credentials work
- [ ] Twilio SID and token are valid
- [ ] Cloudflare credentials are correct
- [ ] OpenRouter API key is valid

### Admin Panel
- [ ] `REACT_APP_API_URL` matches backend URL
- [ ] `REACT_APP_SUPABASE_URL` matches backend
- [ ] `REACT_APP_SUPABASE_ANON_KEY` is correct
- [ ] Feature flags are appropriately set
- [ ] API timeout is reasonable

### Mobile App
- [ ] `API_URL` points to correct backend
- [ ] `SUPABASE_URL` and keys are valid
- [ ] Offline mode is configured
- [ ] Permissions are correct
- [ ] Storage path is accessible

---

## 🔐 Security Guidelines

### DO ✅
- Use HTTPS for all URLs in production
- Generate strong JWT secrets (64+ chars)
- Use different credentials for dev/staging/prod
- Rotate API keys every 3-6 months
- Keep credentials in .env files only
- Add .env to .gitignore
- Use environment-specific keys

### DON'T ❌
- Commit .env files to git
- Share credentials via email/chat
- Use same keys across environments
- Upload .env to public repositories
- Hardcode secrets in source code
- Take screenshots of credentials
- Share credentials with unauthorized users

---

## 🛠️ Troubleshooting Quick Links

### Database Issues
- Check Supabase project status
- Verify URL format: `https://xxxx.supabase.co`
- Validate API keys with Supabase
- Check network connectivity

### Payment Issues
- Verify API keys are correct
- Check if sandbox/production mode matches
- Test with provided test credentials first
- Check service status pages

### Email Issues
- Enable "Less secure apps" for Gmail
- Use App Password (not regular password)
- Check SMTP port (usually 587)
- Verify "From" address matches account

### SMS Issues
- Verify Twilio account is active
- Check phone number format
- Ensure account has credits
- Test with Twilio dashboard first

### Storage Issues
- Verify R2 bucket exists
- Check access key credentials
- Verify bucket name spelling
- Check Cloudflare account status

### AI Issues
- Verify OpenRouter API key format
- Check model name spelling
- Ensure account has credits
- Test API key with OpenRouter dashboard

---

## 📝 Common Patterns

### Development Environment
```env
NODE_ENV=development
DEBUG=true
TRACE=false
LOG_REQUEST_BODY=true
BKASH_MODE=sandbox
NAGAD_MODE=sandbox
API_TIMEOUT=30000
```

### Staging Environment
```env
NODE_ENV=staging
DEBUG=false
TRACE=true
LOG_REQUEST_BODY=false
BKASH_MODE=sandbox
NAGAD_MODE=sandbox
API_TIMEOUT=30000
```

### Production Environment
```env
NODE_ENV=production
DEBUG=false
TRACE=false
LOG_REQUEST_BODY=false
BKASH_MODE=production
NAGAD_MODE=production
API_TIMEOUT=10000
```

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **bKash Docs:** https://developer.bkash.com/api-documentation
- **Nagad Docs:** https://developer.nagad.com.bd
- **Twilio Docs:** https://www.twilio.com/docs
- **Cloudflare R2:** https://developers.cloudflare.com/r2
- **OpenRouter:** https://openrouter.ai/docs

---

## 📊 Variable Summary

| Category | Backend | Admin | Mobile |
|----------|---------|-------|--------|
| Database | ✅ 3 vars | ✅ 2 vars | ✅ 3 vars |
| Payment | ✅ 8 vars | ✅ 2 vars | ✅ 2 vars |
| Communication | ✅ 6 vars | ✅ 2 vars | ✅ 2 vars |
| Storage | ✅ 5 vars | ✅ 1 var | ✅ 1 var |
| AI | ✅ 2 vars | ✅ 2 vars | ✅ 2 vars |
| App Config | ✅ 8 vars | ✅ 10 vars | ✅ 15 vars |
| **Total** | **~32** | **~19** | **~25** |

---

## 🎯 Next Steps

1. ✅ Gather all API credentials
2. ✅ Access Environment Generator in admin panel
3. ✅ Fill in all credentials
4. ✅ Copy/Download .env files
5. ✅ Place files in correct folders
6. ✅ Run npm install in each folder
7. ✅ Start each service
8. ✅ Verify all services connect properly
9. ✅ Test payment, email, SMS services
10. ✅ Deploy to production

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Ready for Use
