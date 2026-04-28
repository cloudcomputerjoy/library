/**
 * Book Return Routes
 * API endpoints for book return process
 * 
 * POST   /api/return/start-session     - Initialize return session (scan student)
 * POST   /api/return/scan-book         - Scan book to return (real-time validation)
 * POST   /api/return/finalize          - Process returns (atomic transaction)
 * POST   /api/return/undo              - Undo return within 10 seconds
 * GET    /api/return/session/:session_id - Get session status
 */

const express = require('express');
const router = express.Router();
const ReturnController = require('../controllers/returnController');

/**
 * POST /start-session
 * Start a new return session by scanning student QR
 * 
 * Request:
 * {
 *   "qr_code": "USER-12345",
 *   "librarian_id": "admin-001"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "session": {
 *     "session_id": "return_123...",
 *     "student_name": "Joy Kumar",
 *     "issued_books_count": 5,
 *     "issued_books": [...],
 *     "session_expires": "2026-04-11T10:45:30Z"
 *   }
 * }
 */
router.post('/start-session', ReturnController.startSession);

/**
 * POST /scan-book
 * Scan a book QR code for return - Real-time validation
 * 
 * Request:
 * {
 *   "session_id": "return_123...",
 *   "book_qr_code": "BOOK-001"
 * }
 * 
 * Response (Accepted):
 * {
 *   "success": true,
 *   "validation_status": "accepted",
 *   "book": {
 *     "id": "issue_123...",
 *     "book_id": "BOOK-001",
 *     "title": "Physics Fundamentals",
 *     "isbn": "978-0-123456-78-9",
 *     "issue_date": "2026-03-20",
 *     "due_date": "2026-04-03",
 *     "is_overdue": true,
 *     "days_overdue": 8,
 *     "fine_amount": 80
 *   },
 *   "warning": "⚠️ Overdue by 8 days (Fine: ₹80)"
 * }
 * 
 * Response (Rejected):
 * {
 *   "success": false,
 *   "validation_status": "rejected",
 *   "message": "Book not found or not issued to this student"
 * }
 */
router.post('/scan-book', ReturnController.scanBook);

/**
 * POST /finalize
 * Finalize book returns - Atomic transaction
 * 
 * Request:
 * {
 *   "session_id": "return_123...",
 *   "force_finalize": false
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "result": {
 *     "books_returned": [...],
 *     "total_fine": 80,
 *     "undo_id": "undo_123...",
 *     "undo_expires": "2026-04-11T10:45:40Z"
 *   }
 * }
 */
router.post('/finalize', ReturnController.finalizeReturn);

/**
 * POST /undo
 * Undo book return within 10 second window
 * 
 * Request:
 * {
 *   "undo_id": "undo_123..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "✓ 2 books have been restored to issued status",
 *   "restored_count": 2
 * }
 */
router.post('/undo', ReturnController.undoReturn);

/**
 * GET /session/:session_id
 * Get current return session status
 * 
 * Response:
 * {
 *   "success": true,
 *   "session": {
 *     "session_id": "return_123...",
 *     "session_type": "return",
 *     "status": "active",
 *     "scanned_books_count": 2,
 *     "scanned_books": [...]
 *   }
 * }
 */
router.get('/session/:session_id', ReturnController.getSessionStatus);

module.exports = router;
