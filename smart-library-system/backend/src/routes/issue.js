/**
 * Book Issue Routes
 * Librarian interface for scanning students and issuing books
 * Supports real-time validation and offline functionality
 */

const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/issueController');
const transactionsController = require('../controllers/transactionsController');
const { authenticateToken: verifyToken } = require('../middleware/auth');

/**
 * STEP 1: Scan Student QR & Initialize Session
 * POST /api/issue/start-session
 * Body: { qr_code, librarian_id }
 */
router.post('/start-session', IssueController.startSession);

/**
 * STEP 2: Scan Book & Real-Time Validation
 * POST /api/issue/scan-book
 * Body: { session_id, book_qr_code }
 */
router.post('/scan-book', IssueController.scanBook);

/**
 * STEP 3 & 4: Finalize & Bulk Issue
 * POST /api/issue/finalize
 * Body: { session_id, force_finalize }
 */
router.post('/finalize', IssueController.finalizeIssue);

/**
 * STEP 6: Undo Issuance (within 10 seconds)
 * POST /api/issue/undo
 * Body: { undo_id }
 */
router.post('/undo', IssueController.undoIssue);

/**
 * Get Session Status
 * GET /api/issue/session/:session_id
 */
router.get('/session/:session_id', IssueController.getSessionStatus);

// ============================================================
// TWO-STEP ISSUANCE FLOW (New Methods)
// ============================================================

/**
 * Create Issuance Request (Student scans book QR)
 * POST /api/issues/create-request
 * Body: { bookId, qrCode, bookTitle, bookIsbn, requestedAt }
 */
router.post('/create-request', IssueController.createIssuanceRequest);

/**
 * Get Pending Issuance Requests (Admin view)
 * GET /api/issues/pending-requests
 */
router.get('/pending-requests', IssueController.getPendingIssuanceRequests);

/**
 * Complete Issuance Request (Admin scans book QR)
 * POST /api/issues/complete-request
 * Body: { requestId, bookQrCode, completedAt }
 */
router.post('/complete-request', IssueController.completeIssuanceRequest);

/**
 * Cancel Issuance Request
 * POST /api/issues/cancel-request
 * Body: { requestId }
 */
router.post('/cancel-request', IssueController.cancelIssuanceRequest);

// ============================================================
// MOBILE APP ENDPOINTS (For PremiumDashboardScreen and other mobile screens)
// These provide student-facing endpoints for borrowing books
// ============================================================

/**
 * Get user's active borrowed books
 * GET /api/issues/active (or /api/issue/active)
 * Returns: { success, data: [...books], count }
 * Auth: Required
 */
router.get('/active', verifyToken, transactionsController.getActiveIssues);

/**
 * Get user's issue history
 * GET /api/issues/history (or /api/issue/history)
 * Query: limit=20, offset=0
 * Returns: { success, data: [...], pagination }
 * Auth: Required
 */
router.get('/history', verifyToken, transactionsController.getTransactionHistory);

/**
 * Get user's fines/overdue books
 * GET /api/issues/overdue (or /api/issue/overdue)
 * Returns: { success, data: [...overdue books], count }
 * Auth: Required
 */
