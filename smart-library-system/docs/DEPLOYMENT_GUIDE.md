# 🚀 Smart Library System - Complete Deployment Guide

## 🎯 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed to Supabase
- [ ] API keys generated (JWT, Supabase, Cloudflare)
- [ ] Socket.IO server configured
- [ ] email service (SMTP) configured
- [ ] Payment gateway (bkash and nagad) integrated
- [ ] RFID reader API endpoints accessible
- [ ] File auto-delete jobs scheduled
- [ ] SSL certificates obtained

---

## 🗄️ DATABASE DEPLOYMENT (Supabase)

### 1. Create Supabase Project
```bash
# Go to https://supabase.com
# Create new project
# Save your:
# - Project URL
# - Anon Key
# - Service Role Key
```

### 2. Deploy Schema

```bash
# Connect to your Supabase database
# Run the SQL schema from: docs/DATABASE_SCHEMA.sql

# Or use Supabase CLI:
supabase db push docs/DATABASE_SCHEMA.sql
```

### 3. Configure RLS Policies
- Already included in schema
- Run the policy creation statements
- Verify policies are active

### 4. Create API Key Management
```sql
-- Add API key signing function
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
BEGIN
  RETURN 'sk_live_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;
```

---

## ⚙️ BACKEND DEPLOYMENT

### 1. Environment Setup

**Create `backend/.env`:**
```env
# SERVER
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com

# SUPABASE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d

# REDIS (for background jobs)
REDIS_URL=redis://redis-container:6379

# CLOUDFLARE R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_BUCKET_NAME=smart-library
CLOUDFLARE_BUCKET_URL=https://your-bucket.r2.cloudflarestorage.com

# EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_digit_app_password

# SMS (Twilio)
TWILIO_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890

# PAYMENT GATEWAY (SSLCommerz)
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_password
SSLCOMMERZ_API_URL=https://sandbox.sslcommerz.com/gwprocess/v4/api.php
# For production, use: https://securepay.sslcommerz.com/gwprocess/v4/api.php

# RFID
RFID_READER_API_URL=http://rfid-reader.local:8080

# QR SETTINGS
QR_EXPIRY_SECONDS=15
QR_REFRESH_INTERVAL=10000

# FILE SETTINGS
FILE_AUTO_DELETE_MINUTES=30
MAX_FILE_SIZE_MB=100

# LOGGING
LOG_LEVEL=info
```

### 2. Docker Deployment

**Create `backend/Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD npm run health

# Start server
CMD ["npm", "start"]
```

**Create `backend/docker-compose.yml`:**
```yaml
version: '3.8'

services:
  # Node.js Backend
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/library
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - library-network

  # Redis (for background jobs)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - library-network

  # PostgreSQL (optional local DB)
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: library_db
      POSTGRES_USER: library_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./ docs/DATABASE_SCHEMA.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - library-network

volumes:
  postgres_data:
  redis_data:

networks:
  library-network:
    driver: bridge
```

### 3. Deploy with Docker Compose

```bash
cd backend

# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Test health
curl http://localhost:3000/health
```

### 4. Deploy to Cloud (AWS/DigitalOcean/Heroku)

**Option A: Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create smart-library-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
# ... set all other env vars

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

**Option B: AWS (EC2 + RDS + ElastiCache)**

1. Launch EC2 instance (Ubuntu 22.04 LTS)
2. Install Node.js, Docker, Docker Compose
3. Create RDS PostgreSQL instance
4. Create ElastiCache Redis cluster
5. Deploy via docker-compose

**Option C: DigitalOcean App Platform**

```yaml
# Create app.yaml
name: smart-library-backend
services:
  - name: api
    github:
      repo: your-username/smart-library
      branch: main
    build_command: npm install
    run_command: npm start
    http_port: 3000
    envs:
      - key: NODE_ENV
        scope: RUN_AND_BUILD_TIME
        value: production
      - key: JWT_SECRET
        scope: RUN_AND_BUILD_TIME
        value: ${JWT_SECRET}
```

---

## 📱 FRONTEND DEPLOYMENT

### 1. Build Expo App

```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create eas.json
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### 2. Submit to App Stores

**Google Play Store:**
1. Create developer account
2. Generate signed APK
3. Upload build
4. Fill app details
5. Submit for review

**Apple App Store:**
1. Create Apple Developer account
2. Generate signed IPA
3. Use Transporter to upload
4. Fill app metadata
5. Submit for review

### 3. Environment for Mobile

**Create `mobile/.env.production`:**
```env
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

---

## 🔒 SSL/TLS CONFIGURATION

### 1. Get SSL Certificate (Let's Encrypt)

```bash
# Using Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d api.yourdomain.com

# Certificates saved in:
# /etc/letsencrypt/live/api.yourdomain.com/
```

### 2. Configure Nginx

**Create `backend/nginx.conf`:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. Socket.IO SSL

