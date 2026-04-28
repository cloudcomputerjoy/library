// Advanced Book Management Routes
// QR Code & ISBN scanning routes for admin book management

const express = require('express');
const {
  addBook,
  getBooks,
  getBook,
  searchByQRCode,
  updateBook,
  updateQuantity,
  deleteBook,
  generateQRCodes,
  deleteBookCopy
} = require('../controllers/advancedBooksController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Middleware: All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// BOOK MANAGEMENT ROUTES
// ============================================

/**
 * POST /api/admin/books/add
 * Add new book with multiple QR-coded copies
 */
router.post('/add', addBook);

/**
 * GET /api/admin/books
 * Get all books with pagination and filtering
 */
router.get('/', getBooks);

/**
 * GET /api/admin/books/:id
 * Get single book with all copies
 */
router.get('/:id', getBook);

/**
 * POST /api/admin/books/search-qr
 * Find book by scanning QR code
 */
router.post('/search-qr', searchByQRCode);

/**
 * PUT /api/admin/books/:id
 * Update book details
 */
router.put('/:id', updateBook);

/**
 * PUT /api/admin/books/:id/quantity
 * Add or remove book copies
 */
router.put('/:id/quantity', updateQuantity);

/**
 * DELETE /api/admin/books/:id
 * Delete book and all copies
 */
router.delete('/:id', deleteBook);

/**
 * DELETE /api/admin/books/:id/copies/:copyId
 * Delete single book copy
 */
router.delete('/:id/copies/:copyId', deleteBookCopy);

/**
 * POST /api/admin/books/generate-qr-codes
 * Generate batch QR codes for printing
 */
router.post('/generate-qr-codes', generateQRCodes);

module.exports = router;
