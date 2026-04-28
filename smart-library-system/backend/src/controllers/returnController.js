/**
 * Book Return Controller
 * Handles the complete book return workflow with validation and atomic transactions
 * 
 * Flow:
 * STEP 1: Scan student QR → Validate student & get issued books
 * STEP 2: Scan book QR → Real-time validation & duplicate check
 * STEP 3: Calculate fines if overdue
 * STEP 4: Finalize returns → Atomic transaction
 * STEP 5: Show results & fine details
 * STEP 6: Undo returns within 10 seconds
 */

const { supabase } = require('../config/supabaseClient');
const axios = require('axios');
const fcmService = require('../services/fcmService');
const { sendFirebaseNotification, sendReturnEmailNotification } = require('../services/returnNotificationService');

class ReturnController {
  /**
   * STEP 1: Start Return Session
   * Validate student exists and get their issued books
   */
  static async startSession(req, res) {
    try {
      const { qr_code, librarian_id } = req.body;

      if (!qr_code || !librarian_id) {
        return res.status(400).json({
          success: false,
          message: 'QR code and librarian ID required'
        });
      }

      // Extract student ID from QR (format: USER-12345)
      const studentId = qr_code.split('-')[1] || qr_code;

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id, name, email, account_status')
        .eq('id', `USER-${studentId}`)
        .single();

      if (studentError || !student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      if (student.account_status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Account is ${student.account_status}`
        });
      }

      // Get all issued books for this student
      const { data: issuedBooks, error: booksError } = await supabase
        .from('issued_books')
        .select(`
          id,
          book_id,
          issue_date,
          due_date,
          books (
            id,
            title,
            isbn,
            available_copies,
            total_copies
          )
        `)
        .eq('user_id', student.id)
        .eq('status', 'active');

      if (booksError) throw booksError;

      // Create return session
      const sessionId = `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionExpires = new Date(Date.now() + 60 * 1000);

      const { error: sessionError } = await supabase
        .from('issue_sessions')
        .insert({
          session_id: sessionId,
          user_id: student.id,
          librarian_id: librarian_id,
          session_type: 'return',
          scanned_books: [],
          session_expires: sessionExpires.toISOString(),
          status: 'active'
        });

      if (sessionError) throw sessionError;

      return res.status(200).json({
        success: true,
        session: {
          session_id: sessionId,
          student_id: student.id,
          student_name: student.name,
          student_email: student.email,
          issued_books_count: issuedBooks.length,
          issued_books: issuedBooks.map(ib => ({
            id: ib.id,
            book_id: ib.book_id,
            title: ib.books?.title,
            isbn: ib.books?.isbn,
            issue_date: ib.issue_date,
            due_date: ib.due_date,
            is_overdue: new Date(ib.due_date) < new Date()
          })),
          session_expires: sessionExpires.toISOString()
        }
      });
    } catch (err) {
      console.error('Start session error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to start return session'
      });
    }
  }

  /**
   * STEP 2: Scan Return Book
   * Validate book is issued to this student and not duplicate in session
   */
  static async scanBook(req, res) {
    try {
      const { session_id, book_qr_code } = req.body;

      if (!session_id || !book_qr_code) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and book QR code required'
        });
      }

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Extract book ID from QR
      const bookId = book_qr_code.split('-')[1] || book_qr_code;

      // Check if book is issued to this student
      const { data: issuedBook, error: issueError } = await supabase
        .from('issued_books')
        .select(`
          id,
          issue_date,
          due_date,
          books (
            id,
            title,
            isbn,
            available_copies,
            total_copies,
            status
          )
        `)
        .eq('user_id', session.user_id)
        .eq('book_id', `BOOK-${bookId}`)
        .eq('status', 'active')
        .single();

      if (issueError || !issuedBook) {
        return res.status(400).json({
          success: false,
          validation_status: 'rejected',
          message: 'Book not found or not issued to this student'
        });
      }

      // Check if already scanned in this session
      const scannedBooks = session.scanned_books || [];
      if (scannedBooks.some(b => b.book_id === issuedBook.book_id)) {
        return res.status(400).json({
          success: false,
          validation_status: 'rejected',
          message: 'Book already scanned in this return session'
        });
      }

      // Check if overdue and calculate fine
      const dueDate = new Date(issuedBook.due_date);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      const fineAmount = daysOverdue > 0 ? daysOverdue * 10 : 0; // ₹10 per day

