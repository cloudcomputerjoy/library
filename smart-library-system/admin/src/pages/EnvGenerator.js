import React, { useState, useRef } from 'react';
import './EnvGenerator.css';

/**
 * Environment Credentials Generator
 * Generates .env files for backend, admin, and mobile folders
 */

const EnvGenerator = () => {
  const [credentials, setCredentials] = useState({
    // Database
    supabaseUrl: '',
    supabaseKey: '',
    supabaseServiceKey: '',

    // Payment Services
    bkashApiKey: '',
    bkashSecret: '',
    bkashMode: 'sandbox',
    nagadApiKey: '',
    nagadSecret: '',
    nagadMode: 'sandbox',

    // Email Service
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: 'noreply@library.com',

    // SMS Service
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',

    // Storage Service
    cloudflareAccountId: '',
    cloudflareAccessKeyId: '',
    cloudflareSecretAccessKey: '',
    cloudflareBucketName: '',

    // AI Service
    openrouterApiKey: '',
    openrouterModel: 'openai/gpt-3.5-turbo',

    // App Configuration
    appName: 'Smart Library',
    appUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5000',
    nodeEnv: 'development',
    jwtSecret: '',

    // Logging
    debugMode: 'false',
    traceMode: 'false',
    logRequestBody: 'false',
    logResponseBody: 'false',
  });

  const [copiedFile, setCopiedFile] = useState(null);
  const [showPreview, setShowPreview] = useState({
    backend: false,
    admin: false,
    mobile: false,
  });

  const fileRefs = {
    backend: useRef(null),
    admin: useRef(null),
    mobile: useRef(null),
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Generate Backend .env
  const generateBackendEnv = () => {
    return `# Backend Environment Configuration
# Generated on: ${new Date().toISOString()}

# Node Environment
NODE_ENV=${credentials.nodeEnv}
DEBUG=${credentials.debugMode}
TRACE=${credentials.traceMode}
LOG_REQUEST_BODY=${credentials.logRequestBody}
LOG_RESPONSE_BODY=${credentials.logResponseBody}

# Server Configuration
PORT=5000
API_URL=${credentials.apiUrl}
APP_NAME=${credentials.appName}

# Database
SUPABASE_URL=${credentials.supabaseUrl}
SUPABASE_KEY=${credentials.supabaseKey}
SUPABASE_SERVICE_KEY=${credentials.supabaseServiceKey}

# JWT
JWT_SECRET=${credentials.jwtSecret}
JWT_EXPIRE=7d

# Payment Gateway - bKash
BKASH_API_KEY=${credentials.bkashApiKey}
BKASH_API_SECRET=${credentials.bkashSecret}
BKASH_MODE=${credentials.bkashMode}
BKASH_USERNAME=${credentials.bkashApiKey}
BKASH_PASSWORD=${credentials.bkashSecret}

# Payment Gateway - Nagad
NAGAD_API_KEY=${credentials.nagadApiKey}
NAGAD_API_SECRET=${credentials.nagadSecret}
NAGAD_MODE=${credentials.nagadMode}

# Email Service (SMTP)
SMTP_ENABLED=true
SMTP_HOST=${credentials.smtpHost}
SMTP_PORT=${credentials.smtpPort}
SMTP_USER=${credentials.smtpUser}
SMTP_PASSWORD=${credentials.smtpPassword}
SMTP_FROM=${credentials.smtpFrom}
SMTP_SECURE=true

# SMS Service (Twilio)
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=${credentials.twilioAccountSid}
TWILIO_AUTH_TOKEN=${credentials.twilioAuthToken}
TWILIO_PHONE_NUMBER=${credentials.twilioPhoneNumber}

# Storage Service (Cloudflare R2)
CLOUDFLARE_ENABLED=true
CLOUDFLARE_ACCOUNT_ID=${credentials.cloudflareAccountId}
CLOUDFLARE_ACCESS_KEY_ID=${credentials.cloudflareAccessKeyId}
CLOUDFLARE_SECRET_ACCESS_KEY=${credentials.cloudflareSecretAccessKey}
CLOUDFLARE_BUCKET_NAME=${credentials.cloudflareBucketName}
CLOUDFLARE_PUBLIC_URL=https://${credentials.cloudflareBucketName}.cdnjs.dev

# AI Service (OpenRouter)
OPENROUTER_ENABLED=true
OPENROUTER_API_KEY=${credentials.openrouterApiKey}
OPENROUTER_MODEL=${credentials.openrouterModel}

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Service
LOG_FORMAT=json
LOG_LEVEL=info
`;
  };

  // Generate Admin .env
  const generateAdminEnv = () => {
    return `# Admin Panel Environment Configuration
# Generated on: ${new Date().toISOString()}

# React App Configuration
REACT_APP_NAME=${credentials.appName}
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=${credentials.nodeEnv}

# API Configuration
REACT_APP_API_URL=${credentials.apiUrl}
REACT_APP_API_TIMEOUT=30000

# Database (Supabase)
REACT_APP_SUPABASE_URL=${credentials.supabaseUrl}
REACT_APP_SUPABASE_ANON_KEY=${credentials.supabaseKey}

# Authentication
REACT_APP_JWT_STORAGE_KEY=auth_token
REACT_APP_AUTH_TOKEN_EXPIRY=7d

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
REACT_APP_ENABLE_DEBUG_MODE=${credentials.debugMode}

# Logging
REACT_APP_LOG_LEVEL=info
REACT_APP_LOG_REQUESTS=${credentials.logRequestBody}
REACT_APP_LOG_RESPONSES=${credentials.logResponseBody}

# Storage
REACT_APP_CLOUDFLARE_DOMAIN=https://${credentials.cloudflareBucketName}.cdnjs.dev

# Payment Integration
REACT_APP_BKASH_ENABLED=true
REACT_APP_NAGAD_ENABLED=true
REACT_APP_PAYMENT_TIMEOUT=30000

# Email Configuration
REACT_APP_SMTP_ENABLED=true

# SMS Configuration
REACT_APP_SMS_ENABLED=true

# AI Configuration
REACT_APP_AI_ENABLED=true
REACT_APP_AI_MODEL=${credentials.openrouterModel}

# UI Configuration
REACT_APP_THEME_COLOR=#1976d2
REACT_APP_ITEMS_PER_PAGE=10
REACT_APP_ENABLE_DARK_MODE=false

# Cache Configuration
REACT_APP_CACHE_TIMEOUT=3600000
REACT_APP_CACHE_ENABLED=true
`;
  };

  // Generate Mobile .env
  const generateMobileEnv = () => {
    return `# Mobile App Environment Configuration
# Generated on: ${new Date().toISOString()}

# App Configuration
APP_NAME=${credentials.appName}
APP_VERSION=1.0.0
ENV=${credentials.nodeEnv}

# API Configuration
API_URL=${credentials.apiUrl}
API_TIMEOUT=30000
REQUEST_TIMEOUT=10000

# Database (Supabase)
SUPABASE_URL=${credentials.supabaseUrl}
SUPABASE_ANON_KEY=${credentials.supabaseKey}
SUPABASE_SERVICE_KEY=${credentials.supabaseServiceKey}

# Authentication
JWT_STORAGE_KEY=mobile_auth_token
AUTH_TOKEN_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# Features
ENABLE_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
ENABLE_BIOMETRIC=true
ENABLE_DEBUG_MODE=${credentials.debugMode}

# Logging
LOG_LEVEL=info
ENABLE_CRASH_REPORTING=true
ENABLE_ANALYTICS=true

# Storage
CLOUDFLARE_DOMAIN=https://${credentials.cloudflareBucketName}.cdnjs.dev
LOCAL_STORAGE_PATH=./app_data

# Payment Integration
BKASH_ENABLED=true
NAGAD_ENABLED=true
PAYMENT_TIMEOUT=30000

# SMS Configuration
SMS_ENABLED=true

# Email Configuration
EMAIL_ENABLED=true

# AI Configuration
AI_ENABLED=true
AI_MODEL=${credentials.openrouterModel}

# Push Notifications
PUSH_NOTIF_ENABLED=true
FCM_ENABLED=true

# Camera/Photo Library
CAMERA_PERMISSION_REQUIRED=true
PHOTO_LIBRARY_REQUIRED=true

# Location Services
LOCATION_ENABLED=true
LOCATION_PERMISSION_REQUIRED=false

# UI Configuration
THEME_COLOR=#1976d2
ENABLE_DARK_MODE=true
ITEMS_PER_PAGE=15

# Cache Configuration
CACHE_TIMEOUT=3600000
LOCAL_CACHE_ENABLED=true
`;
  };

  // Copy to clipboard
  const copyToClipboard = (content, fileName) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    });
  };

  // Download file
  const downloadFile = (content, fileName) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Reset form
  const resetForm = () => {
    if (window.confirm('Are you sure you want to clear all credentials?')) {
      setCredentials({
        supabaseUrl: '',
        supabaseKey: '',
        supabaseServiceKey: '',
        bkashApiKey: '',
        bkashSecret: '',
        bkashMode: 'sandbox',
        nagadApiKey: '',
        nagadSecret: '',
        nagadMode: 'sandbox',
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
        smtpFrom: 'noreply@library.com',
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioPhoneNumber: '',
        cloudflareAccountId: '',
        cloudflareAccessKeyId: '',
        cloudflareSecretAccessKey: '',
        cloudflareBucketName: '',
        openrouterApiKey: '',
        openrouterModel: 'openai/gpt-3.5-turbo',
        appName: 'Smart Library',
        appUrl: 'http://localhost:3000',
        apiUrl: 'http://localhost:5000',
        nodeEnv: 'development',
        jwtSecret: '',
        debugMode: 'false',
        traceMode: 'false',
        logRequestBody: 'false',
        logResponseBody: 'false',
      });
      setShowPreview({ backend: false, admin: false, mobile: false });
    }
  };

  // Generate random JWT secret
  const generateJWTSecret = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredentials((prev) => ({
      ...prev,
      jwtSecret: result,
    }));
  };

  const backendEnv = generateBackendEnv();
  const adminEnv = generateAdminEnv();
  const mobileEnv = generateMobileEnv();

  return (
    <div className="env-generator">
      <div className="env-header">
        <h1>🔐 Environment Variables Generator</h1>
        <p>Generate .env files for backend, admin, and mobile folders</p>
      </div>

      <div className="env-container">
        {/* Credentials Form */}
        <section className="env-section form-section">
          <h2>📝 Enter Credentials</h2>

          <div className="form-grid">
            {/* Database Credentials */}
            <fieldset className="credential-group">
              <legend>🗄️ Database (Supabase)</legend>

              <div className="form-group">
                <label>Supabase URL *</label>
                <input
                  type="text"
                  name="supabaseUrl"
                  value={credentials.supabaseUrl}
                  onChange={handleChange}
                  placeholder="https://xxxx.supabase.co"
                />
              </div>

              <div className="form-group">
                <label>Supabase Anon Key *</label>
                <input
                  type="password"
                  name="supabaseKey"
                  value={credentials.supabaseKey}
                  onChange={handleChange}
                  placeholder="Your supabase anon key"
                />
              </div>

              <div className="form-group">
                <label>Supabase Service Key *</label>
                <input
                  type="password"
                  name="supabaseServiceKey"
                  value={credentials.supabaseServiceKey}
                  onChange={handleChange}
                  placeholder="Your supabase service key"
                />
              </div>
            </fieldset>

            {/* Payment Credentials */}
            <fieldset className="credential-group">
              <legend>💳 Payment Gateways</legend>

              <div className="form-row">
                <div className="form-group">
                  <label>bKash API Key *</label>
                  <input
                    type="password"
                    name="bkashApiKey"
                    value={credentials.bkashApiKey}
                    onChange={handleChange}
                    placeholder="Your bKash API key"
                  />
                </div>
                <div className="form-group">
                  <label>bKash Secret *</label>
                  <input
                    type="password"
                    name="bkashSecret"
                    value={credentials.bkashSecret}
                    onChange={handleChange}
                    placeholder="Your bKash secret"
                  />
                </div>
                <div className="form-group">
                  <label>bKash Mode</label>
                  <select
                    name="bkashMode"
                    value={credentials.bkashMode}
                    onChange={handleChange}
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nagad API Key *</label>
                  <input
                    type="password"
                    name="nagadApiKey"
                    value={credentials.nagadApiKey}
                    onChange={handleChange}
                    placeholder="Your Nagad API key"
                  />
                </div>
                <div className="form-group">
                  <label>Nagad Secret *</label>
                  <input
                    type="password"
                    name="nagadSecret"
                    value={credentials.nagadSecret}
                    onChange={handleChange}
                    placeholder="Your Nagad secret"
                  />
                </div>
                <div className="form-group">
                  <label>Nagad Mode</label>
                  <select
                    name="nagadMode"
                    value={credentials.nagadMode}
                    onChange={handleChange}
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Email Configuration */}
            <fieldset className="credential-group">
              <legend>📧 Email Service (SMTP)</legend>

              <div className="form-row">
                <div className="form-group">
                  <label>SMTP Host *</label>
                  <input
                    type="text"
                    name="smtpHost"
                    value={credentials.smtpHost}
                    onChange={handleChange}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>SMTP Port</label>
                  <input
                    type="number"
                    name="smtpPort"
                    value={credentials.smtpPort}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>SMTP User *</label>
                  <input
                    type="email"
                    name="smtpUser"
                    value={credentials.smtpUser}
                    onChange={handleChange}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>SMTP Password *</label>
                  <input
                    type="password"
                    name="smtpPassword"
                    value={credentials.smtpPassword}
                    onChange={handleChange}
                    placeholder="Your app password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>From Email Address</label>
                <input
                  type="email"
                  name="smtpFrom"
                  value={credentials.smtpFrom}
                  onChange={handleChange}
                  placeholder="noreply@library.com"
                />
              </div>
            </fieldset>

            {/* SMS Configuration */}
            <fieldset className="credential-group">
              <legend>📱 SMS Service (Twilio)</legend>

              <div className="form-group">
                <label>Twilio Account SID *</label>
                <input
                  type="password"
                  name="twilioAccountSid"
                  value={credentials.twilioAccountSid}
                  onChange={handleChange}
                  placeholder="Your Twilio Account SID"
                />
              </div>

              <div className="form-group">
                <label>Twilio Auth Token *</label>
                <input
                  type="password"
                  name="twilioAuthToken"
                  value={credentials.twilioAuthToken}
                  onChange={handleChange}
                  placeholder="Your Twilio Auth Token"
                />
              </div>

              <div className="form-group">
                <label>Twilio Phone Number *</label>
                <input
                  type="tel"
                  name="twilioPhoneNumber"
                  value={credentials.twilioPhoneNumber}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>
            </fieldset>

            {/* Storage Configuration */}
            <fieldset className="credential-group">
              <legend>☁️ Storage Service (Cloudflare R2)</legend>

              <div className="form-group">
                <label>Cloudflare Account ID *</label>
                <input
                  type="text"
                  name="cloudflareAccountId"
                  value={credentials.cloudflareAccountId}
                  onChange={handleChange}
                  placeholder="Your Cloudflare Account ID"
                />
              </div>

              <div className="form-group">
                <label>Cloudflare Access Key ID *</label>
                <input
                  type="password"
                  name="cloudflareAccessKeyId"
                  value={credentials.cloudflareAccessKeyId}
                  onChange={handleChange}
                  placeholder="Your Access Key ID"
                />
              </div>

              <div className="form-group">
                <label>Cloudflare Secret Access Key *</label>
                <input
                  type="password"
                  name="cloudflareSecretAccessKey"
                  value={credentials.cloudflareSecretAccessKey}
                  onChange={handleChange}
                  placeholder="Your Secret Access Key"
                />
              </div>

              <div className="form-group">
                <label>Cloudflare Bucket Name *</label>
                <input
                  type="text"
                  name="cloudflareBucketName"
                  value={credentials.cloudflareBucketName}
                  onChange={handleChange}
                  placeholder="your-bucket-name"
                />
              </div>
            </fieldset>

            {/* AI Configuration */}
            <fieldset className="credential-group">
              <legend>🤖 AI Service (OpenRouter)</legend>

              <div className="form-group">
                <label>OpenRouter API Key *</label>
                <input
                  type="password"
                  name="openrouterApiKey"
                  value={credentials.openrouterApiKey}
                  onChange={handleChange}
                  placeholder="Your OpenRouter API Key"
                />
              </div>

              <div className="form-group">
                <label>OpenRouter Model</label>
                <input
                  type="text"
                  name="openrouterModel"
                  value={credentials.openrouterModel}
                  onChange={handleChange}
                  placeholder="openai/gpt-3.5-turbo"
                />
              </div>
            </fieldset>

            {/* App Configuration */}
            <fieldset className="credential-group">
              <legend>⚙️ App Configuration</legend>

              <div className="form-row">
                <div className="form-group">
                  <label>App Name</label>
                  <input
                    type="text"
                    name="appName"
                    value={credentials.appName}
                    onChange={handleChange}
                    placeholder="Smart Library"
                  />
                </div>
                <div className="form-group">
                  <label>Node Environment</label>
                  <select
                    name="nodeEnv"
                    value={credentials.nodeEnv}
                    onChange={handleChange}
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>App URL</label>
                  <input
                    type="url"
                    name="appUrl"
                    value={credentials.appUrl}
                    onChange={handleChange}
                    placeholder="http://localhost:3000"
                  />
                </div>
                <div className="form-group">
                  <label>API URL</label>
                  <input
                    type="url"
                    name="apiUrl"
                    value={credentials.apiUrl}
                    onChange={handleChange}
                    placeholder="http://localhost:5000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>JWT Secret *</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    name="jwtSecret"
                    value={credentials.jwtSecret}
                    onChange={handleChange}
                    placeholder="Click Generate or enter your secret"
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={generateJWTSecret}
                  >
                    🔄 Generate
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Debug Mode</label>
                  <select
                    name="debugMode"
                    value={credentials.debugMode}
                    onChange={handleChange}
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trace Mode</label>
                  <select
                    name="traceMode"
                    value={credentials.traceMode}
                    onChange={handleChange}
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="form-actions">
            <button onClick={resetForm} className="btn-danger">
              🗑️ Clear All
            </button>
          </div>
        </section>

        {/* Generated Files Preview and Export */}
        <section className="env-section export-section">
          <h2>📤 Generate & Export .env Files</h2>

          {/* Backend .env */}
          <div className="env-file">
            <div className="env-header-line">
              <h3>🖥️ Backend .env</h3>
              <div className="env-buttons">
                <button
                  onClick={() =>
                    copyToClipboard(backendEnv, 'backend')
                  }
                  className="btn-copy"
                  title="Copy to clipboard"
                >
                  {copiedFile === 'backend' ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() =>
                    downloadFile(backendEnv, '.env.backend')
                  }
                  className="btn-download"
                  title="Download file"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() =>
                    setShowPreview((prev) => ({
                      ...prev,
                      backend: !prev.backend,
                    }))
                  }
                  className="btn-preview"
                >
                  {showPreview.backend ? '👁️ Hide' : '👁️ Preview'}
                </button>
              </div>
            </div>

            {showPreview.backend && (
              <pre className="env-preview">{backendEnv}</pre>
            )}
          </div>

          {/* Admin .env */}
          <div className="env-file">
            <div className="env-header-line">
              <h3>👨‍💼 Admin Panel .env</h3>
              <div className="env-buttons">
                <button
                  onClick={() =>
                    copyToClipboard(adminEnv, 'admin')
                  }
                  className="btn-copy"
                  title="Copy to clipboard"
                >
                  {copiedFile === 'admin' ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() =>
                    downloadFile(adminEnv, '.env.admin')
                  }
                  className="btn-download"
                  title="Download file"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() =>
                    setShowPreview((prev) => ({
                      ...prev,
                      admin: !prev.admin,
                    }))
                  }
                  className="btn-preview"
                >
                  {showPreview.admin ? '👁️ Hide' : '👁️ Preview'}
                </button>
              </div>
            </div>

            {showPreview.admin && (
              <pre className="env-preview">{adminEnv}</pre>
            )}
          </div>

          {/* Mobile .env */}
          <div className="env-file">
            <div className="env-header-line">
              <h3>📱 Mobile App .env</h3>
              <div className="env-buttons">
                <button
                  onClick={() =>
                    copyToClipboard(mobileEnv, 'mobile')
                  }
                  className="btn-copy"
                  title="Copy to clipboard"
                >
                  {copiedFile === 'mobile' ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() =>
                    downloadFile(mobileEnv, '.env.mobile')
                  }
                  className="btn-download"
                  title="Download file"
                >
                  ⬇️ Download
                </button>
                <button
                  onClick={() =>
                    setShowPreview((prev) => ({
                      ...prev,
                      mobile: !prev.mobile,
                    }))
                  }
                  className="btn-preview"
                >
                  {showPreview.mobile ? '👁️ Hide' : '👁️ Preview'}
                </button>
              </div>
            </div>

            {showPreview.mobile && (
              <pre className="env-preview">{mobileEnv}</pre>
            )}
          </div>
        </section>

        {/* Instructions */}
        <section className="env-section instructions-section">
          <h2>📖 Instructions</h2>

          <div className="instructions">
            <div className="instruction-item">
              <h4>1. Fill in All Credentials</h4>
              <p>
                Enter all your API keys, secrets, and configuration values in
                the form above.
              </p>
            </div>

            <div className="instruction-item">
              <h4>2. Copy or Download</h4>
              <p>
                For each .env file, you can either copy the content to your
                clipboard or download the file directly.
              </p>
            </div>

            <div className="instruction-item">
              <h4>3. Place Files in Folders</h4>
              <ul>
                <li>
                  Backend: <code class="code-snippet">smart-library-system/backend/.env</code>
                </li>
                <li>
                  Admin: <code class="code-snippet">smart-library-system/admin/.env</code>
                </li>
                <li>
                  Mobile:{' '}
                  <code class="code-snippet">smart-library-system/mobile/.env</code>
                </li>
              </ul>
            </div>

            <div className="instruction-item">
              <h4>4. Install Dependencies</h4>
              <p>Run npm install in each folder to install dependencies.</p>
            </div>

            <div className="instruction-item">
              <h4>5. Start Services</h4>
              <p>Run the development server using npm start in each folder.</p>
            </div>

            <div className="highlight-box">
              <strong>⚠️ Security Note:</strong>
              <p>
                Never commit .env files to version control. Add .env to your
                .gitignore file. The credentials on this page are sensitive and
                should be kept secure.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EnvGenerator;
