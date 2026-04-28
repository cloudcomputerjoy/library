/**
 * Socket.IO Real-time Events Configuration
 * Manages WebSocket connections and real-time event streaming
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

/**
 * Initialize Socket.IO server
 */
const initializeSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
      allowEIO3: true, // Support Socket.IO v3 clients
    },
    transports: (process.env.SOCKET_IO_TRANSPORTS || 'websocket,polling').split(','),
    pingInterval: 25000,
    pingTimeout: 60000,
    allowUpgrades: true,
    maxHttpBufferSize: 1e6, // 1MB
  });

  // Middleware: Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Missing authentication token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`✓ User ${socket.userId} connected via Socket.IO`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);

    // ============================================================
    // ATTENDANCE EVENTS
    // ============================================================

    socket.on('entry_scan', async (data) => {
      console.log(`[ENTRY] User ${socket.userId} scanned entry`);
      // Entry logic will be handled by API, just notify updates
      io.to(`role:librarian`).emit('entry_recorded', {
        userId: socket.userId,
        timestamp: new Date(),
        type: 'entry',
      });
    });

    socket.on('exit_scan', async (data) => {
      console.log(`[EXIT] User ${socket.userId} scanned exit`);
      io.to(`role:librarian`).emit('exit_recorded', {
        userId: socket.userId,
        timestamp: new Date(),
        type: 'exit',
      });
    });

    // ============================================================
    // BOOK AVAILABILITY EVENTS
    // ============================================================

    socket.on('book_returned', (data) => {
      console.log(`[BOOK] Book ${data.bookId} returned`);
      io.emit('book_availability_updated', {
        bookId: data.bookId,
        availableCopies: data.availableCopies,
      });
    });

    socket.on('book_issued', (data) => {
      console.log(`[BOOK] Book ${data.bookId} issued`);
      io.emit('book_availability_updated', {
        bookId: data.bookId,
        availableCopies: data.availableCopies,
      });
    });

    // ============================================================
    // FILE SHARING EVENTS
    // ============================================================

    socket.on('file_uploaded', (data) => {
      console.log(`[FILE] File ${data.fileId} uploaded by ${socket.userId}`);
      
      // Notify admin/teachers
      io.to('role:admin').emit('file_shared', {
        fileName: data.fileName,
        userId: socket.userId,
        fileSize: data.fileSize,
        timestamp: new Date(),
        filePath: data.filePath,
      });

      // Notify the user
      socket.emit('file_upload_success', {
        fileId: data.fileId,
        scheduledDeletion: new Date(Date.now() + 30 * 60 * 1000),
      });
    });

    socket.on('file_shared', (data) => {
      console.log(`[FILE] File shared with ${data.recipientId}`);
      io.to(`user:${data.recipientId}`).emit('file_received', {
        fileName: data.fileName,
        senderId: socket.userId,
        fileId: data.fileId,
        timestamp: new Date(),
      });
    });

    // ============================================================
    // PRINT SYSTEM EVENTS
    // ============================================================

    socket.on('print_requested', (data) => {
      console.log(`[PRINT] Print job ${data.jobId} requested`);
      
      // Notify admin
      io.to('role:admin').emit('new_print_job', {
        jobId: data.jobId,
        userId: socket.userId,
        fileName: data.fileName,
        pageCount: data.pageCount,
        timestamp: new Date(),
      });

      // Confirm to user
      socket.emit('print_queued', {
        jobId: data.jobId,
        position: data.queuePosition,
      });
    });

    socket.on('print_status_check', async (data) => {
      // Handled by API endpoint, emit status updates here
      socket.emit('print_status', {
        jobId: data.jobId,
        status: 'pending', // Values: pending, printing, completed
        timestamp: new Date(),
      });
    });

    // ============================================================
    // NOTIFICATION EVENTS
    // ============================================================

    socket.on('notification_read', async (data) => {
      console.log(`[NOTIF] User ${socket.userId} read notification ${data.notificationId}`);
      // Mark as read in database
    });

    socket.on('request_notification', (data) => {
      // Library sends book availability notification
      console.log(`[NOTIF] Sending notification to ${socket.userId}`);
      socket.emit('notification', {
        type: data.type, // 'book_available', 'due_reminder', 'fine_alert'
        message: data.message,
        timestamp: new Date(),
      });
    });

    // ============================================================
    // LIVE DASHBOARD EVENTS
    // ============================================================

    socket.on('get_live_stats', (data) => {
      // Librarian requests live dashboard stats
      socket.emit('live_stats', {
        studentsCurrentlyInside: Math.floor(Math.random() * 100),
        booksIssued: Math.floor(Math.random() * 500),
        pendingReturns: Math.floor(Math.random() * 50),
        overdueFines: Math.floor(Math.random() * 20),
        timestamp: new Date(),
      });
    });

    // ============================================================
    // RFID READER EVENTS
    // ============================================================

    socket.on('rfid_card_detected', (data) => {
      console.log(`[RFID] RFID card ${data.cardId} detected`);
      io.to('role:librarian').emit('rfid_scan', {
        cardId: data.cardId,
        userId: data.userId,
        timestamp: new Date(),
        action: 'entry' || 'exit',
      });
    });

    // ============================================================
    // DISCONNECT EVENT
    // ============================================================

    socket.on('disconnect', () => {
      console.log(`✓ User ${socket.userId} disconnected`);
    });

    // ============================================================
    // ERROR HANDLING
    // ============================================================

    socket.on('error', (error) => {
      console.error(`[Socket Error] User ${socket.userId}:`, error);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance (after initialization)
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Emit event to specific user
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to all users with specific role
 */
const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

/**
 * Broadcast event to all connected clients
 */
const broadcastEvent = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

module.exports = {
  initializeSocketIO,
  getIO,
  emitToUser,
  emitToRole,
  broadcastEvent,
};
