# Environment Variables Generator - Setup & Usage Guide

## Overview

The Environment Variables Generator is a secure, user-friendly tool that helps you manage and generate `.env` files for all three application folders:
- **Backend** - Node.js/Express server
- **Admin Panel** - React admin dashboard
- **Mobile** - React Native mobile app

---

## 📋 Features

✅ **Manual Credential Input Form** - Organized form with all required API keys and configurations
✅ **Secure Input Fields** - Password fields for sensitive credentials
✅ **Copy to Clipboard** - Quick copy functionality for each .env file
✅ **Download Files** - Download generated .env files with pre-filled names
✅ **Live Preview** - Toggle preview to see generated content before copying
✅ **Auto-Generate Secrets** - One-click generation of JWT secrets
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
✅ **Instructions & Best Practices** - Built-in guide for proper setup
✅ **Support for Multiple Environments** - Development, Staging, Production modes

---

## 🚀 Quick Start

### 1. Integration into Admin Panel

#### Step 1: Import the Component

Add the EnvGenerator component to your admin routing:

```javascript
// admin/src/App.js
import EnvGenerator from './pages/EnvGenerator';

// Add to your route configuration
<Route path="/settings/env-generator" element={<EnvGenerator />} />
```

#### Step 2: Add Navigation Link

Add a menu link in your sidebar or navigation:

```javascript
// In your Sidebar.js or Navigation component
<Link to="/settings/env-generator" className="nav-link">
  🔐 Environment Generator
</Link>
```

#### Step 3: Ensure CSS is Loaded

The CSS file `EnvGenerator.css` should be automatically loaded when the component is imported.

### 2. First Time Setup

1. **Access the Page**: Navigate to `/settings/env-generator` in the admin panel
2. **Gather Credentials**: Collect all your API keys and secrets before starting
3. **Fill the Form**: Enter all required credentials in the organized form
4. **Generate Files**: Click Copy or Download for each .env file
5. **Place Files**: Move downloaded files to their respective folders

---

## 📝 Credential Categories & Fields

### 🗄️ Database (Supabase)

| Field | Description | Example |
|-------|-------------|---------|
| Supabase URL | Your Supabase project URL | `https://xxxx.supabase.co` |
| Supabase Anon Key | Public anonymous key | From Supabase settings |
| Supabase Service Key | Service role secret key | From Supabase settings |

