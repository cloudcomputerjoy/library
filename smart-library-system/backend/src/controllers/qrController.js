/**
 * QR Code Controller
 * Handles QR code generation, scanning, and validation
 */

const { supabase } = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate QR code for a book
 */
exports.generateBookQR = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Get book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, isbn, title')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'book',
      bookId: book.id,
      isbn: book.isbn,
      timestamp: new Date().toISOString(),
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(qrData);

    // Save QR code metadata
    const { data: qr, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        entity_type: 'book',
        entity_id: bookId,
        qr_data: qrData,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (qrError) throw qrError;

    res.json({
      success: true,
      data: {
        qrId: qr.id,
        bookId,
        qrCode,
        qrData,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Generate QR code for a user library card
 */
exports.generateUserQR = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, student_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'user',
      userId: user.id,
      studentId: user.student_id,
      name: user.name,
      timestamp: new Date().toISOString(),
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(qrData);

    // Save QR code metadata
    const { data: qr, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        entity_type: 'user',
        entity_id: userId,
        qr_data: qrData,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (qrError) throw qrError;

    res.json({
      success: true,
      data: {
        qrId: qr.id,
        userId,
        qrCode,
        userInfo: {
          name: user.name,
          studentId: user.student_id,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Scan and validate QR code
 */
exports.scanQR = async (req, res) => {
  try {
    const { qrData, action = 'issue' } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required',
      });
    }

    try {
      const data = JSON.parse(qrData);

      if (data.type === 'book') {
        const { data: book, error: bookError } = await supabase
          .from('books')
          .select('id, isbn, title, available_copies')
          .eq('id', data.bookId)
          .single();

        if (bookError || !book) {
          return res.status(404).json({
            success: false,
            message: 'Book not found',
          });
        }

        res.json({
          success: true,
          scannedData: {
            type: 'book',
            ...book,
            action,
          },
        });
      } else if (data.type === 'user') {
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('id, name, email, student_id, role, membership_status')
          .eq('id', data.userId)
          .single();

        if (userError || !user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        // Check membership status
        if (user.membership_status !== 'active') {
          return res.status(403).json({
            success: true,
            warning: 'User membership not active',
            scannedData: user,
          });
        }

        res.json({
          success: true,
          scannedData: {
            type: 'user',
            ...user,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid QR code type',
        });
      }
    } catch (parseError) {
      res.status(400).json({
        success: false,
        message: 'Invalid QR code format',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Perform transaction via QR scan
 */
exports.processQRTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { userQRData, bookQRData, action = 'issue' } = req.body;

    // Parse QR codes
    let userData, bookData;
    try {
      userData = JSON.parse(userQRData);
      bookData = JSON.parse(bookQRData);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format',
      });
    }

    if (userData.type !== 'user' || bookData.type !== 'book') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code combination',
      });
    }

    // Verify user (librarian scanning must match the QR code user or be admin)
    const { data: user } = await supabase
      .from('profiles')
      .select('id, membership_status')
      .eq('id', userData.userId)
      .single();

    if (!user || user.membership_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User not eligible for transaction',
      });
    }

    // Get book
    const { data: book } = await supabase
      .from('books')
      .select('id, title, available_copies')
      .eq('id', bookData.bookId)
      .single();

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    let result;

    if (action === 'issue') {
      // Issue book
      if (book.available_copies <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Book is not available',
        });
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: userData.userId,
          book_id: book.id,
          transaction_type: 'issue',
          issued_date: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          status: 'completed',
        })
        .select()
        .single();

      if (txnError) throw txnError;

      result = {
        transaction,
        action: 'issue',
        message: `Book "${book.title}" issued successfully`,
      };
    } else if (action === 'return') {
      // Return book
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userData.userId)
        .eq('book_id', book.id)
        .eq('transaction_type', 'issue')
        .is('returned_date', null)
        .single();

      if (txnError || !transaction) {
        return res.status(404).json({
          success: false,
          message: 'No active issue for this book found',
        });
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

      const { data: returnedTransaction, error: returnError } = await supabase
        .from('transactions')
        .update({
          returned_date: returnDate.toISOString(),
          fine_amount: fine,
          status: 'completed',
        })
        .eq('id', transaction.id)
        .select()
        .single();

      if (returnError) throw returnError;

      result = {
        transaction: returnedTransaction,
        action: 'return',
        fine,
        message: `Book "${book.title}" returned${fine > 0 ? ` with fine of ₹${fine}` : ''}`,
      };
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get QR code history
 */
exports.getQRHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    // Get user's transactions with QR scans
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(
        `
        *,
        book: book_id (id, title, isbn)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Validate QR code token
 */
exports.validateQRToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    // Verify token in QR codes table
    const { data: qrRecord, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_data', token)
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (error || !qrRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired QR code',
      });
    }

    res.json({
      success: true,
      message: 'QR code is valid',
      data: qrRecord,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
