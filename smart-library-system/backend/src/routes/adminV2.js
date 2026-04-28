const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const adminBooksController = require('../controllers/adminBooksController');
const adminTransactionsController = require('../controllers/adminTransactionsController');

// Middleware: All admin routes require authentication
router.use(authenticateToken);
router.use(requireRole(['admin', 'librarian']));

// ============== DASHBOARD ==============
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/live-feed', adminController.getLiveFeed);
router.get('/dashboard/analytics', adminController.getAnalytics);

// ============== USER MANAGEMENT ==============
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/bulk-import', adminController.bulkImportUsers);

// ============== BOOK MANAGEMENT ==============
router.get('/books', adminBooksController.getAllBooks);
router.post('/books', adminBooksController.createBook);
router.put('/books/:id', adminBooksController.updateBook);
router.delete('/books/:id', adminBooksController.deleteBook);

// Book Copies Management
router.get('/books/:bookId/copies', adminBooksController.getBookCopies);
router.post('/books/:bookId/copies', adminBooksController.addBookCopy);
router.put('/copies/:copyId/status', adminBooksController.updateBookCopyStatus);
router.delete('/copies/:copyId', adminBooksController.deleteBookCopy);

// ============== TRANSACTIONS ==============
router.post('/transactions/issue', adminTransactionsController.issueBook);
router.post('/transactions/return', adminTransactionsController.returnBook);
router.get('/transactions', adminTransactionsController.getTransactions);

// ============== FINES ==============
router.post('/fines/calculate', adminTransactionsController.calculateFines);
router.get('/fines', adminTransactionsController.getFines);
router.put('/fines/:fineId/pay', adminTransactionsController.markFinePaid);

// ============== SETTINGS ==============
router.get('/settings/institution-domains', adminController.getInstitutionDomains);
router.post('/settings/institution-domains', adminController.setInstitutionDomains);
router.put('/settings/institution-domains', adminController.updateInstitutionDomains);
router.delete('/settings/institution-domains/:domain', adminController.deleteInstitutionDomain);

module.exports = router;