```javascript
// src/app.js
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  secure: true, // Enable SSL
  rejectUnauthorized: false
});
```

---

## 📊 MONITORING & LOGGING

### 1. Application Monitoring

```bash
# Install PM2 for process management
npm install -g pm2

# Start app with PM2
pm2 start server.js --name "smart-library-api"

# Enable auto-restart
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### 2. Logging Setup

**Create `src/utils/logger.js`:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});

module.exports = logger;
```

### 3. Error Tracking (Sentry)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 🔄 BACKGROUND JOBS

### 1. Scheduled Tasks

```javascript
// src/jobs/scheduler.js
const schedule = require('node-schedule');
const { autoDeleteExpiredFiles } = require('./autoDeleteFiles');
const { calculateDailyFines } = require('./calculateFines');
const { sendReminderNotifications } = require('./sendReminders');

// Auto-delete files every 5 minutes
schedule.scheduleJob('*/5 * * * *', autoDeleteExpiredFiles);

// Calculate fines daily at midnight
schedule.scheduleJob('0 0 * * *', calculateDailyFines);

// Send reminders daily at 9 AM
schedule.scheduleJob('0 9 * * *', sendReminderNotifications);
```

### 2. Bull Queue Setup

```javascript
// src/config/queue.js
const Queue = require('bull');

const queues = {
  fileDelete: new Queue('file-delete', process.env.REDIS_URL),
  notification: new Queue('notification', process.env.REDIS_URL),
  report: new Queue('report', process.env.REDIS_URL)
};

// Process jobs
queues.fileDelete.process(async (job) => {
  console.log('Processing:', job.data);
  // Actual job logic
  return { success: true };
});

module.exports = queues;
```

---

## 📈 PERFORMANCE OPTIMIZATION

### 1. Caching Strategy

```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

// Cache user books for 1 hour
const cacheUserBooks = async (userId) => {
  const cacheKey = `user_books_${userId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const books = await fetchUserBooks(userId);
  await client.setEx(cacheKey, 3600, JSON.stringify(books));
  return books;
};
```

### 2. Database Indexing

```sql
-- Already included in schema
-- Verify indexes exist:
SELECT * FROM pg_indexes WHERE tablename = 'users';
```

### 3. API Response Compression

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

---

## 🔐 SECURITY HARDENING

### 1. Environment Secrets

```bash
# Use environment variable management
# Never commit .env to git

# Add to .gitignore:
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. Request Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/v1/books', [
  body('title').isLength({ min: 3 }),
  body('isbn').isISBN(),
  body('author').isLength({ min: 2 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid request
});
```

### 3. Rate Limiting by Route

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // Only 5 login attempts per 15 minites
});

app.post('/login', authLimiter, ...);
app.use('/api/v1/', apiLimiter);
```

---

## 📝 MONITORING CHECKLIST

### Daily
- [ ] Check application logs
- [ ] Verify database connectivity
- [ ] Monitor API response times
- [ ] Check file auto-deletion jobs

### Weekly
- [ ] Review error logs
- [ ] Check disk space usage
- [ ] Verify database backups
- [ ] Review security logs

### Monthly
- [ ] Performance analysis
- [ ] User analytics review
- [ ] Security audit
- [ ] Database optimization

---

## 🆘 TROUBLESHOOTING

### API Not Responding
```bash
# Check if service is running
pm2 status

# View logs
pm2 logs smart-library-api

# Restart
pm2 restart smart-library-api
```

### Socket.IO Connection Issues
```javascript
// Check CORS configuration
// Verify socket.io client version matches server
// Check firewall rules for websocket ports
```

### File Auto-Delete Not Working
```bash
# Check Redis connection
redis-cli ping # Should return PONG

# Check job queue
pm2 logs # Look for job execution logs
```

### Database Connection Error
```bash
# Test connection
psql -h localhost -U user -d database

# Check connection pool
SELECT * FROM pg_stat_activity;
```

---

## 🎉 DEPLOYMENT SUMMARY

1. ✅ Database: Supabase PostgreSQL
2. ✅ Backend: Node.js with Express
3. ✅ Real-time: Socket.IO
4. ✅ Storage: Cloudflare R2
5. ✅ Mobile: React Native Expo
6. ✅ Authentication: JWT + Supabase Auth
7. ✅ Background Jobs: Bull/Redis
8. ✅ Monitoring: PM2 + Winston + Sentry

---

**Happy Deploying! 🚀**

For issues, refer to individual docs:
- [API Documentation](./API_DOCUMENTATION.md)
- [Backend Setup](../backend/BACKEND_SETUP.md)
- [React Native Setup](../mobile/REACT_NATIVE_SETUP.md)
- [RFID Integration](./RFID_INTEGRATION.md)
- [File Sharing & Print](./FILE_SHARING_AND_PRINT_SYSTEM.md)
