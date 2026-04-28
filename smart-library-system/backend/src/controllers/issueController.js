/**
 * Book Issuance Controller
 * Handles student QR scanning, book scanning, and bulk issuance transactions
 * with real-time validation and offline support
 */

const { supabase } = require('../config/supabaseAuth');
const fcmService = require('../services/fcmService');
const issueNotificationService = require('../services/issueNotificationService');

class IssueController {
  /**
   * STEP 1: Scan Student QR & Initialize Session
   * POST /api/issue/start-session
   * Body: { qr_code, librarian_id }
   */
  static async startSession(req, res) {
    try {
      const { qr_code, librarian_id } = req.body;

      if (!qr_code) {
        return res.status(400).json({
          success: false,
          message: 'QR code is required'
        });
      }

      // Extract user ID from QR code (format: USER-{id})
      const userId = qr_code.replace('USER-', '');

      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id, name, email, account_status, total_books_issued, max_borrow_limit')
        .eq('id', userId)
        .eq('role', 'student')
        .single();

      if (studentError || !student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or QR invalid',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Check if account is active
      if (student.account_status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Account is ${student.account_status}`,
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Fetch outstanding fines
      const { data: fines } = await supabase
        .from('fines')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gt('remaining_amount', 0);

      const totalFines = fines ? fines.reduce((sum, f) => sum + f.remaining_amount, 0) : 0;

      // Fetch currently issued books count
      const { data: issuedBooks } = await supabase
        .from('issued_books')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      const currentBooksIssued = issuedBooks ? issuedBooks.length : 0;
      const canBorrow = (student.max_borrow_limit || 5) - currentBooksIssued;

      // Validate borrow eligibility
      if (totalFines > 0) {
        return res.status(403).json({
          success: false,
          message: `Cannot borrow. Outstanding fine: ₹${totalFines}`,
          code: 'PENDING_FINES',
          fine_amount: totalFines
        });
      }

      if (canBorrow <= 0) {
        return res.status(403).json({
          success: false,
          message: `Borrow limit reached. Already issued: ${currentBooksIssued}`,
          code: 'BORROW_LIMIT_EXCEEDED',
          current_issued: currentBooksIssued,
          max_limit: student.max_borrow_limit
        });
      }

      // Create session
      const sessionData = {
        session_id: `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        librarian_id: librarian_id,
        student_name: student.name,
        student_email: student.email,
        session_start: new Date().toISOString(),
        session_expires: new Date(Date.now() + 60000).toISOString(), // 60 seconds
        scanned_books: [],
        total_pending_fines: totalFines,
        books_already_issued: currentBooksIssued,
        can_borrow: canBorrow,
        max_borrow_limit: student.max_borrow_limit || 5,
        status: 'active'
      };

      // Store session in memory or cache (using Supabase for persistence)
      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .insert([sessionData])
        .select();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create session'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Session started successfully',
        session: {
          session_id: sessionData.session_id,
          student_name: student.name,
          student_email: student.email,
          can_borrow: canBorrow,
          books_already_issued: currentBooksIssued,
          max_borrow_limit: student.max_borrow_limit,
          session_expires: sessionData.session_expires,
          pending_fines: totalFines
        }
      });

    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({
        success: false,
        message: 'Session initialization failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * STEP 2: Scan Book QR & Validate in Real-Time
   * POST /api/issue/scan-book
   * Body: { session_id, book_qr_code }
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

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .eq('status', 'active')
        .single();

      if (sessionError || !session) {
        return res.status(400).json({
          success: false,
          message: 'Session not found or expired',
          code: 'SESSION_EXPIRED'
        });
      }

      // Check if session expired
      if (new Date(session.session_expires) < new Date()) {
        // Mark session as expired
        await supabase
          .from('issue_sessions')
          .update({ status: 'expired' })
          .eq('session_id', session_id);

        return res.status(400).json({
          success: false,
          message: 'Session expired',
          code: 'SESSION_EXPIRED'
        });
      }

      // Extract book ID from QR code (format: BOOK-{id})
      const bookId = book_qr_code.replace('BOOK-', '');

      // Check for duplicate scan
      if (session.scanned_books.some(b => b.book_id === bookId)) {
        return res.status(400).json({
          success: false,
          message: 'Book already scanned in this session',
          code: 'DUPLICATE_SCAN',
          validation_status: 'rejected'
        });
      }

      // Check if can borrow more
      if (session.scanned_books.length >= session.can_borrow) {
        return res.status(400).json({
          success: false,
          message: `Borrow limit reached. Already scanning: ${session.scanned_books.length}`,
          code: 'BORROW_LIMIT_EXCEEDED',
          validation_status: 'rejected'
        });
      }

      // Fetch book details
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, title, isbn, available_copies, total_copies, status')
        .eq('id', bookId)
        .single();

      if (bookError || !book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
          code: 'BOOK_NOT_FOUND',
          validation_status: 'rejected'
        });
      }

      // Validate book availability
      if (book.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Book not available',
          code: 'OUT_OF_STOCK',
          validation_status: 'rejected',
          book: { id: book.id, title: book.title }
        });
      }

      if (book.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Book is ${book.status}`,
          code: 'BOOK_INACTIVE',
          validation_status: 'rejected'
        });
      }

      // Check if already issued to this student
      const { data: existingIssue } = await supabase
        .from('issued_books')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('book_id', bookId)
        .eq('status', 'active')
        .single();

      if (existingIssue) {
        return res.status(400).json({
          success: false,
          message: 'Book already issued to this student',
          code: 'ALREADY_ISSUED',
          validation_status: 'rejected'
        });
      }

      // Check reservation status
      const { data: reservation } = await supabase
        .from('reservations')
        .select('user_id')
        .eq('book_id', bookId)
        .eq('status', 'reserved')
        .limit(1)
        .single();

      let reservationWarning = null;
      if (reservation && reservation.user_id !== session.user_id) {
        reservationWarning = 'Book has a reservation by another student';
      }

      // Book is valid - add to temporary scanned list
      const bookData = {
        book_id: bookId,
        title: book.title,
        isbn: book.isbn,
        status: 'pending',
        valid: true,
        scanned_at: new Date().toISOString()
      };

      // Update session with scanned book
      const updatedBooks = [...(session.scanned_books || []), bookData];
      
      await supabase
        .from('issue_sessions')
        .update({ scanned_books: updatedBooks })
        .eq('session_id', session_id);

      res.status(200).json({
        success: true,
        message: 'Book scanned successfully',
        validation_status: 'accepted',
        book: {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          available_copies: book.available_copies
        },
        warning: reservationWarning,
        session_status: {
          books_scanned: updatedBooks.length,
          can_borrow: session.can_borrow,
          remaining_slots: session.can_borrow - updatedBooks.length
        }
      });

    } catch (error) {
      console.error('Scan book error:', error);
      res.status(500).json({
        success: false,
        message: 'Book scanning failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * STEP 3 & 4: Finalize & Bulk Issue Books
   * POST /api/issue/finalize
   * Body: { session_id, force_finalize = false }
   */
  static async finalizeIssue(req, res) {
    try {
      const { session_id, force_finalize = false } = req.body;

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'Session ID required'
        });
      }

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .in('status', ['active', 'ready_to_finalize'])
        .single();

      if (sessionError || !session) {
        return res.status(400).json({
          success: false,
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      if (!session.scanned_books || session.scanned_books.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No books to issue',
          code: 'NO_BOOKS_SCANNED'
        });
      }

      // Start bulk transaction
      const issuedBooksData = session.scanned_books.map(book => ({
        user_id: session.user_id,
        book_id: book.book_id,
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        status: 'active',
        isbn: book.isbn
      }));

      // Perform atomic transaction
      try {
        // 1. Insert issued books
        const { data: issued, error: insertError } = await supabase
          .from('issued_books')
          .insert(issuedBooksData)
          .select();

        if (insertError) throw insertError;

        // 2. Update book availability
        for (const book of session.scanned_books) {
          const { error: updateError } = await supabase
            .from('books')
            .update({
              available_copies: supabase.raw('available_copies - 1'),
              last_updated: new Date().toISOString()
            })
            .eq('id', book.book_id);

          if (updateError) throw updateError;
        }

        // 3. Update session status
        await supabase
          .from('issue_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            issued_count: session.scanned_books.length
          })
          .eq('session_id', session_id);

        // 4. Create audit log
        await supabase
          .from('audit_logs')
          .insert([{
            action: 'bulk_issue_books',
            user_id: session.user_id,
            librarian_id: session.librarian_id,
            details: {
              session_id: session_id,
              books_count: session.scanned_books.length,
              book_ids: session.scanned_books.map(b => b.book_id)
            },
            timestamp: new Date().toISOString()
          }]);

        // 5. Send all notifications (Email + Firebase + Real-time)
        const notificationResults = await issueNotificationService.sendAllIssuanceNotifications(
          req.app.get('io'), // Socket.IO instance
          session.user_id,
          session.student_email,
          session.student_name,
          session.scanned_books.map(book => ({
            id: book.book_id,
            title: book.title,
            isbn: book.isbn
          })),
          session_id,
          issuedBooksData[0].due_date
        );

        console.log('📬 Notification results:', {
          email: notificationResults.email ? '✅ Sent' : '❌ Failed',
          firebase: notificationResults.firebase?.success ? '✅ Sent' : '❌ Failed',
          realtime: notificationResults.realtime?.success ? '✅ Sent' : '❌ Failed',
          errors: notificationResults.errors
        });

        res.status(200).json({
          success: true,
          message: `${session.scanned_books.length} books issued successfully`,
          result: {
            issued_count: issued.length,
            books_issued: issued.map(b => ({
              id: b.id,
              title: session.scanned_books.find(s => s.book_id === b.book_id)?.title,
              due_date: b.due_date,
              isbn: b.isbn
            })),
            notifications: {
              email_sent: notificationResults.email?.success || false,
              firebase_sent: notificationResults.firebase?.success || false,
              realtime_sent: notificationResults.realtime?.success || false
            },
            undo_available_for: 10, // seconds
            undo_id: `UNDO-${session_id}`
          }
        });

      } catch (transactionError) {
        console.error('Transaction error:', transactionError);
        res.status(500).json({
          success: false,
          message: 'Bulk issuance failed. All changes rolled back.',
          code: 'TRANSACTION_FAILED',
          error: process.env.NODE_ENV === 'development' ? transactionError.message : undefined
        });
      }

    } catch (error) {
      console.error('Finalize error:', error);
      res.status(500).json({
        success: false,
        message: 'Finalization failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * STEP 6: Undo Issuance (within 10 seconds)
   * POST /api/issue/undo
   * Body: { undo_id }
   */
  static async undoIssue(req, res) {
    try {
      const { undo_id } = req.body;

      if (!undo_id) {
        return res.status(400).json({
          success: false,
          message: 'Undo ID required'
        });
      }

      // Extract session ID from undo ID
      const session_id = undo_id.replace('UNDO-', '');

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .eq('status', 'completed')
        .single();

      if (sessionError || !session) {
        return res.status(400).json({
          success: false,
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Check if undo window is still open (10 seconds)
      const undoWindow = 10 * 1000;
      if (new Date(session.completed_at).getTime() + undoWindow < Date.now()) {
        return res.status(400).json({
          success: false,
          message: 'Undo window expired. Please contact administrator.',
          code: 'UNDO_WINDOW_EXPIRED'
        });
      }

      // Get issued books
      const { data: issuedBooks } = await supabase
        .from('issued_books')
        .select('id, book_id')
        .eq('user_id', session.user_id)
        .order('created_at', { ascending: false })
        .limit(session.issued_count);

      if (!issuedBooks || issuedBooks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No issued books found to undo',
          code: 'NO_ISSUED_BOOKS'
        });
      }

      try {
        // 1. Delete issued books
        const bookIds = issuedBooks.map(b => b.id);
        const { error: deleteError } = await supabase
          .from('issued_books')
          .delete()
          .in('id', bookIds);

        if (deleteError) throw deleteError;

        // 2. Restore book availability
        for (const issued of issuedBooks) {
          const { error: updateError } = await supabase
            .from('books')
            .update({
              available_copies: supabase.raw('available_copies + 1'),
              last_updated: new Date().toISOString()
            })
            .eq('id', issued.book_id);

          if (updateError) throw updateError;
        }

        // 3. Update session status
        await supabase
          .from('issue_sessions')
          .update({
            status: 'undone',
            undo_at: new Date().toISOString()
          })
          .eq('session_id', session_id);

        res.status(200).json({
          success: true,
          message: `Undo successful. ${issuedBooks.length} books restored.`,
          restored_count: issuedBooks.length
        });

      } catch (transactionError) {
        console.error('Undo transaction error:', transactionError);
        res.status(500).json({
          success: false,
          message: 'Undo failed. Partial rollback may have occurred.',
          error: process.env.NODE_ENV === 'development' ? transactionError.message : undefined
        });
      }

    } catch (error) {
      console.error('Undo error:', error);
      res.status(500).json({
        success: false,
        message: 'Undo operation failed'
      });
    }
  }

  /**
   * Get session status
   * GET /api/issue/session/:session_id
   */
  static async getSessionStatus(req, res) {
    try {
      const { session_id } = req.params;

      const { data: session, error } = await supabase
        .from('issue_sessions')
        .select('*')
        .eq('session_id', session_id)
        .single();

      if (error || !session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      res.status(200).json({
        success: true,
        session: {
          session_id: session.session_id,
          student_name: session.student_name,
          status: session.status,
          books_scanned: session.scanned_books?.length || 0,
          books_issued: session.issued_count || 0,
          can_undo: session.status === 'completed' && 
                   (new Date(session.completed_at).getTime() + 10000 > Date.now())
        }
      });

    } catch (error) {
      console.error('Get session status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch session status'
      });
    }
  }

  // ============================================================
  // TWO-STEP ISSUANCE FLOW (New Methods)
  // ============================================================

  /**
   * Create Issuance Request (Student scans book QR)
   * POST /api/issues/create-request
   * Body: { bookId, qrCode, bookTitle, bookIsbn, requestedAt }
   */
  static async createIssuanceRequest(req, res) {
    try {
      const {
        bookId,
        qrCode,
        bookTitle,
        bookIsbn,
        requestedAt,
        requestType = 'issue',
        transactionId = null
      } = req.body;
      const studentId = req.user?.id || req.userId; // From auth token

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!bookId || !qrCode) {
        return res.status(400).json({
          success: false,
          message: 'Book ID and QR code required'
        });
      }

      // Get student details
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id, name, email, is_active')
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (studentError || !student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      if (!student.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Check if student has pending fines
      const { data: fines } = await supabase
        .from('fines')
        .select('*')
        .eq('user_id', studentId)
        .eq('status', 'pending')
        .gt('amount', 0);

      const totalFines = fines ? fines.reduce((sum, f) => sum + f.amount, 0) : 0;

      if (totalFines > 0) {
        return res.status(403).json({
          success: false,
          message: `Cannot create request. Outstanding fine: ₹${totalFines}`,
          fine_amount: totalFines
        });
      }

      const normalizedRequestType = String(requestType || 'issue').toLowerCase();
      if (!['issue', 'return', 'reissue'].includes(normalizedRequestType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request type'
        });
      }

      // Check borrow limit (issue only)
      if (normalizedRequestType === 'issue') {
      const { data: activeIssues } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', studentId)
        .eq('transaction_type', 'issue')
        .eq('status', 'completed')
        .is('returned_date', null);

      const currentBorrowed = activeIssues ? activeIssues.length : 0;
      const maxBorrow = 5; // Default max borrow limit

      if (currentBorrowed >= maxBorrow) {
        return res.status(403).json({
          success: false,
          message: `Borrow limit reached. Already borrowed: ${currentBorrowed}/${maxBorrow}`
        });
      }
      }

      // Check if already issued (issue only)
      if (normalizedRequestType === 'issue') {
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', studentId)
        .eq('book_id', bookId)
        .eq('transaction_type', 'issue')
        .eq('status', 'completed')
        .is('returned_date', null)
        .single();

      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          message: 'Book already issued to you'
        });
      }
      }

      // Check book availability (issue only)
      if (normalizedRequestType === 'issue') {
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_copies, total_copies, is_available')
        .eq('id', bookId)
        .single();

      if (bookError || !book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      if (book.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Book is not available'
        });
      }
      }

      // Create issuance request
      const { data: request, error: createError } = await supabase
        .from('issuance_requests')
        .insert([
          {
            student_id: studentId,
            student_name: student.name,
            student_email: student.email,
            book_id: bookId,
            book_title: bookTitle,
            book_isbn: bookIsbn,
            qr_code: `${normalizedRequestType}::${qrCode || ''}::${transactionId || ''}`,
            status: 'pending',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Create request error:', createError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create issuance request'
        });
      }

      // Send notification to admin/librarian
      try {
        // Notify librarians
        const { data: librarians } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'librarian');

        if (librarians) {
          for (const librarian of librarians) {
            await supabase
              .from('notifications')
              .insert([
                {
                  user_id: librarian.id,
                  type: 'issuance_request',
                  title: `New ${normalizedRequestType} Request`,
                  message: `${student.name} requested ${normalizedRequestType}: ${bookTitle}`,
                  data: { requestId: request.id, studentId, bookId, requestType: normalizedRequestType, transactionId }
                }
              ]);
          }
        }
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      res.status(201).json({
        success: true,
        requestId: request.id,
        message: `${normalizedRequestType} request created successfully`
      });

    } catch (error) {
      console.error('Create issuance request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create issuance request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get Pending Issuance Requests (Admin view)
   * GET /api/issues/pending-requests
   */
  static async getPendingIssuanceRequests(req, res) {
    try {
      // Get pending requests that haven't expired
      const { data: requests, error: fetchError } = await supabase
        .from('issuance_requests')
        .select(`
          id,
          student_id,
          student_name,
          student_email,
          book_id,
          book_title,
          book_isbn,
          qr_code,
          status,
          created_at,
          expires_at
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch requests error:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch pending requests'
        });
      }

      // Auto-cancel expired requests
      const expiredRequests = (requests || []).filter(r => new Date(r.expires_at) < new Date());
      if (expiredRequests.length > 0) {
        await supabase
          .from('issuance_requests')
          .update({ status: 'expired' })
          .in('id', expiredRequests.map(r => r.id));
      }

      // Filter out expired ones from response
      const activeRequests = (requests || []).filter(r => new Date(r.expires_at) >= new Date());

      const normalizeRequest = (r) => {
        const [requestType = 'issue', rawQr = '', sourceTransactionId = ''] = String(r.qr_code || '').split('::');
        return {
          id: r.id,
          studentId: r.student_id,
          studentName: r.student_name,
          studentEmail: r.student_email,
          bookId: r.book_id,
          bookTitle: r.book_title,
          bookIsbn: r.book_isbn,
          qrCode: rawQr || r.qr_code,
          requestType,
          transactionId: sourceTransactionId || null,
          status: r.status,
          createdAt: r.created_at,
          expiresAt: r.expires_at
        };
      };

      res.json({
        success: true,
        requests: activeRequests.map(normalizeRequest),
        count: activeRequests.length
      });

    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending requests',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Complete Issuance Request (Admin scans book QR)
   * POST /api/issues/complete-request
   * Body: { requestId, bookQrCode, completedAt }
   */
  static async completeIssuanceRequest(req, res) {
    try {
      const { requestId, bookQrCode, completedAt } = req.body;
      const adminId = req.user?.id || req.userId;

      if (!requestId || !bookQrCode) {
        return res.status(400).json({
          success: false,
          message: 'Request ID and book QR code required'
        });
      }

      // Get the issuance request
      const { data: request, error: requestError } = await supabase
        .from('issuance_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      if (requestError || !request) {
        return res.status(404).json({
          success: false,
          message: 'Issuance request not found or already completed'
        });
      }

      // Check if expired
      if (new Date(request.expires_at) < new Date()) {
        await supabase
          .from('issuance_requests')
          .update({ status: 'expired' })
          .eq('id', requestId);

        return res.status(400).json({
          success: false,
          message: 'Issuance request has expired'
        });
      }

      const [requestType = 'issue', rawQr = '', sourceTransactionId = ''] = String(request.qr_code || '').split('::');

      // Verify the book QR code matches
      const { data: bookQr } = await supabase
        .from('qr_codes')
        .select('entity_id')
        .eq('qr_data', bookQrCode)
        .eq('entity_type', 'book')
        .single();

      let scannedBookId = null;
      if (bookQr) {
        scannedBookId = bookQr.entity_id;
      } else {
        // Try matching by ISBN
        const { data: bookByIsbn } = await supabase
          .from('books')
          .select('id')
          .eq('isbn', bookQrCode)
          .single();

        if (bookByIsbn) {
          scannedBookId = bookByIsbn.id;
        }
      }

      // For flexible matching, accept any available book
      // (Admin can scan any book, not necessarily the same one requested)
      if (!scannedBookId) {
        return res.status(400).json({
          success: false,
          message: 'Book QR code not recognized'
        });
      }

      // Check scanned book data
      const { data: scannedBook, error: bookError } = await supabase
        .from('books')
        .select('id, title, available_copies, total_copies, is_available')
        .eq('id', scannedBookId)
        .single();

      if (bookError || !scannedBook) {
        return res.status(404).json({
          success: false,
          message: 'Scanned book not found'
        });
      }

      if (requestType === 'issue' && scannedBook.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Scanned book is not available'
        });
      }

      const bookToIssue = scannedBookId;
      let transactionId = null;
      let completionMessage = 'Request completed successfully';

      if (requestType === 'return') {
        const { data: activeIssue, error: issueError } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', request.student_id)
          .eq('book_id', bookToIssue)
          .eq('transaction_type', 'issue')
          .is('returned_date', null)
          .order('issued_date', { ascending: false })
          .limit(1)
          .single();

        if (issueError || !activeIssue) {
          return res.status(400).json({ success: false, message: 'No active issue found for return' });
        }

        const { error: returnError } = await supabase
          .from('transactions')
          .update({ returned_date: new Date().toISOString() })
          .eq('id', activeIssue.id);

        if (returnError) {
          return res.status(500).json({ success: false, message: 'Failed to complete return' });
        }

        await supabase
          .from('books')
          .update({ available_copies: (scannedBook.available_copies || 0) + 1 })
          .eq('id', bookToIssue);

        transactionId = activeIssue.id;
        completionMessage = 'Book returned successfully';
      } else if (requestType === 'reissue') {
        const transactionLookupId = sourceTransactionId || null;
        let query = supabase
          .from('transactions')
          .select('id, due_date')
          .eq('user_id', request.student_id)
          .eq('book_id', bookToIssue)
          .eq('transaction_type', 'issue')
          .is('returned_date', null)
          .order('issued_date', { ascending: false })
          .limit(1);
        if (transactionLookupId) {
          query = query.eq('id', transactionLookupId);
        }
        const { data: activeIssue, error: issueError } = await query.single();
        if (issueError || !activeIssue) {
          return res.status(400).json({ success: false, message: 'No active issue found for reissue' });
        }
        const nextDueDate = new Date(activeIssue.due_date || Date.now());
        nextDueDate.setDate(nextDueDate.getDate() + 14);
        const { error: renewError } = await supabase
          .from('transactions')
          .update({ due_date: nextDueDate.toISOString() })
          .eq('id', activeIssue.id);
        if (renewError) {
          return res.status(500).json({ success: false, message: 'Failed to complete reissue' });
        }
        transactionId = activeIssue.id;
        completionMessage = 'Book reissued successfully';
      } else {
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert([
            {
              user_id: request.student_id,
              book_id: bookToIssue,
              transaction_type: 'issue',
              status: 'completed',
              issued_date: new Date().toISOString(),
              due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            }
          ])
          .select()
          .single();

        if (transactionError) {
          console.error('Transaction creation error:', transactionError);
          return res.status(500).json({ success: false, message: 'Failed to create transaction' });
        }
        transactionId = transaction.id;

        await supabase
          .from('books')
          .update({
            available_copies: scannedBook.available_copies - 1,
            issued_copies: (scannedBook.total_copies - scannedBook.available_copies) + 1
          })
          .eq('id', bookToIssue);

        completionMessage = 'Book issued successfully';
      }

      // Mark request as completed
      const { error: completeError } = await supabase
        .from('issuance_requests')
        .update({
          status: 'completed',
          completed_by: adminId,
          completed_at: new Date().toISOString(),
          issue_id: transactionId
        })
        .eq('id', requestId);

      if (completeError) {
        console.error('Request completion error:', completeError);
      }

      // Send notification to student
      try {
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: request.student_id,
              type: requestType === 'issue' ? 'book_issued' : requestType === 'return' ? 'book_returned' : 'book_reissued',
              title: requestType === 'issue' ? 'Book Issued Successfully' : requestType === 'return' ? 'Book Returned Successfully' : 'Book Reissued Successfully',
              message: completionMessage,
              data: { transactionId, bookId: bookToIssue, requestType }
            }
          ]);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      res.json({
        success: true,
        issueId: transactionId,
        message: completionMessage
      });

    } catch (error) {
      console.error('Complete issuance request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete issuance request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancel Issuance Request
   * POST /api/issues/cancel-request
   * Body: { requestId }
   */
  static async cancelIssuanceRequest(req, res) {
    try {
      const { requestId } = req.body;

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message: 'Request ID required'
        });
      }

      // Get the request
      const { data: request, error: requestError } = await supabase
        .from('issuance_requests')
        .select('*')
        .eq('id', requestId)
        .eq('status', 'pending')
        .single();

      if (requestError || !request) {
        return res.status(404).json({
          success: false,
          message: 'Issuance request not found or already processed'
        });
      }

      // Cancel the request
      const { error: cancelError } = await supabase
        .from('issuance_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (cancelError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to cancel request'
        });
      }

      // Notify student
      try {
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: request.student_id,
              type: 'request_cancelled',
              title: 'Book Request Cancelled',
              message: `Your request for ${request.book_title} has been cancelled`,
              data: { requestId }
            }
          ]);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }

      res.json({
        success: true,
        message: 'Request cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = IssueController;
