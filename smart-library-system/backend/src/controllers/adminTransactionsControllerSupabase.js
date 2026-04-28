// Transactions Controller - Supabase Integration
// Issue/Return system with auto fine calculation

const {
  supabase,
  getById,
  create,
  update,
  logAdminAction,
  calculateOverdueFine,
} = require('../config/supabase-new');

// ============================================
// ISSUE BOOK ENDPOINT
// ============================================

/**
 * POST /api/admin/transactions/issue
 * Issue a book to a user
 */
const issueBook = async (req, res, next) => {
  try {
    const {
      user_id,
      book_id,
      copy_id,
      due_date,
      remarks,
    } = req.body;

    // Validation
    if (!user_id || !book_id || !copy_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id, book_id, and copy_id are required',
      });
    }

    // Check if copy is available
    const copy = await getById('book_copies', copy_id);
    if (!copy || copy.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: 'Book copy is not available',
      });
    }

    // Get user to check fine balance
    const user = await getById('users', user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is suspended/blocked
    if (user.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `User is ${user.status}. Cannot issue books.`,
      });
    }

    // Check outstanding fines
    const { data: pendingFines } = await supabase
      .from('fines')
      .select('amount')
      .eq('user_id', user_id)
      .eq('status', 'pending');

    const totalPendingFines = pendingFines?.reduce((sum, f) => sum + f.amount, 0) || 0;

    // Get max fine limit from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'max_fine_limit')
      .single();

    const maxFineLimit = parseFloat(settings?.setting_value) || 1000;

    if (totalPendingFines >= maxFineLimit) {
      return res.status(400).json({
        success: false,
        error: `User has exceeded fine limit (${totalPendingFines}/${maxFineLimit}). Must pay fines first.`,
      });
    }

    // Create transaction
    const dueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // Default 14 days

    const transaction = await create('transactions', {
      user_id,
      book_id,
      copy_id,
      issue_date: new Date(),
      due_date: dueDate,
      status: 'active',
      issued_by: req.user.id,
      remarks: remarks || null,
    });

    // Update copy status
    await update('book_copies', copy_id, { status: 'issued' });

    // Log action
    await logAdminAction(
      req.user.id,
      'create',
      'transaction',
      transaction.id,
      { type: 'issue', user_id, book_id, copy_id }
    );

    return res.status(201).json({
      success: true,
      data: transaction,
      message: 'Book issued successfully',
    });
  } catch (error) {
    console.error('Issue book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to issue book',
    });
  }
};

// ============================================
// RETURN BOOK ENDPOINT
// ============================================

/**
 * POST /api/admin/transactions/return
 * Return a book and handle fines
 */
