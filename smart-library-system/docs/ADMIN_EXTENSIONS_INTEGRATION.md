# Admin Panel Extensions - Integration Guide

This guide explains how to integrate the new **Credential Management** and **Environment File Generator** components into your admin panel.

## Components Overview

### 1. Credential Management Component
**Location:** `admin/src/components/CredentialManagement.jsx` and `.css`

**Purpose:** 
- Manage multiple email credentials (Gmail SMTP) with auto-failover
- Manage multiple API keys (OpenRouter) with intelligent switching
- View health status and statistics for all credentials
- Test individual credentials without affecting production

**Features:**
- Tab-based UI for Email Credentials and API Keys
- Add/Remove/Enable/Disable credentials
- Test functionality for individual credentials
- Health check mechanisms
- Real-time statistics (total, enabled, current index)
- Automatic retry on failure
- Database-backed persistent storage

### 2. Environment File Generator Component
**Location:** `admin/src/components/EnvFileGenerator.jsx` and `.css`

**Purpose:**
- Create and export `.env` files for Backend, Admin, and Mobile folders
- Manage multiple environment variables
- Save/Load templates for quick setup
- Import/Export configurations as JSON backup

**Features:**
- Multi-folder support (Backend, Admin, Mobile)
- Quick templates for common variables per folder
- Save templates for reuse
- Import/Export as JSON
- Copy to clipboard functionality
- Download individual or all .env files

---

## Integration Steps

### Step 1: Add Imports to Admin App

Update `admin/src/App.js`:

```jsx
import CredentialManagement from './components/CredentialManagement';
import EnvFileGenerator from './components/EnvFileGenerator';

function App() {
  // ... existing code
}
```

### Step 2: Create New Routes or Menu Items

Add menu items to your admin navigation sidebar:

```jsx
// In your admin sidebar/navigation component
const menuItems = [
  // ... existing menu items
  {
    label: 'Credentials',
    path: '/admin/credentials',
    icon: '🔑',
    component: CredentialManagement
  },
  {
    label: 'Environment Setup',
    path: '/admin/env-generator',
    icon: '⚙️',
    component: EnvFileGenerator
  }
];
```

### Step 3: Add Routes

Update your routing logic (if using React Router):

```jsx
// In App.js or your routing file
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  {/* ... existing routes */}
  <Route path="/admin/credentials" element={<CredentialManagement />} />
  <Route path="/admin/env-generator" element={<EnvFileGenerator />} />
</Routes>
```

### Step 4: Verify Backend API Integration

Ensure your backend (`backend/server.js`) has:

```javascript
// 1. Import credential management routes
const credentialRoutes = require('./src/routes/credentialManagementRoutes');

// 2. Initialize rotators on startup
const emailRotator = require('./src/services/emailCredentialRotator');
const apiKeyRotator = require('./src/services/apiKeyRotator');

// Initialize on server start
async function initializeRotators() {
  try {
    await emailRotator.loadCredentials();
    await emailRotator.healthCheck();
    console.log('Email credential rotator initialized');
    
    await apiKeyRotator.loadAPIKeys();
    await apiKeyRotator.healthCheck();
    console.log('API key rotator initialized');
  } catch (error) {
    console.error('Error initializing rotators:', error);
  }
}

// Call on server start
initializeRotators();

// 3. Mount credential routes
app.use('/api/credentials', credentialRoutes);

// 4. Run periodic health checks
setInterval(async () => {
  await emailRotator.healthCheck();
  await apiKeyRotator.healthCheck();
}, 60 * 60 * 1000); // Every hour
```

### Step 5: Run Database Migrations

Execute the database migration to create tables:

```javascript
// From backend directory
const migration = require('./src/migrations/create_credential_tables.sql.js');
migration.up(); // or use your migration runner
```

Or directly execute the SQL:

```sql
-- Execute this in your Supabase SQL editor
-- See backend/src/migrations/create_credential_tables.sql.js for full schema
```

---

## Usage Guide

### Using Credential Management

#### Adding Email Credentials:

1. Navigate to **Credentials** tab
2. Click **+ Add Email Credential**
3. Fill in:
   - Email: `your-email@gmail.com`
   - Password: App-specific password (not regular password)
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Use TLS: Check

4. Click **Add**
5. System automatically tests the credential

#### Adding API Keys:

1. Click **+ Add API Key** in API Keys section
2. Fill in:
   - Service: `openrouter`
   - API Key: Your OpenRouter API key
   - Priority: `1` (lower number = higher priority)

3. Click **Add**
4. System validates and enables the key

#### Testing Credentials:

1. Click **Test** on any credential
2. View real-time results
3. Refine configuration if needed

#### Health Check:

1. Click **Health Check** in actions
2. System verifies all credentials
3. Automatically disables problematic ones
4. View results in real-time

### Using Environment File Generator

#### Quick Setup:

1. Navigate to **Environment Setup**
2. Select folder: **Backend**, **Admin**, or **Mobile**
3. Click **Insert Template**
4. Fill in your actual values
5. Click **Copy to Clipboard** or **Download**

#### Save Template:

1. Configure variables for a specific setup
2. Click **Save as Template**
3. Enter template name (e.g., "Production Setup")
4. Click **Save**
5. Reuse later by clicking **Load**

#### Export All:

1. Go through each folder (Backend, Admin, Mobile)
2. Configure variables
3. Click **Download All 3 Folders**
4. Generates .env files for all sections

#### Import/Export Backup:

1. Click **Export as JSON** to backup all settings
2. Click **Import JSON** to restore from backup
3. Useful for disaster recovery

---

## API Endpoints Reference

### Email Credentials Endpoints