      const bookData = {
        id: issuedBook.id,
        book_id: issuedBook.books.id,
        title: issuedBook.books.title,
        isbn: issuedBook.books.isbn,
        issue_date: issuedBook.issue_date,
        due_date: issuedBook.due_date,
        is_overdue: daysOverdue > 0,
        days_overdue: daysOverdue,
        fine_amount: fineAmount,
        scanned_time: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        validation_status: 'accepted',
        book: bookData,
        warning: daysOverdue > 0 ? `⚠️ Overdue by ${daysOverdue} days (Fine: ₹${fineAmount})` : null
      });
    } catch (err) {
      console.error('Scan book error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to scan book'
      });
    }
  }

  /**
   * STEP 3-4: Finalize Return & Process Atomically
   * Update issued book status, restore stock, create fine if needed
   */
  static async finalizeReturn(req, res) {
    try {
      const { session_id, force_finalize } = req.body;

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'Session ID required'
        });
      }

      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (session.session_type !== 'return') {
        return res.status(400).json({
          success: false,
          message: 'This is not a return session'
        });
      }

      const scannedBooks = session.scanned_books || [];
      if (scannedBooks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No books scanned in this session'
        });
      }

      // BEGIN ATOMIC TRANSACTION
      const { data: transactionResult, error: rpcError } = await supabase.rpc(
        'process_book_returns',
        {
          p_session_id: session_id,
          p_user_id: session.user_id,
          p_librarian_id: session.librarian_id,
          p_scanned_books: JSON.stringify(scannedBooks)
        }
      );

      if (rpcError) {
        console.error('Transaction error:', rpcError);
        return res.status(400).json({
          success: false,
          message: rpcError.message || 'Failed to process returns'
        });
      }

      // Update session status
      const { error: updateError } = await supabase
        .from('issue_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('session_id', session_id);

      if (updateError) throw updateError;

      // Generate undo token (valid for 10 seconds)
      const undoId = `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const undoExpires = new Date(Date.now() + 10 * 1000);

      const { error: undoError } = await supabase
        .from('return_undo')
        .insert({
          undo_id: undoId,
          session_id: session_id,
          user_id: session.user_id,
          books_returned: scannedBooks,
          undo_expires: undoExpires.toISOString(),
          status: 'active'
        });

      if (undoError) throw undoError;

      // Send notifications (Firebase + Email)
      const totalFine = scannedBooks.reduce((sum, b) => sum + (b.fine_amount || 0), 0);
      const bookTitles = scannedBooks.map(b => b.title).join(', ');
      
      // Firebase notification
      try {
        let notificationBody = `${scannedBooks.length} book(s) returned successfully`;
        if (totalFine > 0) {
          notificationBody += ` (Fine: ₹${totalFine})`;
        }

        await fcmService.sendNotificationToUser(
          session.user_id,
          {
            title: '✅ Books Returned',
            body: notificationBody
          },
          {
            type: 'book_returned',
            count: scannedBooks.length.toString(),
            books: bookTitles,
            fine_amount: totalFine.toString(),
            session_id: session_id
          }
        );
        console.log(`✅ Firebase notification sent to user ${session.user_id}`);
      } catch (fcmError) {
        console.error('⚠️ Firebase notification error:', fcmError.message);
      }

      // Email notification
      try {
        await sendReturnEmailNotification(
          session.student_email,
          session.student_name,
          {
            booksCount: scannedBooks.length,
            totalFine: totalFine,
            books: scannedBooks,
            returnedAt: new Date().toISOString()
          }
        );
        console.log(`✅ Email notification sent to ${session.student_email}`);
      } catch (emailError) {
        console.error('⚠️ Email notification error:', emailError.message);
        // Continue even if email fails
      }

      return res.status(200).json({
        success: true,
        result: {
          books_returned: scannedBooks,
          total_fine: scannedBooks.reduce((sum, b) => sum + (b.fine_amount || 0), 0),
          undo_id: undoId,
          undo_expires: undoExpires.toISOString()
        }
      });
    } catch (err) {
      console.error('Finalize error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to finalize returns'
      });
    }
  }

  /**
   * STEP 6: Undo Book Return
   * Restore books to issued status within 10 second window
   */
  static async undoReturn(req, res) {
    try {
      const { undo_id } = req.body;

      if (!undo_id) {
        return res.status(400).json({
          success: false,
          message: 'Undo ID required'
        });
      }

      // Get undo record
      const { data: undoRecord, error: undoError } = await supabase
        .from('return_undo')
        .select('*')
        .eq('undo_id', undo_id)
        .eq('status', 'active')
        .single();

      if (undoError || !undoRecord) {
        return res.status(404).json({
          success: false,
          message: 'Undo record not found or expired'
        });
      }

      // Check if undo window expired
      if (new Date(undoRecord.undo_expires) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Undo window has expired'
        });
      }

      const booksReturned = undoRecord.books_returned || [];

      // Restore each book to issued status
      for (const book of booksReturned) {
        const { error: restoreError } = await supabase
          .from('issued_books')
          .update({
            status: 'active',
            returned_date: null
          })
          .eq('id', book.id);

        if (restoreError) throw restoreError;

        // Restore book stock
        const { error: stockError } = await supabase
          .from('books')
          .update({
            available_copies: supabase.rpc('increment', { x: 1 })
          })
          .eq('id', book.book_id);

        if (stockError) throw stockError;

        // Remove any fines created
        const { error: fineError } = await supabase
          .from('fines')
          .update({ status: 'cancelled' })
          .eq('issued_book_id', book.id)
          .eq('status', 'pending');

        if (fineError) throw fineError;
      }

      // Mark undo as used
      const { error: markError } = await supabase
        .from('return_undo')
        .update({ status: 'used' })
        .eq('undo_id', undo_id);

      if (markError) throw markError;

      // Log audit
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'return_undo',
          user_id: undoRecord.user_id,
          librarian_id: undoRecord.librarian_id,
          details: {
            session_id: undoRecord.session_id,
            books_count: booksReturned.length,
            undo_id: undo_id
          }
        });

      if (auditError) console.error('Audit log error:', auditError);

      return res.status(200).json({
        success: true,
        message: `✓ ${booksReturned.length} books have been restored to issued status`,
        restored_count: booksReturned.length
      });
    } catch (err) {
      console.error('Undo error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to undo returns'
      });
    }
  }

  /**
   * Get Return Session Status
   */
  static async getSessionStatus(req, res) {
    try {
      const { session_id } = req.params;

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'Session ID required'
        });
      }

      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .single();

      if (sessionError || !session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      return res.status(200).json({
        success: true,
        session: {
          session_id: session.session_id,
          session_type: session.session_type,
          status: session.status,
          scanned_books_count: (session.scanned_books || []).length,
          scanned_books: session.scanned_books,
          created_at: session.created_at,
          completed_at: session.completed_at
        }
      });
    } catch (err) {
      console.error('Get session error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to get session status'
      });
    }
  }
}

module.exports = ReturnController;
