// Admin Routes - Supabase Integration
// Updated to use Supabase controllers

const express = require('express');
const router = express.Router();

// Import controllers
const adminController = require('../controllers/adminControllerSupabase');
const booksController = require('../controllers/adminBooksControllerSupabase');
const advancedBooksController = require('../controllers/advancedBooksController');
const transactionsController = require('../controllers/adminTransactionsControllerSupabase');
const printController = require('../controllers/printJobsControllerSupabase');
const supportController = require('../controllers/supportControllerSupabase');
const settingsController = require('../controllers/settingsControllerSupabase');
const reportsController = require('../controllers/reportsControllerSupabase');

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/metrics', adminController.getDashboardStats); // Alias for metrics
router.get('/dashboard/live-feed', adminController.getLiveFeed);
router.get('/dashboard/analytics', adminController.getAnalytics);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================
router.get('/users', adminController.getUsers);
router.get('/users/options', adminController.getUserOptions);
router.post('/users/options', adminController.addUserOption);
router.delete('/users/options/:type/:value', adminController.removeUserOption);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/bulk-import', adminController.bulkImportUsers);

// ============================================
// BOOK MANAGEMENT ROUTES
// ============================================
router.get('/books', booksController.getBooks);
router.get('/books/:id', booksController.getBook);
router.post('/books', booksController.createBook);
router.put('/books/:id', booksController.updateBook);
router.delete('/books/:id', booksController.deleteBook);
router.get('/books/search', booksController.searchBooksEndpoint);
router.get('/books/:id/copies', booksController.getBookCopies);
router.post('/books/:id/copies', booksController.addBookCopies);
router.put('/books/:id/copies/:copyId', booksController.updateBookCopy);

// ============================================
// ADVANCED BOOK MANAGEMENT (QR Codes & ISBN)
// ============================================
router.post('/books/add', advancedBooksController.addBook);
router.post('/books/search-qr', advancedBooksController.searchByQRCode);
router.post('/books/generate-qr-codes', advancedBooksController.generateQRCodes);
router.put('/books/:id/quantity', advancedBooksController.updateQuantity);
router.delete('/books/:id/copies/:copyId', advancedBooksController.deleteBookCopy);

// ============================================
// TRANSACTION ROUTES
// ============================================
router.get('/transactions', transactionsController.getTransactions);
router.get('/transactions/:id', transactionsController.getTransaction);
router.post('/transactions/issue', transactionsController.issueBook);
router.post('/transactions/return', transactionsController.returnBook);

// ============================================
// ATTENDANCE ROUTES
// ============================================
router.get('/attendance', adminController.getAttendance);

// ============================================
// PRINT JOBS ROUTES
// ============================================
router.get('/print-jobs', printController.getPrintJobs);
router.get('/print-jobs/:id', printController.getPrintJob);
router.put('/print-jobs/:id/approve', printController.approvePrintJob);
router.put('/print-jobs/:id/reject', printController.rejectPrintJob);
router.put('/print-jobs/:id/mark-printing', printController.markPrinting);
router.put('/print-jobs/:id/mark-ready', printController.markReady);
router.put('/print-jobs/:id/mark-collected', printController.markCollected);
router.delete('/print-jobs/:id', printController.deletePrintJob);
router.get('/print-stats', printController.getPrintStats);

// ============================================
// SUPPORT TICKETS ROUTES
// ============================================
router.get('/support/tickets', supportController.getSupportTickets);
router.get('/support/tickets/:id', supportController.getSupportTicket);
router.put('/support/tickets/:id/assign', supportController.assignTicket);
router.put('/support/tickets/:id/resolve', supportController.resolveTicket);
router.put('/support/tickets/:id/close', supportController.closeTicket);
router.put('/support/tickets/:id/reopen', supportController.reopenTicket);
router.put('/support/tickets/:id/priority', supportController.updatePriority);
router.get('/support/stats', supportController.getSupportStats);

// ============================================
// SETTINGS ROUTES
// ============================================
router.get('/settings', settingsController.getAllSettings);
router.get('/settings/:key', settingsController.getSetting);
router.put('/settings/:key', settingsController.updateSetting);
router.post('/settings/batch', settingsController.updateBatchSettings);
router.get('/settings/fine-rules', settingsController.getFineRules);
router.put('/settings/fine-rules', settingsController.updateFineRules);
router.get('/settings/library-info', settingsController.getLibraryInfo);

// ============================================
// REPORTS ROUTES
// ============================================
router.get('/reports/books-issued', reportsController.getBooksIssuedReport);
router.get('/reports/attendance', reportsController.getAttendanceReport);
router.get('/reports/fines', reportsController.getFinesReport);
router.get('/reports/print-jobs', reportsController.getPrintJobsReport);
router.get('/reports/users', reportsController.getUsersReport);
router.get('/reports/custom', reportsController.getCustomReport);

module.exports = router;
