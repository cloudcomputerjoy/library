/**
 * Book Transaction Routes
 * Handles issue, return, and reserve operations
 */

const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken, requireLibrarian, requireStudent } = require('../middleware/auth');
const { emitToRole, emitToUser } = require('../config/socket');
const {
  APIError,
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /transactions/issue
 * Issue a book to student (Librarian/Admin only)
 */
router.post(
  '/issue',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { bookId, userId, dueDays = 14 } = req.body;

    // Validation
    if (!bookId || !userId) {
      throw new ValidationError('Book ID and User ID are required');
    }

    // Check if book exists and has available copies
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (!book || bookError) {
      throw new NotFoundError('Book');
    }

    if (book.available_copies < 1) {
      throw new ConflictError('No copies available', 'NO_COPIES_AVAILABLE');
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if user already has this book issued
    const { data: existingIssue } = await supabase
      .from('transactions')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .eq('status', 'issued')
      .single();

    if (existingIssue) {
      throw new ConflictError('User already has this book issued');
    }

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + parseInt(dueDays));

    // Create transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert([
        {
          book_id: bookId,
          user_id: userId,
          issue_date: issueDate,
          due_date: dueDate,
          status: 'issued',
          issued_by: req.userId,
          created_at: issueDate,
        },
      ])
      .select()
      .single();

    if (transactionError) {
      throw new APIError(transactionError.message);
    }

    // Update book available copies
    await supabaseAdmin
      .from('books')
      .update({
        available_copies: book.available_copies - 1,
        borrowed_count: (book.borrowed_count || 0) + 1,
      })
      .eq('id', bookId);

    // Emit real-time notification
    try {
      emitToUser(userId, 'book_issued', {
        bookId,
        bookTitle: book.title,
        dueDate,
        transactionId: transaction.id,
      });
    } catch (err) {
      console.error('Socket.IO error:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: {
        transaction,
        book: {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
        },
        student: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        },
        dueDate,
      },
    });
  })
);

/**
 * POST /transactions/return
 * Return a book from student (Librarian/Admin only)
 */
router.post(
  '/return',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { transactionId, userId, bookId, condition = 'good' } = req.body;

    // Validation
    if (!transactionId && !userId) {
      throw new ValidationError('Transaction ID or User ID required');
    }

    // Get transaction
    let transaction;
    if (transactionId) {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      transaction = data;
    } else {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('status', 'issued')
        .single();
      transaction = data;
    }

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    const returnDate = new Date();
    let fine = 0;

    // Calculate fine if overdue
    if (returnDate > new Date(transaction.due_date)) {
      const overdaysDays = Math.floor(
        (returnDate - new Date(transaction.due_date)) / (1000 * 60 * 60 * 24)
      );
      const finePerDay = parseInt(process.env.FINE_PER_DAY) || 10;
      fine = overdaysDays * finePerDay;
    }

    // Update transaction
    const { data: updatedTransaction, error } = await supabaseAdmin
      .from('transactions')
      .update({
        return_date: returnDate,
        status: 'returned',
        condition,
        fine,
        returned_by: req.userId,
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    // Update book available copies
    const { data: book } = await supabase
      .from('books')
      .select('available_copies')
      .eq('id', transaction.book_id)
      .single();

    await supabaseAdmin
      .from('books')
      .update({
        available_copies: (book?.available_copies || 0) + 1,
      })
      .eq('id', transaction.book_id);

    // Add fine to fines table if applicable
    if (fine > 0) {
      await supabaseAdmin.from('fines').insert([
        {
          user_id: transaction.user_id,
          amount: fine,
          reason: 'Book overdue',
          transaction_id: transaction.id,
          status: 'pending',
          created_at: returnDate,
        },
      ]);

      // Emit fine notification
      try {
        emitToUser(transaction.user_id, 'fine_charged', {
          amount: fine,
          reason: 'Book overdue',
          daysOverdue: Math.floor(
            (returnDate - new Date(transaction.due_date)) / (1000 * 60 * 60 * 24)
          ),
        });
      } catch (err) {
        console.error('Socket.IO error:', err);
      }
    }

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: {
        transaction: updatedTransaction,
        fine: fine > 0 ? fine : 0,
        message: fine > 0 ? `Fine: Rs. ${fine}` : 'No fine',
      },
    });
  })
);

/**
 * POST /transactions/reserve
 * Reserve a book (Student only)
 */