router.get('/overdue', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { supabase } = require('../config/database');

    const { data, error } = await supabase
      .from('transactions')
      .select(
        `
        id,
        issued_date,
        due_date,
        fine_amount,
        book: book_id (
          id,
          title,
          isbn,
          cover_image_url,
          author
        )
      `
      )
      .eq('user_id', userId)
      .eq('transaction_type', 'issue')
      .eq('status', 'completed')
      .is('returned_date', null)
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      books: data || [],
      count: data?.length || 0,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * Get issue statistics
 * GET /api/issues/stats (or /api/issue/stats)
 * Returns: { success, stats: { totalBorrowed, overdueCount, totalFines } }
 * Auth: Required
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { supabase } = require('../config/database');

    // Get active issues count
    const { data: activeIssues, error: activeError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'issue')
      .eq('status', 'completed')
      .is('returned_date', null);

    // Get overdue count
    const { data: overdueIssues, error: overdueError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('transaction_type', 'issue')
      .eq('status', 'completed')
      .is('returned_date', null)
      .lt('due_date', new Date().toISOString());

    // Get total fines
    const { data: fines, error: finesError } = await supabase
      .from('fines')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (activeError || overdueError || finesError) throw new Error('Failed to fetch stats');

    const totalFines = fines?.reduce((sum, f) => sum + f.amount, 0) || 0;

    res.json({
      success: true,
      stats: {
        borrowedBooks: activeIssues?.length || 0,
        overdueBooks: overdueIssues?.length || 0,
        pendingFines: totalFines,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * Issue a book to current user
 * POST /api/issues/issue-book (or /api/issue/issue-book)
 * Body: { bookId, copyId?, dueDays? }
 * Returns: { success, data: { transaction, book, dueDate } }
 * Auth: Required
 */
router.post('/issue-book', verifyToken, transactionsController.issueBook);

/**
 * Return a borrowed book
 * POST /api/issues/return-book (or /api/issue/return-book)
 * Body: { transactionId, condition?, notes? }
 * Returns: { success, data: { transaction, fine, fineApplied } }
 * Auth: Required
 */
router.post('/return-book', verifyToken, transactionsController.returnBook);

/**
 * Batch return multiple books
 * POST /api/issues/batch-return (or /api/issue/batch-return)
 * Body: { transactionIds: [...], condition?, notes? }
 * Returns: { success, data: [...results] }
 * Auth: Required
 */
router.post('/batch-return', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionIds = [], condition = 'good', notes = '' } = req.body;
    const { supabase } = require('../config/database');

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'transactionIds array is required',
      });
    }

    const results = [];

    for (const transactionId of transactionIds) {
      try {
        // Return each book individually
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .eq('user_id', userId)
          .eq('transaction_type', 'issue')
          .is('returned_date', null)
          .single();

        if (transactionError || !transaction) {
          results.push({
            transactionId,
            success: false,
            message: 'Transaction not found',
          });
          continue;
        }

        // Calculate fine if overdue
        const returnDate = new Date();
        const dueDate = new Date(transaction.due_date);
        let fine = 0;

        if (returnDate > dueDate) {
          const daysOverdue = Math.ceil(
            (returnDate - dueDate) / (1000 * 60 * 60 * 24)
          );
          fine = daysOverdue * (parseFloat(process.env.DAILY_FINE_AMOUNT) || 10);
        }

        // Update transaction
        const { data: returnTransaction, error: updateError } = await supabase
          .from('transactions')
          .update({
            returned_date: returnDate.toISOString(),
            fine_amount: fine,
            returned_condition: condition,
            notes,
            status: 'completed',
          })
          .eq('id', transactionId)
          .select()
          .single();

        if (updateError) throw updateError;

        // Create fine record if applicable
        if (fine > 0) {
          await supabase.from('fines').insert({
            user_id: userId,
            transaction_id: transactionId,
            amount: fine,
            reason: `Book returned ${Math.ceil(
              (returnDate - dueDate) / (1000 * 60 * 60 * 24)
            )} days late`,
            status: 'pending',
          });
        }

        results.push({
          transactionId,
          success: true,
          message: 'Book returned',
          fine,
        });
      } catch (err) {
        results.push({
          transactionId,
          success: false,
          message: err.message,
        });
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * Bulk issue books
 * POST /api/issues/bulk-issue (or /api/issue/bulk-issue)
 * Body: { bookIds: [...], dueDays? }
 * Returns: { success, data: [...results] }
 * Auth: Required
 */
router.post('/bulk-issue', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookIds = [], dueDays = 14 } = req.body;
    const { supabase } = require('../config/database');

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'bookIds array is required',
      });
    }

    const results = [];

    for (const bookId of bookIds) {
      try {
        // Check if book is available
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('id, title, available_copies')
          .eq('id', bookId)
          .single();

        if (bookError || !bookData || bookData.available_copies <= 0) {
          results.push({
            bookId,
            success: false,
            message: 'Book not available',
          });
          continue;
        }

        // Check if user already has this book issued
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('book_id', bookId)
          .eq('transaction_type', 'issue')
          .eq('status', 'completed')
          .is('returned_date', null)
          .single();

        if (existingTransaction) {
          results.push({
            bookId,
            success: false,
            message: 'Already issued to you',
          });
          continue;
        }

        // Calculate due date
        const issuedDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);

        // Create transaction record
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            book_id: bookId,
            transaction_type: 'issue',
            issued_date: issuedDate.toISOString(),
            due_date: dueDate.toISOString(),
            status: 'completed',
          })
          .select()
          .single();

        if (transactionError) throw transactionError;

        results.push({
          bookId,
          success: true,
          message: 'Book issued',
          dueDate: dueDate.toISOString(),
        });
      } catch (err) {
        results.push({
          bookId,
          success: false,
          message: err.message,
        });
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
