# Smart Library Backend Setup

## 📦 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── supabase.js
│   │   ├── environment.js
│   │   ├── socketio.js
│   │   └── cloudflare.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── apiKeyAuth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── books.js
│   │   ├── transactions.js
│   │   ├── qr.js
│   │   ├── attendance.js
│   │   ├── fines.js
│   │   ├── fileShares.js
│   │   ├── rfid.js
│   │   ├── admin.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── bookController.js
│   │   ├── transactionController.js
│   │   ├── qrController.js
│   │   ├── attendanceController.js
│   │   ├── fineController.js
│   │   ├── fileController.js
│   │   ├── rfidController.js
│   │   └── adminController.js
│   ├── services/
│   │   ├── qrService.js
│   │   ├── fineService.js
│   │   ├── notificationService.js
│   │   ├── cloudflareService.js
│   │   ├── emailService.js
│   │   ├── smsService.js
│   │   ├── recommendationService.js
│   │   ├── rfidService.js
│   │   └── autoDeleteService.js
│   ├── utils/
│   │   ├── generateQR.js
│   │   ├── tokenManager.js
│   │   ├── validators.js
│   │   ├── logger.js
│   │   └── helpers.js
│   ├── jobs/
│   │   ├── autoDeleteFiles.js
│   │   ├── calculateFines.js
│   │   ├── sendReminders.js
│   │   ├── archiveOldLogs.js
│   │   └── updateRecommendations.js
│   └── app.js
├── .env
├── .env.example
├── package.json
├── server.js
├── docker-compose.yml
└── README.md
```

## 🔧 Installation & Setup

### 1. Initialize Project
```bash
cd backend
npm init -y
```

### 2. Install Dependencies
```bash
npm install express
npm install cors dotenv
npm install supabase @supabase/supabase-js
npm install socket.io
npm install bcryptjs jsonwebtoken
npm install multer
npm install qrcode
npm install axios
npm install bull redis
npm install joi
npm install helmet express-rate-limit
npm install morgan
npm install crypto
npm install sharp
npm install cloudflare
npm install nodemailer
npm install uuid
npm install moment

# Dev Dependencies
npm install --save-dev nodemon
npm install --save-dev jest supertest
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

## 📋 Environment Variables (.env)

```env
# SERVER
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# SUPABASE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d

# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/library_db

# REDIS
REDIS_URL=redis://localhost:6379

# CLOUDFLARE
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_BUCKET_NAME=smart-library

# SOCKET.IO
SOCKET_CORS=http://localhost:3001

# EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (Twilio or similar)
SMS_PROVIDER=twilio
TWILIO_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# PAYMENT GATEWAY (SSLCommerz)
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_API_URL=https://gateway.sslcommerz.com/gwprocess/v4/api.php

# QR SETTINGS
QR_EXPIRY_SECONDS=15
QR_REFRESH_INTERVAL=10000

# FILE SHARING
FILE_AUTO_DELETE_MINUTES=30
MAX_FILE_SIZE_MB=100

# LOGGING
LOG_LEVEL=info

# RFID
RFID_READER_API_URL=http://rfid-reader:8080
```

## 🚀 Core Files

### server.js
```javascript
const app = require('./src/app');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Attach IO to app
app.set('io', io);

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join_attendance_channel', () => {
    socket.join('attendance');
  });
  
  socket.on('subscribe_notifications', (userId) => {
    socket.join(`user_${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
```

### src/app.js
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60 // limit each IP to 60 requests per minute
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/books', require('./routes/books'));
app.use('/api/v1/transactions', require('./routes/transactions'));
app.use('/api/v1/qr', require('./routes/qr'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/fines', require('./routes/fines'));
app.use('/api/v1/file-shares', require('./routes/fileShares'));
app.use('/api/v1/rfid', require('./routes/rfid'));
app.use('/api/v1/admin', require('./routes/admin'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An internal server error occurred'
    }
  });
});

module.exports = app;
```

### src/config/supabase.js
```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
```

### src/middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'No authentication token provided'
      }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource'
        }
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
```

### src/utils/generateQR.js
```javascript
const QRCode = require('qrcode');
const crypto = require('crypto');
require('dotenv').config();

const generateQRToken = (userId) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataToHash = `${userId}${timestamp}${process.env.JWT_SECRET}`;
  
  const token = crypto
    .createHash('sha256')
    .update(dataToHash)
    .digest('hex');
  
  return {
    token,
    user_id: userId,
    timestamp,
    expires_in: parseInt(process.env.QR_EXPIRY_SECONDS) || 15
  };
};