**How to get these:**
1. Go to [Supabase](https://supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the URLs and keys

---

### 💳 Payment Gateways

#### bKash
| Field | Description |
|-------|-------------|
| bKash API Key | API key from bKash dashboard |
| bKash Secret | Secret key from bKash |
| bKash Mode | `sandbox` for testing, `production` for live |

#### Nagad
| Field | Description |
|-------|-------------|
| Nagad API Key | API key from Nagad dashboard |
| Nagad Secret | Secret key from Nagad |
| Nagad Mode | `sandbox` for testing, `production` for live |

---

### 📧 Email Service (SMTP)

| Field | Description | Example |
|-------|-------------|---------|
| SMTP Host | Email server address | `smtp.gmail.com` |
| SMTP Port | Email server port | `587` |
| SMTP User | Email account for sending | `your-email@gmail.com` |
| SMTP Password | Email password or app password | From email provider |
| From Email | Default sender address | `noreply@library.com` |

**For Gmail:**
1. Enable 2-Factor Authentication
2. Create an App Password
3. Use App Password in the form

---

### 📱 SMS Service (Twilio)

| Field | Description |
|-------|-------------|
| Twilio Account SID | From Twilio console |
| Twilio Auth Token | From Twilio console |
| Twilio Phone Number | Your Twilio phone number |

**How to get:**
1. Sign up at [Twilio](https://www.twilio.com)
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. Get your Twilio phone number

---

### ☁️ Storage (Cloudflare R2)

| Field | Description |
|-------|-------------|
| Cloudflare Account ID | Your Cloudflare account ID |
| Cloudflare Access Key ID | R2 API token access key |
| Cloudflare Secret Access Key | R2 API token secret |
| Cloudflare Bucket Name | Your R2 bucket name |

**Setup steps:**
1. Create R2 API Token in Cloudflare
2. Store credentials securely
3. Enter in the form

---

### 🤖 AI Service (OpenRouter)

| Field | Description |
|-------|-------------|
| OpenRouter API Key | Your API key from OpenRouter |
| OpenRouter Model | Model to use (e.g., `openai/gpt-3.5-turbo`) |

**Get API Key:**
1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up and go to Keys section
3. Create new API key

---

### ⚙️ App Configuration

| Field | Description | Default |
|-------|-------------|---------|
| App Name | Your application name | `Smart Library` |
| Node Environment | Environment mode | `development` |
| App URL | Frontend app URL | `http://localhost:3000` |
| API URL | Backend API URL | `http://localhost:5000` |
| JWT Secret | Secret for JWT signing | Auto-generated |
| Debug Mode | Enable debug logging | `false` |
| Trace Mode | Enable trace logging | `false` |

---

## 📤 Using the Generator

### Method 1: Copy to Clipboard

1. Fill all credentials in the form
2. Scroll to "Generate & Export .env Files" section
3. Click **"📋 Copy"** button next to the desired file
4. A confirmation message will appear: "✅ Copied!"
5. Paste content into your `.env` file using `Ctrl+V` or `Cmd+V`

### Method 2: Download Files

1. Fill all credentials in the form
2. Click **"⬇️ Download"** button
3. Files will be downloaded as:
   - `.env.backend`
   - `.env.admin`
   - `.env.mobile`
4. Rename to `.env` and place in respective folders

### Method 3: Preview First

1. Before copying/downloading, click **"👁️ Preview"** to see the generated content
2. Review for accuracy
3. Click **"📋 Copy"** or **"⬇️ Download"** to export

---

## 🗂️ File Placement

After generating the .env files, place them in the correct locations:

```
smart-library-system/
├── backend/
│   ├── .env          ← Place backend .env here
│   ├── package.json
│   └── src/
├── admin/
│   ├── .env          ← Place admin .env here
│   ├── package.json
│   └── src/
└── mobile/
    ├── .env          ← Place mobile .env here
    ├── package.json
    └── src/
```

---

## 🔐 Security Best Practices

### ⚠️ Important Guidelines

1. **Never Commit .env Files**
   ```bash
   # Add to .gitignore in each folder
   .env
   .env.local
   .env.*.local
   ```

2. **Keep Credentials Secure**
   - Don't share .env content in emails or chat
   - Don't take screenshots containing credentials
   - Restrict access to the admin panel

3. **Use Different Credentials for Environments**
   - Development: Test/sandbox API keys
   - Staging: Staging API keys
   - Production: Production API keys only

4. **Rotate Credentials Regularly**
   - Change API keys every 3-6 months
   - Immediately change if compromised
   - Use strong, unique secrets

5. **Lock Down Admin Panel**
   - Use strong authentication
   - Enable 2FA if available
   - Restrict IP access if possible

---

## 🛠️ Troubleshooting

### Issue: Copy Button Not Working

**Solution:**
- Ensure you're using HTTPS (required for clipboard API)
- Check browser permissions for clipboard access
- Try the Download option instead

### Issue: Missing Fields in Generated Files

**Solution:**
- Ensure all required fields are filled
- Fields marked with * are mandatory
- Check for empty credentials

### Issue: JWT Secret Not Generating

**Solution:**
1. Click the "🔄 Generate" button again
2. If still not working, manually enter a strong secret (64+ characters)
3. Can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Issue: One or More Services Not Initializing

**Solution:**
- Verify API credentials are correct
- Check service status pages
- Test credentials with vendor's documentation
- Review backend logs for specific errors

---

## 📋 Environment Variables Reference

### Backend .env Sections

```env
# Server & App
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...

# Auth
JWT_SECRET=...
JWT_EXPIRE=7d

# Payments
BKASH_API_KEY=...
NAGAD_API_KEY=...

# Communication
SMTP_HOST=...
TWILIO_ACCOUNT_SID=...

# Storage
CLOUDFLARE_ACCOUNT_ID=...

# AI
OPENROUTER_API_KEY=...

# Logging
DEBUG=false
TRACE=false
```

### Admin .env Sections

```env
# React App
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG_MODE=false

# Services
REACT_APP_BKASH_ENABLED=true
REACT_APP_PAYMENT_TIMEOUT=30000
```

### Mobile .env Sections

```env
# App
APP_NAME=Smart Library
ENV=development
API_URL=http://localhost:5000

# Database
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# Features
ENABLE_BIOMETRIC=true
ENABLE_OFFLINE_MODE=true
```

---

## 🔄 Updating Credentials

To update credentials later:

1. Access the Environment Generator again
2. Update the changed credentials
3. Re-generate and download the affected .env files
4. Replace the old files
5. Restart the respective services

---

## 📊 Verification Checklist

After setting up .env files:

✅ Backend starts without errors: `npm start` from backend folder
✅ Admin panel loads: `npm start` from admin folder
✅ Mobile app connects: `npm start` from mobile folder
✅ Database connection works: Check Supabase logs
✅ Payment services available: Test with sandbox credentials
✅ Email service working: Send test email
✅ SMS service working: Send test SMS
✅ Storage service working: Upload test file
✅ AI service working: Test chat endpoint

---

## 🚀 Next Steps

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Admin Setup**
   ```bash
   cd admin
   npm install
   npm start
   ```

3. **Mobile Setup**
   ```bash
   cd mobile
   npm install
   npm start
   ```

4. **Verify Services**
   - Test each service
   - Check logs for errors
   - Monitor connections

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the built-in instructions in the generator
3. Check service documentation
4. Review application logs
5. Contact development team

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [bKash Developer](https://developer.bkash.com)
- [Nagad Integration](https://developer.nagad.com.bd)
- [Twilio SMS](https://www.twilio.com/docs)
- [Cloudflare R2](https://developers.cloudflare.com/r2)
- [OpenRouter API](https://openrouter.ai/docs)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial release |

---

**Last Updated**: December 2024
**Maintained By**: Development Team
