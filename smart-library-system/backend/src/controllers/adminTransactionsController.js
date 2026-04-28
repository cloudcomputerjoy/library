const pool = require('../config/database');
const { APIError } = require('../middleware/errorHandler');

// Issue a book
exports.issueBook = async (req, res) => {
  try {
    const { userId, copyId, dueDate } = req.body;

    if (!userId || !copyId) {
      throw new APIError('User ID and Copy ID are required', 400);
    }

    // Check if copy exists and is available
    const [copies] = await pool.query(`
      SELECT bc.id, bc.book_id, b.title
      FROM book_copies bc
      JOIN books b ON bc.book_id = b.id
      WHERE bc.copy_id = ? AND bc.status = 'available'
    `, [copyId]);

    if (copies.length === 0) {
      throw new APIError('Book copy not available', 400);
    }

    const copy = copies[0];

    // Create transaction
    const [result] = await pool.query(`
      INSERT INTO transactions (user_id, book_id, copy_id, issue_date, due_date, status, created_at)
      VALUES (?, ?, ?, NOW(), ?, 'active', NOW())
    `, [userId, copy.book_id, copyId, dueDate]);

    // Update copy status
    await pool.query(
      'UPDATE book_copies SET status = ? WHERE copy_id = ?',
      ['issued', copyId]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Book issued successfully'
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to issue book');
  }
};

// Return a book
exports.returnBook = async (req, res) => {
  try {
    const { transactionId, condition, remarks, fine = 0 } = req.body;

    if (!transactionId) {
      throw new APIError('Transaction ID is required', 400);
    }

    // Get transaction
    const [transactions] = await pool.query(`
      SELECT id, copy_id, due_date
      FROM transactions
      WHERE id = ? AND status = 'active'
    `, [transactionId]);

    if (transactions.length === 0) {
      throw new APIError('Transaction not found or already completed', 404);
    }

    const transaction = transactions[0];

    // Update transaction
    await pool.query(`
      UPDATE transactions
      SET status = ?, return_date = NOW(), condition = ?, remarks = ?
      WHERE id = ?
    `, ['returned', condition, remarks, transactionId]);

    // Update copy status
    await pool.query(
      'UPDATE book_copies SET status = ? WHERE copy_id = ?',
      [condition === 'damaged' ? 'damaged' : 'available', transaction.copy_id]
    );

    // Create fine record if applicable
    if (fine > 0) {
      await pool.query(`
        INSERT INTO fines (transaction_id, amount, reason, status, created_at)
        VALUES (?, ?, ?, 'pending', NOW())
      `, [transactionId, fine, 'Late return']);
    }

    res.json({
      message: 'Book returned successfully',
      fine
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to return book');
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (userId) {
      whereClause += ' AND t.user_id = ?';
      params.push(userId);
    }

    const [transactions] = await pool.query(`
      SELECT 
        t.id,
        u.name as userName,
        b.title as bookTitle,
        bc.copy_id as copyId,
        t.issue_date as issuedDate,
        t.due_date as dueDate,
        t.return_date as returnDate,
        t.status,
        t.condition
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      JOIN book_copies bc ON t.copy_id = bc.copy_id
      ${whereClause}
      ORDER BY t.issue_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM transactions t ${whereClause}
    `, params);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch transactions');
  }
};

// Calculate and create fines
exports.calculateFines = async (req, res) => {
  try {
    const finePerDay = 5; // $5 per day
    
    // Find overdue transactions
    const [overdueTransactions] = await pool.query(`
      SELECT 
        t.id,
        t.user_id,
        t.due_date,
        DATEDIFF(CURDATE(), t.due_date) as daysOverdue
      FROM transactions t
      WHERE t.status = 'active' AND t.due_date < CURDATE()
    `);

    const results = {
      processed: 0,
      finesCreated: 0,
      totalFines: 0
    };

    for (const transaction of overdueTransactions) {
      const fine = transaction.daysOverdue * finePerDay;

      // Check if fine already exists
      const [existing] = await pool.query(
        'SELECT id FROM fines WHERE transaction_id = ?',
        [transaction.id]
      );

      if (existing.length === 0) {
        await pool.query(`
          INSERT INTO fines (transaction_id, amount, reason, status, created_at)
          VALUES (?, ?, 'Late return', 'pending', NOW())
        `, [transaction.id, fine]);

        results.finesCreated++;
        results.totalFines += fine;
      }

      results.processed++;
    }

    res.json(results);
  } catch (error) {
    throw new APIError('Failed to calculate fines');
  }
};

// Get fines
exports.getFines = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }

    if (userId) {
      whereClause += ' AND t.user_id = ?';
      params.push(userId);
    }

    const [fines] = await pool.query(`
      SELECT 
        f.id,
        u.name as userName,
        b.title as bookTitle,
        f.amount,
        f.reason,
        f.status,
        f.created_at as createdDate
      FROM fines f
      JOIN transactions t ON f.transaction_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM fines f ${whereClause}
    `, params);

    res.json({
      fines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch fines');
  }
};

// Mark fine as paid
exports.markFinePaid = async (req, res) => {
  try {
    const { fineId } = req.params;

    const [result] = await pool.query(`
      UPDATE fines
      SET status = 'paid', paid_date = NOW()
      WHERE id = ?
    `, [fineId]);

    if (result.affectedRows === 0) {
      throw new APIError('Fine not found', 404);
    }

    res.json({ message: 'Fine marked as paid' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to mark fine as paid');
  }
};
