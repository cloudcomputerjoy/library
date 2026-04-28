/**
 * Socket.IO Event Emitter Utility
 * Provides easy-to-use methods for controllers to emit real-time events
 */

let io;

/**
 * Initialize the Socket event emitter with the IO instance
 */
const initializeEventEmitter = (socketIO) => {
  io = socketIO;
};

/**
 * Get the IO instance
 */
const getIO = () => {
  if (!io) {
    console.warn('⚠️ Socket.IO not initialized yet');
    return null;
  }
  return io;
};

// ============================================================
// DASHBOARD EVENTS
// ============================================================

/**
 * Emit dashboard stats update to all admin users
 */
const emitDashboardUpdate = (stats) => {
  if (!io) return;
  io.to('role:admin').emit('dashboard:stats:updated', {
    stats,
    timestamp: new Date(),
  });
};

/**
 * Emit live metrics update to admin dashboard
 */
const emitLiveMetricsUpdate = (metrics) => {
  if (!io) return;
  io.to('role:admin').emit('dashboard:metrics:updated', {
    metrics,
    timestamp: new Date(),
  });
};

// ============================================================
// BOOK EVENTS
// ============================================================

/**
 * Emit when a book is added
 */
const emitBookAdded = (bookData) => {
  if (!io) return;
  io.emit('book:added', {
    book: bookData,
    timestamp: new Date(),
  });
  io.to('role:admin').emit('admin:book:added', {
    book: bookData,
    message: `New book added: ${bookData.title}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when a book is updated
 */
const emitBookUpdated = (bookData) => {
  if (!io) return;
  io.emit('book:updated', {
    book: bookData,
    timestamp: new Date(),
  });
  io.to('role:admin').emit('admin:book:updated', {
    book: bookData,
    message: `Book updated: ${bookData.title}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when a book is deleted
 */
const emitBookDeleted = (bookId, bookTitle) => {
  if (!io) return;
  io.emit('book:deleted', {
    bookId,
    title: bookTitle,
    timestamp: new Date(),
  });
  io.to('role:admin').emit('admin:book:deleted', {
    bookId,
    title: bookTitle,
    message: `Book deleted: ${bookTitle}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when book availability changes
 */
const emitBookAvailabilityChanged = (bookId, availableCopies, totalCopies) => {
  if (!io) return;
  io.emit('book:availability:changed', {
    bookId,
    availableCopies,
    totalCopies,
    timestamp: new Date(),
  });
};

// ============================================================
// TRANSACTION EVENTS
// ============================================================

/**
 * Emit when a book is issued
 */
const emitBookIssued = (transactionData) => {
  if (!io) return;
  
  // Notify admin
  io.to('role:admin').emit('admin:book:issued', {
    transaction: transactionData,
    message: `Book issued to ${transactionData.userName}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${transactionData.userId}`).emit('book:issued', {
    book: transactionData.bookTitle,
    dueDate: transactionData.dueDate,
    message: `You have successfully borrowed "${transactionData.bookTitle}"`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'book_issued',
    description: `${transactionData.userName} borrowed ${transactionData.bookTitle}`,
    userId: transactionData.userId,
    timestamp: new Date(),
  });
};

/**
 * Emit when a book is returned
 */
const emitBookReturned = (transactionData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:book:returned', {
    transaction: transactionData,
    message: `Book returned by ${transactionData.userName}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${transactionData.userId}`).emit('book:returned', {
    book: transactionData.bookTitle,
    message: `Thank you for returning "${transactionData.bookTitle}"`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'book_returned',
    description: `${transactionData.userName} returned ${transactionData.bookTitle}`,
    userId: transactionData.userId,
    timestamp: new Date(),
  });
};

// ============================================================
// FINE EVENTS
// ============================================================

/**
 * Emit when a fine is created
 */
const emitFineCreated = (fineData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:fine:created', {
    fine: fineData,
    message: `Fine created: ₹${fineData.amount} for ${fineData.userName}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${fineData.userId}`).emit('fine:created', {
    amount: fineData.amount,
    reason: fineData.reason,
    dueDate: fineData.dueDate,
    message: `You have a fine of ₹${fineData.amount}`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'fine_created',
    description: `Fine of ₹${fineData.amount} created for ${fineData.userName}`,
    userId: fineData.userId,
    timestamp: new Date(),
  });
};

/**
 * Emit when a fine is paid
 */
const emitFinePaid = (fineData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:fine:paid', {
    fine: fineData,
    message: `Fine paid: ₹${fineData.amount} by ${fineData.userName}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${fineData.userId}`).emit('fine:paid', {
    amount: fineData.amount,
    message: `Fine payment of ₹${fineData.amount} received successfully`,
    timestamp: new Date(),
  });
};

/**
 * Emit when a fine is waived
 */
const emitFineWaived = (fineData) => {
  if (!io) return;

  // Notify user
  io.to(`user:${fineData.userId}`).emit('fine:waived', {
    amount: fineData.amount,
    message: `Your fine of ₹${fineData.amount} has been waived`,
    timestamp: new Date(),
  });

  // Notify admin
  io.to('role:admin').emit('admin:fine:waived', {
    fine: fineData,
    message: `Fine waived: ₹${fineData.amount} for ${fineData.userName}`,
    timestamp: new Date(),
  });
};

// ============================================================
// USER EVENTS
// ============================================================

/**
 * Emit when a user is created
 */
const emitUserCreated = (userData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:user:created', {
    user: userData,
    message: `New user created: ${userData.email}`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'user_created',
    description: `New user registered: ${userData.email}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when a user profile is updated
 */
const emitUserUpdated = (userData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:user:updated', {
    user: userData,
    message: `User updated: ${userData.email}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when user status changes (active/inactive)
 */
const emitUserStatusChanged = (userId, status) => {
  if (!io) return;

  io.to('role:admin').emit('admin:user:status:changed', {
    userId,
    status,
    message: `User status changed to ${status}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when a user is deleted
 */
const emitUserDeleted = (userId, userEmail) => {
  if (!io) return;

  io.to('role:admin').emit('admin:user:deleted', {
    userId,
    email: userEmail,
    message: `User deleted: ${userEmail}`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'user_deleted',
    description: `User deleted: ${userEmail}`,
    timestamp: new Date(),
  });
};

// ============================================================
// NOTIFICATION EVENTS
// ============================================================

/**
 * Emit a notification to specific user
 */
const emitNotification = (userId, notificationData) => {
  if (!io) return;

  io.to(`user:${userId}`).emit('notification', {
    notification: notificationData,
    timestamp: new Date(),
  });
};

/**
 * Emit bulk notification to multiple users
 */
const emitBulkNotification = (userIds, notificationData) => {
  if (!io) return;

  userIds.forEach((userId) => {
    io.to(`user:${userId}`).emit('notification', {
      notification: notificationData,
      timestamp: new Date(),
    });
  });
};

/**
 * Emit notification to all users with specific role
 */
const emitNotificationToRole = (role, notificationData) => {
  if (!io) return;

  io.to(`role:${role}`).emit('notification', {
    notification: notificationData,
    timestamp: new Date(),
  });
};

// ============================================================
// PRINT EVENTS
// ============================================================

/**
 * Emit when a print job is created
 */
const emitPrintJobCreated = (printJobData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:print:job:created', {
    printJob: printJobData,
    message: `New print job: ${printJobData.pageCount} pages`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${printJobData.userId}`).emit('print:job:created', {
    jobId: printJobData.id,
    pageCount: printJobData.pageCount,
    status: printJobData.status,
    message: 'Your print job has been queued',
    timestamp: new Date(),
  });
};

/**
 * Emit when print job status updates
 */
const emitPrintJobStatusUpdated = (printJobData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:print:job:updated', {
    printJob: printJobData,
    message: `Print job status: ${printJobData.status}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${printJobData.userId}`).emit('print:job:updated', {
    jobId: printJobData.id,
    status: printJobData.status,
    message: `Your print job is ${printJobData.status}`,
    timestamp: new Date(),
  });
};

// ============================================================
// SUPPORT TICKET EVENTS
// ============================================================

/**
 * Emit when a support ticket is created
 */
const emitSupportTicketCreated = (ticketData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:ticket:created', {
    ticket: ticketData,
    message: `New support ticket: ${ticketData.subject}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${ticketData.userId}`).emit('ticket:created', {
    ticketId: ticketData.id,
    message: `Support ticket created: ${ticketData.subject}`,
    timestamp: new Date(),
  });
};

/**
 * Emit when a support ticket is replied
 */
const emitSupportTicketReplied = (ticketData, replyData) => {
  if (!io) return;

  // Notify user
  io.to(`user:${ticketData.userId}`).emit('ticket:replied', {
    ticketId: ticketData.id,
    reply: replyData.message,
    message: 'New reply to your support ticket',
    timestamp: new Date(),
  });
};

// ============================================================
// PAYMENT EVENTS
// ============================================================

/**
 * Emit when a payment is processed
 */
const emitPaymentProcessed = (paymentData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:payment:processed', {
    payment: paymentData,
    message: `Payment received: ₹${paymentData.amount}`,
    timestamp: new Date(),
  });

  // Notify user
  io.to(`user:${paymentData.userId}`).emit('payment:processed', {
    amount: paymentData.amount,
    reference: paymentData.referenceId,
    message: `Payment of ₹${paymentData.amount} received successfully`,
    timestamp: new Date(),
  });
};

// ============================================================
// ATTENDANCE EVENTS
// ============================================================

/**
 * Emit when user enters
 */
const emitUserEntry = (entryData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:attendance:entry', {
    entry: entryData,
    message: `${entryData.userName} entered at ${entryData.entryTime}`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'user_entry',
    description: `${entryData.userName} entered the library`,
    timestamp: new Date(),
  });
};

/**
 * Emit when user exits
 */
const emitUserExit = (exitData) => {
  if (!io) return;

  // Notify admin
  io.to('role:admin').emit('admin:attendance:exit', {
    exit: exitData,
    message: `${exitData.userName} exited at ${exitData.exitTime}`,
    timestamp: new Date(),
  });

  // Emit to dashboard
  io.to('role:admin').emit('dashboard:activity', {
    type: 'user_exit',
    description: `${exitData.userName} left the library`,
    timestamp: new Date(),
  });
};

// ============================================================
// GENERIC EVENTS
// ============================================================

/**
 * Emit custom event to specific user
 */
const emitToUser = (userId, eventName, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(eventName, {
    data,
    timestamp: new Date(),
  });
};

/**
 * Emit custom event to users with specific role
 */
const emitToRole = (role, eventName, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(eventName, {
    data,
    timestamp: new Date(),
  });
};

/**
 * Broadcast event to all connected users
 */
const broadcast = (eventName, data) => {
  if (!io) return;
  io.emit(eventName, {
    data,
    timestamp: new Date(),
  });
};

module.exports = {
  initializeEventEmitter,
  getIO,
  // Dashboard
  emitDashboardUpdate,
  emitLiveMetricsUpdate,
  // Books
  emitBookAdded,
  emitBookUpdated,
  emitBookDeleted,
  emitBookAvailabilityChanged,
  // Transactions
  emitBookIssued,
  emitBookReturned,
  // Fines
  emitFineCreated,
  emitFinePaid,
  emitFineWaived,
  // Users
  emitUserCreated,
  emitUserUpdated,
  emitUserDeleted,
  emitUserStatusChanged,
  // Notifications
  emitNotification,
  emitBulkNotification,
  emitNotificationToRole,
  // Print
  emitPrintJobCreated,
  emitPrintJobStatusUpdated,
  // Support
  emitSupportTicketCreated,
  emitSupportTicketReplied,
  // Payments
  emitPaymentProcessed,
  // Attendance
  emitUserEntry,
  emitUserExit,
  // Generic
  emitToUser,
  emitToRole,
  broadcast,
};