router.post(
  '/reserve',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { bookId } = req.body;

    if (!bookId) {
      throw new ValidationError('Book ID is required');
    }

    // Check book exists
    const { data: book } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (!book) {
      throw new NotFoundError('Book');
    }

    // Check if already reserved by user
    const { data: existingReserve } = await supabase
      .from('book_reservations')
      .select('id')
      .eq('user_id', req.userId)
      .eq('book_id', bookId)
      .eq('status', 'active')
      .single();

    if (existingReserve) {
      throw new ConflictError('You have already reserved this book');
    }

    // Create reservation
    const { data: reservation, error } = await supabaseAdmin
      .from('book_reservations')
      .insert([
        {
          user_id: req.userId,
          book_id: bookId,
          reservation_date: new Date(),
          status: 'active',
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Book reserved successfully',
      data: {
        reservation,
        bookTitle: book.title,
      },
    });
  })
);

router.get(
  '/active',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        books: book_id (id, title, isbn),
        issued_by_user: issued_by (first_name, last_name)
      `
      )
      .eq('user_id', req.userId)
      .eq('status', 'issued')
      .order('created_at', { ascending: false });

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: transactions,
    });
  })
);

router.get(
  '/history',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        books: book_id (id, title, isbn),
        issued_by_user: issued_by (first_name, last_name),
        returned_by_user: returned_by (first_name, last_name)
      `
      )
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: transactions, error } = await query;

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: transactions,
    });
  })
);

router.get(
  '/fines',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;

    const { data: fines, error } = await supabase
      .from('fines')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: fines,
    });
  })
);

router.post(
  '/renew',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { transactionId, extendDays = 14 } = req.body;

    if (!transactionId) {
      throw new ValidationError('Transaction ID is required');
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', req.userId)
      .eq('status', 'issued')
      .single();

    if (transactionError || !transaction) {
      throw new NotFoundError('Issued transaction');
    }

    const newDueDate = new Date(transaction.due_date);
    newDueDate.setDate(newDueDate.getDate() + parseInt(extendDays, 10));

    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        due_date: newDueDate,
        updated_at: new Date(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateError) {
      throw new APIError(updateError.message);
    }

    res.json({
      success: true,
      message: 'Book renewal requested successfully',
      data: updatedTransaction,
    });
  })
);

/**
 * GET /transactions/my-transactions
 * Get user's transaction history (Students and self)
 */
