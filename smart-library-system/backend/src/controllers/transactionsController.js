/**
 * Transactions Controller
 * Handles book issue, return, and transaction history
 */

const { supabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Issue a book to user
 */
exports.issueBook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId, dueDays = 14 } = req.body;

    // Check if book is available
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('id, title, available_copies')
      .eq('id', bookId)
      .single();

    if (bookError || !bookData || bookData.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available',
      });
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
      return res.status(400).json({
        success: false,
        message: 'You already have this book issued',
      });
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

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: {
        transaction,
        book: bookData,
        dueDate: dueDate.toISOString(),
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
 * Return a book
 */
exports.returnBook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId, condition = 'good', notes = '' } = req.body;

    // Get the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('transaction_type', 'issue')
      .is('returned_date', null)
      .single();

    if (transactionError || !transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
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

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: {
        transaction: returnTransaction,
        fine,
        fineApplied: fine > 0,
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
 * Get user's active issues (borrowed books)
 */
exports.getActiveIssues = async (req, res) => {
  try {
    const userId = req.user.userId;

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
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Add status (due/overdue)
    const enrichedData = data.map((item) => ({
      ...item,
      isOverdue: new Date() > new Date(item.due_date),
      daysRemaining: Math.ceil(
        (new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24)
      ),
    }));

    res.json({
      success: true,
      data: enrichedData,
      count: enrichedData.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get transaction history
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('transactions')
      .select(
        `
        *,
        book: book_id (
          id,
          title,
          isbn,
          cover_image_url
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count,
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
 * Get user's fines
 */
exports.getUserFines = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('fines')
      .select(
        `
        *,
        transaction: transaction_id (
          id,
          issued_date,
          returned_date,
          book: book_id (id, title)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate summary
    const summary = {
      totalFines: data.length,
      totalAmount: data.reduce((sum, f) => sum + f.amount, 0),
      paidAmount: data
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      pendingAmount: data
        .filter((f) => f.status === 'pending')
        .reduce((sum, f) => sum + f.amount, 0),
    };

    res.json({
      success: true,
      data,
      summary,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Renew a book (extend due date)
 */
exports.renewBook = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId, extendDays = 14 } = req.body;

    // Get the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('transaction_type', 'issue')
      .is('returned_date', null)
      .single();

    if (transactionError || !transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Calculate new due date
    const currentDueDate = new Date(transaction.due_date);
    const newDueDate = new Date(currentDueDate.getTime());
    newDueDate.setDate(newDueDate.getDate() + extendDays);

    // Update due date
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        due_date: newDueDate.toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Book renewed successfully',
      data: {
        transaction: updatedTransaction,
        oldDueDate: transaction.due_date,
        newDueDate: newDueDate.toISOString(),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
