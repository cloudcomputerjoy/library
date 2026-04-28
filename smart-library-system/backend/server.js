/**
 * Smart Library Backend - Main Server Entry Point
 * Express.js server with Socket.IO, Supabase, and real-time features
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const rateLimit = require('express-rate-limit');

// Import configuration
const { initializeSocketIO } = require('./src/config/socket');
const { initializeEventEmitter } = require('./src/config/socketEvents');
const { checkDatabaseHealth } = require('./src/config/database');
const { initializeFirebase } = require('./src/config/firebase');

// Import middleware
const {
  errorHandler,
  notFoundHandler,
} = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const qrRoutes = require('./src/routes/qr');
const bookRoutes = require('./src/routes/books');
const transactionRoutes = require('./src/routes/transactions');
const issueRoutes = require('./src/routes/issue');
const returnRoutes = require('./src/routes/return');
const fileRoutes = require('./src/routes/files');
const printRoutes = require('./src/routes/print');
const rfidRoutes = require('./src/routes/rfid');
const paymentsRoutes = require('./src/routes/payments');
const notificationsRoutes = require('./src/routes/notifications');
const fcmRoutes = require('./src/routes/fcm');
const categoriesRoutes = require('./src/routes/categories');
const shelvesRoutes = require('./src/routes/shelves');
const searchRoutes = require('./src/routes/search');
const currencySettingsRoutes = require('./src/routes/currencySettings');
const supportRoutes = require('./src/routes/support');
const uploadRoutes = require('./src/routes/upload');
// const adminRoutes = require('./src/routes/admin'); // OLD - Use full Supabase version
// const adminRoutes = require('./src/routes/adminSupabaseMinimal'); // MINIMAL - Not recommended
const adminRoutes = require('./src/routes/adminSupabase'); // FULL - Complete admin functionality

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Trust proxy - important for rate limiting when behind a proxy/load balancer
app.set('trust proxy', 1);

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

// ============================================================
// RATE LIMITING MIDDLEWARE
// ============================================================

// Global rate limiter - increased for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased to 1000 for dev (67 req/min)
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development, skip rate limiting entirely for API calls
    if (process.env.NODE_ENV !== 'production') {
      return req.path.startsWith('/api/');
    }
    // In production, skip only health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

app.use(limiter);

// Auth-specific rate limiter (more lenient for login attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress, // Rate limit by IP
  skip: (req) => {
    // In development, skip rate limiting entirely
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  },
});

// ============================================================
// BODY PARSER MIDDLEWARE
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// REQUEST LOGGING MIDDLEWARE
// ============================================================

app.use((req, res, next) => {
  const startTime = Date.now();

  // Attach request ID
  req.id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Log request
  if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
    console.log(`[${req.method}] ${req.path} - ${req.id}`);
  }

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${res.statusCode}] ${req.method} ${req.path} (${duration}ms) - ${req.id}`
    );
  });

  next();
});

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

app.get('/health', async (req, res) => {
  try {
    const databaseHealthy = await checkDatabaseHealth();

    res.json({
      status: 'OK',
      timestamp: new Date(),
      database: databaseHealthy ? 'healthy' : 'unhealthy',
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// API ROUTES
// ============================================================

// Auth routes with auth-specific limiter
app.use('/api/auth', authLimiter, authRoutes);

// QR routes
app.use('/api/qr', qrRoutes);

// File/Photo Upload Routes
app.use('/api/upload', uploadRoutes);

// Book routes
app.use('/api/books', bookRoutes);

// Transaction routes (issue/return/reserve)
app.use('/api/transactions', transactionRoutes);

// Book issuance routes (both singular and plural for mobile app compatibility)
app.use('/api/issue', issueRoutes);
app.use('/api/issues', issueRoutes);  // ✅ Alias for mobile app endpoints

// Book return routes
app.use('/api/return', returnRoutes);

// File sharing routes
app.use('/api/files', fileRoutes);

// Payments routes
app.use('/api/payments', paymentsRoutes);

// Notifications routes
app.use('/api/notifications', notificationsRoutes);

// FCM (Firebase Cloud Messaging) routes
app.use('/api/fcm', fcmRoutes);

// Categories and Shelves
app.use('/api/categories', categoriesRoutes);
app.use('/api/shelves', shelvesRoutes);

// Global search
app.use('/api/search', searchRoutes);

// Print system routes
app.use('/api/print', printRoutes);

// RFID integration routes
app.use('/api/rfid', rfidRoutes);

// Support tickets routes
app.use('/api/support', supportRoutes);

// Currency settings routes
app.use('/api/currency', currencySettingsRoutes);

// ============================================================
// ADMIN API RATE LIMITER (More lenient for dashboard operations)
// ============================================================
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // Allow 500 requests per 5 minutes (100 per minute)
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development, skip rate limiting entirely for admin requests
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  },
});

// Admin panel routes (protected with full CRUD operations)
app.use('/api/admin', adminLimiter, adminRoutes);

app.use('/api/admins', adminLimiter, adminRoutes); // Alias for admin endpoints

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth();

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      database: dbHealthy ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(dbHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFoundHandler);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// CREATE HTTP SERVER WITH SOCKET.IO
// ============================================================

const server = http.createServer(app);
const io = initializeSocketIO(server);
initializeEventEmitter(io); // Initialize event emitter for controllers to use

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  try {
    // Initialize Firebase
    try {
      initializeFirebase();
      console.log('✅ Firebase initialized');
    } catch (firebaseError) {
      console.warn('⚠️  Firebase initialization warning:', firebaseError.message);
      if (process.env.NODE_ENV === 'production') {
        throw firebaseError;
      }
    }

    // Check database connection
    const dbHealthy = await checkDatabaseHealth();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    // Start listening - bind to all network interfaces for mobile access
    const HOST = process.env.HOST || '0.0.0.0';
    server.listen(PORT, HOST, () => {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
      console.log(`
╔════════════════════════════════════════════════════════╗
║     Smart Library Backend - Running Successfully        ║
╠════════════════════════════════════════════════════════╣
║ Server:       ${protocol}://${displayHost}:${PORT}
║ Accessible:   ${protocol}://${HOST === '0.0.0.0' ? '<your-ip>' : HOST}:${PORT}
║ Environment:  ${process.env.NODE_ENV || 'development'}
║ Database:     ${process.env.SUPABASE_URL?.split('.')[0] || 'Supabase'}
║ Websocket:    Socket.IO enabled
╚════════════════════════════════════════════════════════╝
      `);

      // Log available endpoints
      console.log('\n📋 Available Endpoints:');
      console.log('  GET  /health                    - Server health check');
      console.log('');
      console.log('  🔐 Authentication (/api/auth)');
      console.log('    POST /register              - User registration');
      console.log('    POST /login                 - User login');
      console.log('    POST /refresh-token         - Refresh JWT token');
      console.log('    GET  /me                    - Get current user');
      console.log('    PUT  /update-profile        - Update profile');
      console.log('');
      console.log('  📚 Books (/api/books)');
      console.log('    GET  /                      - List books');
      console.log('    GET  /:id                   - Get book details');
      console.log('    POST /                      - Create book (Librarian)');
      console.log('    PUT  /:id                   - Update book (Librarian)');
      console.log('    DELETE /:id                 - Delete book (Librarian)');
      console.log('    POST /:id/review            - Add review');
      console.log('');
      console.log('  🔐 QR System (/api/qr)');
      console.log('    GET  /generate              - Generate QR code');
      console.log('    POST /scan                  - Scan QR code (entry/exit)');
      console.log('    GET  /status                - Get attendance status');
      console.log('    GET  /attendance-logs       - Get attendance history');
      console.log('');
      console.log('  📋 Transactions (/api/transactions)');
      console.log('    POST /issue                 - Issue book (Librarian)');
      console.log('    POST /return                - Return book (Librarian)');
      console.log('    POST /reserve               - Reserve book');
      console.log('    GET  /my-transactions       - Get user transactions');
      console.log('');
      console.log('  📄 File Sharing (/api/files)');
      console.log('    POST /upload                - Upload file');
      console.log('    GET  /my-files              - Get user files');
      console.log('    GET  /shared                - Get shared files (Librarian)');
      console.log('    DELETE /:id                 - Delete file');
      console.log('    GET  /:id/download          - Get download link');
      console.log('');
      console.log('  🖨️  Print System (/api/print)');
      console.log('    POST /request               - Request print job');
      console.log('    GET  /my-jobs               - Get user print jobs');
      console.log('    GET  /queue                 - Get print queue (Librarian)');
      console.log('    PUT  /:jobId/status         - Update job status (Librarian)');
      console.log('');
      console.log('  🔐 RFID (/api/rfid)');
      console.log('    POST /scan                  - Scan RFID card');
      console.log('    POST /register              - Register card (Librarian)');
      console.log('    PUT  /:cardId/status        - Update card status');
      console.log('');
      console.log('  📊 WebSocket Events: entry_success, exit_success, book_available,');
      console.log('     file_shared, print_job_created, notification');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = { app, server, io };