const returnBook = async (req, res, next) => {
  try {
    const {
      transaction_id,
      condition_on_return,
      remarks,
    } = req.body;

    if (!transaction_id) {
      return res.status(400).json({
        success: false,
        error: 'transaction_id is required',
      });
    }

    // Get transaction
    const transaction = await getById('transactions', transaction_id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (transaction.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This book is not currently issued',
      });
    }

    // Calculate fine if late
    const dueDate = new Date(transaction.due_date);
    const returnDate = new Date();
    const daysOverdue = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)));

    let fineAmount = 0;

    // Get late return fine rate
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'late_return_fine_per_day')
      .single();

    const finePerDay = parseFloat(settings?.setting_value) || 5;

    if (daysOverdue > 0) {
      fineAmount += daysOverdue * finePerDay;
    }

    // Add damage fine if applicable
    if (condition_on_return === 'damaged') {
      const { data: damageFineSettings } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'damage_fine')
        .single();

      fineAmount += parseFloat(damageFineSettings?.setting_value) || 100;
    }

    // Add lost book fine if applicable
    if (condition_on_return === 'lost') {
      const { data: lostFineSettings } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'lost_book_fine')
        .single();

      fineAmount += parseFloat(lostFineSettings?.setting_value) || 500;
    }

    // Update transaction
    const updatedTransaction = await update('transactions', transaction_id, {
      return_date: returnDate,
      status: 'returned',
      condition_on_return: condition_on_return || 'good',
      returned_by: req.user.id,
      remarks: remarks || null,
    });

    // Update copy status and condition
    const copyStatus = condition_on_return === 'lost' ? 'lost' :
                       condition_on_return === 'damaged' ? 'damaged' :
                       'available';

    await update('book_copies', transaction.copy_id, {
      status: copyStatus,
      condition: condition_on_return || 'good',
    });

    // Create fine if amount > 0
    let fine = null;
    if (fineAmount > 0) {
      fine = await create('fines', {
        user_id: transaction.user_id,
        transaction_id: transaction_id,
        amount: fineAmount,
        fine_type: daysOverdue > 0 ? 'late_return' : condition_on_return === 'damaged' ? 'damage' : 'lost_book',
        reason: `Late return: ${daysOverdue} days${condition_on_return ? `, Condition: ${condition_on_return}` : ''}`,
        status: 'pending',
      });
    }

    await logAdminAction(
      req.user.id,
      'create',
      'transaction',
      transaction_id,
      {
        type: 'return',
        condition: condition_on_return,
        days_overdue: daysOverdue,
        fine_amount: fineAmount,
      }
    );

    return res.json({
      success: true,
      data: {
        transaction: updatedTransaction,
        fine: fine || null,
        daysOverdue,
        fineAmount,
      },
      message: `Book returned successfully${fineAmount > 0 ? ` with fine: ${fineAmount}` : ''}`,
    });
  } catch (error) {
    console.error('Return book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to return book',
    });
  }
};

// ============================================
// GET TRANSACTIONS
// ============================================

/**
 * GET /api/admin/transactions
 * Get all transactions with filtering
 */
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, user_id, status, startDate, endDate } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = supabase
      .from('transactions')
      .select(`
        *,
        users(full_name, email, student_id),
        book_copies(id, qr_code, book_id, books(title, author, isbn))
      `, { count: 'exact' });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate && endDate) {
      query = query
        .gte('issued_date', startDate)
        .lte('issued_date', endDate);
    }

    const { data, count, error } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('issued_date', { ascending: false });

    if (error) throw error;

    const formatted = data?.map(tx => ({
      id: tx.id,
      user: tx.users,
      book: tx.book_copies?.books,
      copy_id: tx.book_copy_id,
      qr_code: tx.book_copies?.qr_code,
      issue_date: tx.issued_date || tx.issue_date,
      due_date: tx.due_date,
      return_date: tx.returned_date || tx.return_date,
      status: tx.status,
      condition: tx.returned_condition || tx.condition_on_return,
    })) || [];

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
    });
  }
};

/**
 * GET /api/admin/transactions/:id
 * Get single transaction details
 */
const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users(name, email, student_id, phone),
        books(title, author, isbn, publisher),
        book_copies(copy_id, qr_code, shelf_location),
        fines(amount, reason, status)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
    });
  }
};

// ============================================
// FINE MANAGEMENT
// ============================================

/**
 * GET /api/admin/fines
 * Get all fines
 */
const getFines = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, user_id } = req.query;
    const offset = (page - 1) * parseInt(limit);

    let query = supabase
      .from('fines')
      .select(`
        *,
        users(name, email, student_id)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, count, error } = await query
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get fines error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fines',
    });
  }
};

/**
 * POST /api/admin/fines/:id/pay
 * Mark fine as paid
 */
const payFine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_method } = req.body;

    const fine = await update('fines', id, {
      status: 'paid',
      payment_method: payment_method || 'cash',
      payment_date: new Date(),
    });

    await logAdminAction(
      req.user.id,
      'update',
      'fine',
      id,
      { status: 'paid', payment_method }
    );

    return res.json({
      success: true,
      data: fine,
      message: 'Fine marked as paid',
    });
  } catch (error) {
    console.error('Pay fine error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark fine as paid',
    });
  }
};

module.exports = {
  issueBook,
  returnBook,
  getTransactions,
  getTransaction,
  getFines,
  payFine,
};