```
GET  /api/credentials/email              - List all email credentials
POST /api/credentials/email              - Add new email credential
PUT  /api/credentials/email/:id          - Update email credential
DELETE /api/credentials/email/:id        - Delete email credential
POST /api/credentials/email/:id/test     - Test email credential
POST /api/credentials/email/health-check - Run health check on all
```

### API Keys Endpoints

```
GET  /api/credentials/apikeys            - List all API keys
POST /api/credentials/apikeys            - Add new API key
PUT  /api/credentials/apikeys/:id        - Update API key
DELETE /api/credentials/apikeys/:id      - Delete API key
POST /api/credentials/apikeys/:id/test   - Test API key
POST /api/credentials/apikeys/health-check - Run health check on all
```

---

## How Auto-Failover Works

### Email Credential Rotation

```
User requests email send
       ↓
Select current healthy credential
       ↓
Attempt to send with SMTP
       ↓
Success? → Log result → Return
       ↓
Failure? → Mark unhealthy → Move to next credential
       ↓
Retry available? → Go back to step 2
       ↓
No healthy credentials? → Return error
```

### API Key Rotation

```
User makes API request
       ↓
Select current healthy key
       ↓
Inject Bearer token from key
       ↓
Make HTTP request
       ↓
Success (200-299)? → Update stats → Return result
       ↓
429 (Rate Limited)? → Switch to next key → Retry
       ↓
401 (Invalid Key)? → Disable key → Try next
       ↓
Other error? → Mark unhealthy → Try next
       ↓
All keys exhausted? → Return error with details
```

---

## Database Schema

### email_credentials Table
```sql
{
  id: uuid,
  email: string,
  password: string (encrypted),
  smtp_host: string,
  smtp_port: number,
  use_tls: boolean,
  enabled: boolean,
  priority: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

### email_logs Table
```sql
{
  id: uuid,
  credential_id: uuid (foreign key),
  recipient: string,
  status: 'sent' | 'failed',
  error: string,
  created_at: timestamp
}
```

### api_keys Table
```sql
{
  id: uuid,
  service: string ('openrouter'),
  api_key: string (encrypted),
  enabled: boolean,
  priority: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

### api_request_logs Table
```sql
{
  id: uuid,
  api_key_id: uuid (foreign key),
  endpoint: string,
  status_code: number,
  response_time_ms: number,
  error: string,
  created_at: timestamp
}
```

---

## Error Handling

### Common Errors & Solutions

#### Email Credential Fails

**Error:** "SMTP 535: Authentication failed"
- **Solution:** Use Gmail App Password, not regular password
- **Action:** Generate new app password in Google Account settings

**Error:** "Connection refused on port 587"
- **Solution:** Check firewall/network settings
- **Action:** System auto-disables after 5 failed attempts

#### API Key Fails

**Error:** "401 Unauthorized"
- **Solution:** Check API key is valid and not expired
- **Action:** System auto-disables immediately

**Error:** "429 Too Many Requests"
- **Solution:** Rate limit reached
- **Action:** System auto-rotates to next key without disabling

---

## Monitoring & Debugging

### Check Credential Status

```javascript
// From backend code
const rotator = require('./src/services/emailCredentialRotator');
const status = await rotator.getStatus();
console.log(status);
// Output:
// {
//   totalCredentials: 3,
//   enabledCredentials: 2,
//   currentIndex: 1,
//   currentCredential: { email: "...", enabled: true },
//   allCredentials: [...]
// }
```

### View Health Check Results

Through UI:
1. Go to Credentials tab
2. Click **Health Check** in Actions
3. View results for each credential

### Query Logs

```javascript
// From your database or backend
const { data } = await supabase
  .from('email_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

---

## Best Practices

1. **Always Test Before Production**
   - Use "Test" button before enabling credentials
   - Verify health checks pass regularly

2. **Rotate Credentials Regularly**
   - Change Gmail app passwords monthly
   - Rotate API keys quarterly
   - Keep audit logs for compliance

3. **Monitor Failures**
   - Set up alerts for disabled credentials
   - Review error logs daily
   - Have backup credentials ready

4. **Secure Credentials**
   - Never commit credentials to git
   - Use environment variables
   - Rotate on suspected compromise

5. **Plan for Scale**
   - Test with multiple credentials
   - Monitor performance impact
   - Consider separate pools per service

---

## Troubleshooting

### Components Not Appearing

**Check:**
1. CSS files imported correctly
2. Components imported in App.js
3. Routes configured properly
4. No console errors

**Solution:**
```jsx
// Verify import path is correct
import CredentialManagement from './components/CredentialManagement';
import EnvFileGenerator from './components/EnvFileGenerator';
```

### API Calls Failing

**Check:**
1. Backend running on correct port
2. CORS configured correctly
3. Authentication token valid
4. Routes mounted in server.js

**Solution:**
```javascript
// Ensure routes mounted
const credentialRoutes = require('./src/routes/credentialManagementRoutes');
app.use('/api/credentials', credentialRoutes);
```

### Credentials Not Saving

**Check:**
1. Database connection working
2. Tables created via migration
3. RLS policies not blocking
4. User has admin role

**Solution:**
```javascript
// Run migration
const migration = require('./src/migrations/create_credential_tables.sql.js');
await migration.up();
```

---

## Next Steps

1. **Integration:** Add components to admin panel
2. **Testing:** Test credential management features
3. **Deployment:** Deploy to production
4. **Monitoring:** Set up alerts and logs
5. **Optimization:** Monitor performance and adjust

For more details on implementation specifics, see:
- `CREDENTIAL_ROTATION_INTEGRATION.js` - Integration guide
- `emailCredentialRotator.js` - Email rotation service
- `apiKeyRotator.js` - API key rotation service
- `credentialManagementController.js` - API endpoints