const generateQRImage = async (data) => {
  try {
    const qrImage = await QRCode.toDataURL(JSON.stringify(data), {
      width: 300,
      margin: 1,
      color: {
        dark: '#000',
        light: '#fff'
      }
    });
    return qrImage;
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
};

module.exports = { generateQRToken, generateQRImage };
```

### src/services/qrService.js
```javascript
const supabase = require('../config/supabase');
const { generateQRToken, generateQRImage } = require('../utils/generateQR');

class QRService {
  async createDynamicQR(userId) {
    try {
      const qrTokenData = generateQRToken(userId);
      const qrImage = await generateQRImage(qrTokenData);
      
      // Save QR token to database
      const { data, error } = await supabase
        .from('qr_tokens')
        .insert([
          {
            user_id: userId,
            token: qrTokenData.token,
            qr_data: qrTokenData,
            expires_at: new Date(Date.now() + qrTokenData.expires_in * 1000).toISOString()
          }
        ])
        .select('*')
        .single();
      
      if (error) throw error;
      
      return {
        qr_token: qrTokenData.token,
        qr_image_url: qrImage,
        qr_data: qrTokenData,
        expires_in: qrTokenData.expires_in,
        expires_at: data.expires_at
      };
    } catch (err) {
      console.error('QR Service Error:', err);
      throw err;
    }
  }
  
  async validateQRToken(token) {
    try {
      const { data, error } = await supabase
        .from('qr_tokens')
        .select('*')
        .eq('token', token)
        .single();
      
      if (error) throw new Error('Invalid QR token');
      if (data.is_used) throw new Error('QR token already used');
      if (new Date(data.expires_at) < new Date()) throw new Error('QR token expired');
      
      return data;
    } catch (err) {
      throw new Error(err.message || 'QR validation failed');
    }
  }
}

module.exports = new QRService();
```

### src/services/notificationService.js
```javascript
const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');
require('dotenv').config();

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  async sendNotification(userId, notification) {
    try {
      // Save to database
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: notification.title,
          message: notification.message,
          notification_type: notification.type,
          channel: notification.channel || 'in_app'
        }]);
      
      if (error) throw error;
      
      // Send via appropriate channel
      if (notification.channel === 'email' || notification.channel === 'all') {
        await this.sendEmail(userId, notification);
      }
      
      if (notification.channel === 'sms' || notification.channel === 'all') {
        await this.sendSMS(userId, notification);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Notification Service Error:', err);
      throw err;
    }
  }
  
  async sendEmail(userId, notification) {
    try {
      // Get user email from database
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (!user.email) return;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: notification.title,
        html: `
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <p>Library Management System</p>
        `
      });
    } catch (err) {
      console.error('Email Send Error:', err);
    }
  }
  
  async sendSMS(userId, notification) {
    // Implement Twilio or similar SMS service
    console.log(`SMS to ${userId}: ${notification.message}`);
  }
}

module.exports = new NotificationService();
```

### src/services/cloudflareService.js
```javascript
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

class CloudflareService {
  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_API_TOKEN,
        secretAccessKey: process.env.CLOUDFLARE_API_SECRET
      }
    });
  }
  
  async uploadFile(fileBuffer, fileName, contentType) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: `files/${Date.now()}-${fileName}`,
        Body: fileBuffer,
        ContentType: contentType
      });
      
      const result = await this.client.send(command);
      
      const fileUrl = `https://${process.env.CLOUDFLARE_BUCKET_NAME}.r2.cloudflarestorage.com/files/${Date.now()}-${fileName}`;
      
      return { success: true, fileUrl, etag: result.ETag };
    } catch (err) {
      console.error('Cloudflare Upload Error:', err);
      throw err;
    }
  }
  
  async deleteFile(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: fileKey
      });
      
      await this.client.send(command);
      return { success: true };
    } catch (err) {
      console.error('Cloudflare Delete Error:', err);
      throw err;
    }
  }
}

module.exports = new CloudflareService();
```

### src/routes/auth.js
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
```

### src/routes/qr.js
```javascript
const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, qrController.generateQR);
router.post('/validate', qrController.validateQR);
router.get('/history', authenticate, qrController.getHistory);
router.get('/image/:token', qrController.getQRImage);

module.exports = router;
```

## 📝 Next Steps

1. **Create Controllers** - Implement all controller logic
2. **Setup Database** - Run migrations with Supabase
3. **Configure Socket.IO** - Setup real-time events
4. **Setup Background Jobs** - Configure Bull/Redis for auto-deletions and reminders
5. **Add Testing** - Jest tests for critical endpoints
6. **Deploy** - Docker setup for production

## 🔗 Live Socket.IO Events

```javascript
// Entry/Exit Events
io.to('attendance').emit('entry_success', { user_name, entry_time, location });
io.to('attendance').emit('exit_success', { user_name, exit_time, duration });

// Notifications
io.to(`user_${userId}`).emit('book_available', bookData);
io.to(`user_${userId}`).emit('due_reminder', bookData);
io.to(`user_${userId}`).emit('print_ready', jobData);

// Occupancy
io.emit('occupancy_update', { current_inside, timestamp });
```