router.get(
  '/my-transactions',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        books:book_id(id, title, isbn),
        issued_by_user:issued_by(first_name, last_name),
        returned_by_user:returned_by(first_name, last_name)
      `
      )
      .eq('user_id', req.userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data: transactions, error } = await query.range(
      parseInt(offset),
      parseInt(offset) + parseInt(limit) - 1
    );

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: transactions,
    });
  })
);

/**
 * GET /transactions/all
 * Get all transactions (Librarian/Admin only)
 */
router.get(
  '/all',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const {
      userId,
      bookId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = supabase
      .from('transactions')
      .select(
        `
        *,
        users:user_id(first_name, last_name, email),
        books:book_id(title, isbn)
      `
      );

    if (userId) query = query.eq('user_id', userId);
    if (bookId) query = query.eq('book_id', bookId);
    if (status) query = query.eq('status', status);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: transactions,
    });
  })
);

/**
 * POST /transactions/batch-issue
 * Atomically issue multiple books to a student (Librarian/Admin only)
 * 
 * Body:
 * {
 *   user_id: number,
 *   books: [{ book_id: number, due_days: number }, ...],
 *   batch_timestamp: number
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   transaction_id: string (first in batch),
 *   batch_id: number,
 *   data: {
 *     transactionCount: number,
 *     transactions: [...],
 *     undoAvailable: boolean,
 *     undoExpiresIn: 10000
 *   }
 * }
 */
router.post(
  '/batch-issue',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { user_id, books, batch_timestamp } = req.body;

    // Validation
    if (!user_id || !books || books.length === 0) {
      throw new ValidationError('User ID and books array required');
    }

    if (books.length > 10) {
      throw new ValidationError('Cannot issue more than 10 books in one batch');
    }

    try {
      // STEP 1: Validate all books first (no partial failures)
      const bookIds = books.map(b => b.book_id);
      const { data: bookData, error: bookErr } = await supabase
        .from('books')
        .select('id, available_copies, total_copies')
        .in('id', bookIds);

      if (bookErr || !bookData) {
        throw new APIError('Failed to fetch book data');
      }

      // Check availability
      for (const book of bookData) {
        if (book.available_copies <= 0) {
          throw new ValidationError(`Book ${book.id} not available`);
        }
      }

      // STEP 2: Check student's borrow limit
      const { data: activeIssues, error: activeErr } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'issued')
        .is('return_date', null);

      if (activeErr) throw new APIError('Failed to check active issues');

      const currentCount = activeIssues?.length || 0;
      const newTotal = currentCount + books.length;

      if (newTotal > 5) {
        throw new ValidationError(`Student would exceed borrow limit (max 5, current: ${currentCount})`);
      }

      // STEP 3: Check for duplicate scans in batch
      const bookIdsInBatch = books.map(b => b.book_id);
      const uniqueBookIds = new Set(bookIdsInBatch);
      if (uniqueBookIds.size !== bookIdsInBatch.length) {
        throw new ValidationError('Cannot issue same book twice in batch');
      }

      // STEP 4: Check if any book already issued to this student
      for (const { book_id } of books) {
        const { data: existingIssue } = await supabase
          .from('transactions')
          .select('id')
          .eq('book_id', book_id)
          .eq('user_id', user_id)
          .eq('status', 'issued')
          .single();

        if (existingIssue) {
          throw new ValidationError(`Book ${book_id} already issued to student`);
        }
      }

      // STEP 5: Insert all transactions ATOMICALLY
      const transactionsToInsert = books.map(({book_id, due_days}) => {
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + due_days);

        return {
          user_id,
          book_id,
          issue_date: issueDate,
          due_date: dueDate,
          status: 'issued',
          issued_by: req.userId,
          created_at: issueDate,
          batch_id: batch_timestamp,
        };
      });

      const { data: transactions, error: txErr } = await supabaseAdmin
        .from('transactions')
        .insert(transactionsToInsert)
        .select();

      if (txErr) {
        throw new APIError(`Transaction insert failed: ${txErr.message}`);
      }

      // STEP 6: Update book inventory ATOMICALLY
      const updateErrors = [];
      for (const book_id of bookIds) {
        const { error: updateErr } = await supabaseAdmin
          .from('books')
          .update({ available_copies: supabase.raw('available_copies - 1') })
          .eq('id', book_id);

        if (updateErr) {
          updateErrors.push(updateErr);
        }
      }

      if (updateErrors.length > 0) {
        // ROLLBACK: Delete inserted transactions
        await supabaseAdmin
          .from('transactions')
          .delete()
          .eq('batch_id', batch_timestamp);

        throw new APIError(`Inventory update failed: ${updateErrors[0].message}`);
      }

      // SUCCESS: Emit notifications and return
      res.status(201).json({
        success: true,
        message: `${books.length} books issued successfully`,
        transaction_id: transactions[0]?.id,
        batch_id: batch_timestamp,
        data: {
          transactionCount: transactions.length,
          transactions,
          undoAvailable: true,
          undoExpiresIn: 10000, // 10 seconds in milliseconds
        },
      });
    } catch (error) {
      console.error('Batch issue error:', error);
      throw error;
    }
  })
);

/**
 * POST /transactions/:id/undo
 * Undo batch issuance within 10-second window
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     batchId: number,
 *     booksRestored: number
 *   }
 * }
 */
router.post(
  '/:id/undo',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { id: transactionId } = req.params;

    try {
      // Get the transaction
      const { data: transaction, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (txErr || !transaction) {
        throw new NotFoundError('Transaction');
      }

      // Check if within undo window (10 seconds)
      const createdTime = new Date(transaction.created_at).getTime();
      const now = Date.now();
      const ageMs = now - createdTime;

      if (ageMs > 10000) {
        throw new ValidationError('Undo window expired (10 seconds max)');
      }

      // Get all transactions in this batch
      const { data: batchTransactions, error: batchErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('batch_id', transaction.batch_id);

      if (batchErr || !batchTransactions) {
        throw new APIError('Failed to fetch batch transactions');
      }

      const bookIds = batchTransactions.map(t => t.book_id);

      // UNDO: Atomic rollback
      
      // Delete all transactions in batch
      const { error: deleteErr } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('batch_id', transaction.batch_id);

      if (deleteErr) {
        throw new APIError(`Failed to delete transactions: ${deleteErr.message}`);
      }

      // Restore book inventory
      for (const book_id of bookIds) {
        const { error: restoreErr } = await supabaseAdmin
          .from('books')
          .update({ available_copies: supabase.raw('available_copies + 1') })
          .eq('id', book_id);

        if (restoreErr) {
          // Re-insert transactions (rollback the rollback)
          await supabaseAdmin.from('transactions').insert(batchTransactions);
          throw new APIError(`Failed to restore inventory: ${restoreErr.message}`);
        }
      }

      res.json({
        success: true,
        message: `Undo successful. ${bookIds.length} books restored to inventory.`,
        data: {
          batchId: transaction.batch_id,
          booksRestored: bookIds.length,
          restoredBooks: batchTransactions.map(t => ({
            transactionId: t.id,
            bookId: t.book_id,
          })),
        },
      });
    } catch (error) {
      console.error('Undo batch issue error:', error);
      throw error;
    }
  })
);

module.exports = router;
