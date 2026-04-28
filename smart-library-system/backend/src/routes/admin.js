const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const pool = require('../config/database');
const adminController = require('../controllers/adminController');
const adminBooksController = require('../controllers/adminBooksController');
const adminTransactionsController = require('../controllers/adminTransactionsController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin', 'librarian']));

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [userStats] = await pool.query(`
      SELECT
        COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
        COUNT(CASE WHEN role = 'librarian' THEN 1 END) as total_librarians,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(*) as total_users
      FROM users WHERE is_active = true
    `);

    const [bookStats] = await pool.query(`
      SELECT
        COUNT(*) as total_books,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_books,
        COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_books,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_books
      FROM books
    `);

    const [transactionStats] = await pool.query(`
      SELECT
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_transactions,
        COUNT(CASE WHEN status = 'returned' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_transactions,
        COUNT(*) as total_transactions
      FROM transactions
    `);

    const [paymentStats] = await pool.query(`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_payments
      FROM payments
    `);

    res.json({
      users: userStats[0],
      books: bookStats[0],
      transactions: transactionStats[0],
      payments: paymentStats[0]
    });
  } catch (error) {
    throw new APIError('Failed to fetch dashboard statistics');
  }
});

// User management endpoints
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(status === 'active');
    }

    const [users] = await pool.query(`
      SELECT id, name, email, student_id, role, is_active, created_at, last_login
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM users ${whereClause}
    `, params);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch users');
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, student_id, role, password } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      throw new APIError('Name, email, and role are required', 400);
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new APIError('Email already exists', 409);
    }

    const hashedPassword = await require('../utils/password').hashPassword(password || 'default123');

    const [result] = await pool.query(`
      INSERT INTO users (name, email, student_id, role, password_hash, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, true, NOW())
    `, [name, email, student_id, role, hashedPassword]);

    res.status(201).json({
      id: result.insertId,
      message: 'User created successfully'
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to create user');
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, student_id, role } = req.body;

    await pool.query(`
      UPDATE users
      SET name = ?, email = ?, student_id = ?, role = ?
      WHERE id = ?
    `, [name, email, student_id, role, id]);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    throw new APIError('Failed to update user');
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);

    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    throw new APIError('Failed to update user status');
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has active transactions
    const [activeTransactions] = await pool.query(`
      SELECT COUNT(*) as count FROM transactions
      WHERE user_id = ? AND status = 'active'
    `, [id]);

    if (activeTransactions[0].count > 0) {
      throw new APIError('Cannot delete user with active transactions', 400);
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to delete user');
  }
});

// Book management endpoints
router.get('/books', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND category_id = ?';
      params.push(category);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [books] = await pool.query(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM books b ${whereClause}
    `, params);

    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch books');
  }
});

router.post('/books', async (req, res) => {
  try {
    const { title, author, isbn, category_id, description, total_copies } = req.body;

    if (!title || !author || !isbn || !category_id) {
      throw new APIError('Title, author, ISBN, and category are required', 400);
    }

    const [result] = await pool.query(`
      INSERT INTO books (title, author, isbn, category_id, description, total_copies, available_copies, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', NOW())
    `, [title, author, isbn, category_id, description, total_copies, total_copies]);

    res.status(201).json({
      id: result.insertId,
      message: 'Book added successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new APIError('ISBN already exists', 409);
    }
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to add book');
  }
});

router.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category_id, description, total_copies, status } = req.body;

    await pool.query(`
      UPDATE books
      SET title = ?, author = ?, isbn = ?, category_id = ?, description = ?, total_copies = ?, status = ?
      WHERE id = ?
    `, [title, author, isbn, category_id, description, total_copies, status, id]);

    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new APIError('ISBN already exists', 409);
    }
    throw new APIError('Failed to update book');
  }
});

router.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book has active transactions
    const [activeTransactions] = await pool.query(`
      SELECT COUNT(*) as count FROM transactions
      WHERE book_id = ? AND status = 'active'
    `, [id]);

    if (activeTransactions[0].count > 0) {
      throw new APIError('Cannot delete book with active transactions', 400);
    }

    await pool.query('DELETE FROM books WHERE id = ?', [id]);

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to delete book');
  }
});

// Transaction management endpoints
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, user_id, book_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (user_id) {
      whereClause += ' AND t.user_id = ?';
      params.push(user_id);
    }

    if (book_id) {
      whereClause += ' AND t.book_id = ?';
      params.push(book_id);
    }

    const [transactions] = await pool.query(`
      SELECT t.*, u.name as user_name, u.student_id, b.title as book_title, b.isbn
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM transactions t
      JOIN users u ON t.user_id = u.id
      JOIN books b ON t.book_id = b.id
      ${whereClause}
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
});

router.put('/transactions/:id/return', async (req, res) => {
  try {
    const { id } = req.params;

    // Get transaction details
    const [transaction] = await pool.query(`
      SELECT * FROM transactions WHERE id = ? AND status = 'active'
    `, [id]);

    if (transaction.length === 0) {
      throw new APIError('Transaction not found or already returned', 404);
    }

    const returnDate = new Date();
    const dueDate = new Date(transaction[0].due_date);
    const isOverdue = returnDate > dueDate;

    // Update transaction
    await pool.query(`
      UPDATE transactions
      SET status = 'returned', return_date = ?, is_overdue = ?
      WHERE id = ?
    `, [returnDate, isOverdue, id]);

    // Update book availability
    await pool.query(`
      UPDATE books SET available_copies = available_copies + 1
      WHERE id = ?
    `, [transaction[0].book_id]);

    // Create fine if overdue
    if (isOverdue) {
      const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * 10; // $10 per day

      await pool.query(`
        INSERT INTO payments (user_id, transaction_id, amount, type, status, due_date, created_at)
        VALUES (?, ?, ?, 'fine', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())
      `, [transaction[0].user_id, id, fineAmount]);
    }

    res.json({ message: 'Book returned successfully' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to process return');
  }
});

// QR Logs endpoints
router.get('/qr-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, user_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (user_id) {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    const [logs] = await pool.query(`
      SELECT q.*, u.name as user_name, u.student_id
      FROM qr_logs q
      LEFT JOIN users u ON q.user_id = u.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM qr_logs q ${whereClause}
    `, params);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch QR logs');
  }
});

// Attendance endpoints
router.get('/attendance', async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    let dateCondition = '';
    if (period === 'today') {
      dateCondition = 'DATE(a.check_in_time) = CURDATE()';
    } else if (period === 'week') {
      dateCondition = 'YEARWEEK(a.check_in_time) = YEARWEEK(CURDATE())';
    } else if (period === 'month') {
      dateCondition = 'MONTH(a.check_in_time) = MONTH(CURDATE()) AND YEAR(a.check_in_time) = YEAR(CURDATE())';
    }

    const [attendance] = await pool.query(`
      SELECT a.*, u.name, u.student_id, u.role
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE ${dateCondition}
      ORDER BY a.check_in_time DESC
    `);

    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total_checkins,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(TIME_TO_SEC(TIMEDIFF(check_out_time, check_in_time))/3600) as avg_session_hours
      FROM attendance
      WHERE ${dateCondition} AND check_out_time IS NOT NULL
    `);

    res.json({
      attendance,
      stats: stats[0]
    });
  } catch (error) {
    throw new APIError('Failed to fetch attendance data');
  }
});

// Print services endpoints
router.get('/print-jobs', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [jobs] = await pool.query(`
      SELECT p.*, u.name as user_name, u.student_id
      FROM print_jobs p
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM print_jobs p ${whereClause}
    `, params);

    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch print jobs');
  }
});

router.post('/print-jobs/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE print_jobs
      SET status = 'pending', retry_count = retry_count + 1, updated_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Print job queued for retry' });
  } catch (error) {
    throw new APIError('Failed to retry print job');
  }
});

router.put('/print-jobs/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE print_jobs
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Print job cancelled' });
  } catch (error) {
    throw new APIError('Failed to cancel print job');
  }
});

// Payments endpoints
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (type) {
      whereClause += ' AND p.type = ?';
      params.push(type);
    }

    const [payments] = await pool.query(`
      SELECT p.*, u.name as user_name, u.student_id, t.id as transaction_id
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN transactions t ON p.transaction_id = t.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM payments p ${whereClause}
    `, params);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch payments');
  }
});

router.put('/payments/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE payments
      SET status = 'paid', paid_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Payment processed successfully' });
  } catch (error) {
    throw new APIError('Failed to process payment');
  }
});

router.put('/payments/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE payments
      SET status = 'refunded', refunded_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    throw new APIError('Failed to refund payment');
  }
});

// Reports and Analytics
router.get('/reports', async (req, res) => {
  try {
    const { type } = req.query;

    let query = '';
    switch (type) {
      case 'books':
        query = `
          SELECT
            COUNT(*) as total_books,
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available_books,
            COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued_books,
            COUNT(DISTINCT category_id) as categories_count
          FROM books
        `;
        break;
      case 'transactions':
        query = `
          SELECT
            COUNT(*) as total_transactions,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_transactions,
            COUNT(CASE WHEN status = 'returned' THEN 1 END) as completed_transactions,
            COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_transactions,
            AVG(DATEDIFF(due_date, issue_date)) as avg_loan_period
          FROM transactions
        `;
        break;
      case 'users':
        query = `
          SELECT
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
            COUNT(CASE WHEN role = 'librarian' THEN 1 END) as librarians,
            COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
            AVG(DATEDIFF(NOW(), created_at)) as avg_account_age_days
          FROM users WHERE is_active = true
        `;
        break;
      default:
        query = `
          SELECT
            (SELECT COUNT(*) FROM books) as total_books,
            (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
            (SELECT COUNT(*) FROM transactions) as total_transactions,
            (SELECT SUM(amount) FROM payments WHERE status = 'paid') as total_revenue
        `;
    }

    const [report] = await pool.query(query);
    res.json(report[0]);
  } catch (error) {
    throw new APIError('Failed to generate report');
  }
});

router.get('/analytics', async (req, res) => {
  try {
    // Monthly transaction trends
    const [monthlyTransactions] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as transactions,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue
      FROM transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);

    // Popular books
    const [popularBooks] = await pool.query(`
      SELECT b.title, b.author, COUNT(t.id) as borrow_count
      FROM books b
      JOIN transactions t ON b.id = t.book_id
      GROUP BY b.id, b.title, b.author
      ORDER BY borrow_count DESC
      LIMIT 10
    `);

    // User activity
    const [userActivity] = await pool.query(`
      SELECT u.name, u.student_id, COUNT(t.id) as transaction_count
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id, u.name, u.student_id
      ORDER BY transaction_count DESC
      LIMIT 10
    `);

    res.json({
      monthlyTransactions,
      popularBooks,
      userActivity
    });
  } catch (error) {
    throw new APIError('Failed to fetch analytics');
  }
});

router.post('/reports/generate', async (req, res) => {
  try {
    const { type } = req.body;

    // In a real implementation, this would generate and store a report file
    // For now, just return success
    res.json({
      message: `${type} report generation started`,
      reportId: Date.now()
    });
  } catch (error) {
    throw new APIError('Failed to generate report');
  }
});

// AI Insights endpoints
router.get('/ai-insights', async (req, res) => {
  try {
    // Mock AI insights - in production, this would integrate with AI services
    const insights = [
      {
        id: 1,
        type: 'recommendation',
        title: 'Optimize Book Inventory',
        description: 'Based on borrowing patterns, consider increasing copies of popular computer science books',
        priority: 'high',
        impact: 'Increase user satisfaction by 15%'
      },
      {
        id: 2,
        type: 'alert',
        title: 'Peak Usage Hours',
        description: 'Library usage peaks between 2-4 PM. Consider extending hours during exam periods',
        priority: 'medium',
        impact: 'Better resource utilization'
      },
      {
        id: 3,
        type: 'prediction',
        title: 'Overdue Books Trend',
        description: 'Overdue books increased by 12% this month. Implement reminder system',
        priority: 'high',
        impact: 'Reduce losses by 20%'
      }
    ];

    res.json({ insights });
  } catch (error) {
    throw new APIError('Failed to fetch AI insights');
  }
});

router.post('/ai-insights/recommendations/:id/implement', async (req, res) => {
  try {
    const { id } = req.params;

    // In production, this would implement the AI recommendation
    res.json({ message: 'Recommendation implemented successfully' });
  } catch (error) {
    throw new APIError('Failed to implement recommendation');
  }
});

// Support tickets endpoints
router.get('/support-tickets', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [tickets] = await pool.query(`
      SELECT s.*, u.name as user_name, u.email
      FROM support_tickets s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM support_tickets s ${whereClause}
    `, params);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch support tickets');
  }
});

router.post('/support-tickets/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    await pool.query(`
      INSERT INTO support_messages (ticket_id, sender_id, sender_type, message, created_at)
      VALUES (?, ?, 'admin', ?, NOW())
    `, [id, req.user.id, message]);

    // Update ticket status if needed
    await pool.query(`
      UPDATE support_tickets
      SET status = 'in_progress', updated_at = NOW()
      WHERE id = ? AND status = 'open'
    `, [id]);

    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    throw new APIError('Failed to send reply');
  }
});

router.put('/support-tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(`
      UPDATE support_tickets
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `, [status, id]);

    res.json({ message: 'Ticket status updated successfully' });
  } catch (error) {
    throw new APIError('Failed to update ticket status');
  }
});

// Settings endpoints
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM library_settings');

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    throw new APIError('Failed to fetch settings');
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO library_settings (\`key\`, \`value\`, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()
      `, [key, JSON.stringify(value)]);
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    throw new APIError('Failed to update settings');
  }
});

// System logs endpoints
router.get('/system-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, level, category } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (level) {
      whereClause += ' AND level = ?';
      params.push(level);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    const [logs] = await pool.query(`
      SELECT * FROM system_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(*) as count FROM system_logs ${whereClause}
    `, params);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        pages: Math.ceil(total[0].count / limit)
      }
    });
  } catch (error) {
    throw new APIError('Failed to fetch system logs');
  }
});

router.delete('/system-logs', async (req, res) => {
  try {
    // Only delete logs older than 30 days
    await pool.query(`
      DELETE FROM system_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    res.json({ message: 'Old system logs cleared successfully' });
  } catch (error) {
    throw new APIError('Failed to clear system logs');
  }
});

// ============================================================
// TRANSACTION MANAGEMENT ENDPOINTS (Using Controller)
// ============================================================

// Dashboard endpoints
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/live-feed', adminController.getLiveFeed);
router.get('/dashboard/analytics', adminController.getAnalytics);

// Issue book
router.post('/transactions/issue', adminTransactionsController.issueBook);

// Return book
router.post('/transactions/return', adminTransactionsController.returnBook);

// Get transactions list
router.get('/transactions/list', adminTransactionsController.getTransactions);

// Calculate fines
router.post('/fines/calculate', adminTransactionsController.calculateFines);

// Get fines list
router.get('/fines/list', adminTransactionsController.getFines);

// Mark fine as paid
router.put('/fines/:fineId/pay', adminTransactionsController.markFinePaid);

// ============================================================
// BOOK MANAGEMENT ENDPOINTS (Using Controller)
// ============================================================

// Get all books
router.get('/books/list', adminBooksController.getAllBooks);

// Create a book
router.post('/books/create', adminBooksController.createBook);

// Update book
router.put('/books/:id', adminBooksController.updateBook);

// Delete book
router.delete('/books/:id', adminBooksController.deleteBook);

// Book copies management
router.get('/books/:bookId/copies', adminBooksController.getBookCopies);
router.post('/books/:bookId/copies', adminBooksController.addBookCopy);
router.put('/copies/:copyId/status', adminBooksController.updateBookCopyStatus);
router.delete('/copies/:copyId', adminBooksController.deleteBookCopy);

// ============================================================
// USER MANAGEMENT ENDPOINTS (Using Controller)
// ============================================================

// Get users with new controller
router.get('/users/list', adminController.getUsers);

// Create user with new controller
router.post('/users/create', adminController.createUser);

// Update user with new controller
router.put('/users/:id', adminController.updateUser);

// Delete user with new controller
router.delete('/users/:id', adminController.deleteUser);

// Bulk import users
router.post('/users/bulk-import', adminController.bulkImportUsers);

// ============================================================
// CATEGORIES MANAGEMENT ENDPOINTS (Supabase)
// ============================================================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch categories',
    });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { name, description, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: name.trim(),
          description: description || null,
          color: color || '#000000',
          icon: icon || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create category',
    });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: name || undefined,
        description: description || undefined,
        color: color || undefined,
        icon: icon || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update category',
    });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { id } = req.params;

    // Check if category has books
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id', { count: 'exact' })
      .eq('category_id', id);

    if (books && books.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${books.length} book(s). Please reassign books first.`,
      });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete category',
    });
  }
});

// ============================================================
// SHELVES MANAGEMENT ENDPOINTS (Supabase)
// ============================================================

// Get all shelves
router.get('/shelves', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { section, floor } = req.query;

    let query = supabase
      .from('shelves')
      .select('*')
      .order('rack_number', { ascending: true });

    if (section) {
      query = query.eq('section', section);
    }

    if (floor) {
      query = query.eq('floor_number', parseInt(floor));
    }

    const { data, error } = await query;

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch shelves',
    });
  }
});

// Create shelf
router.post('/shelves', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { name, rack_number, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shelf name is required',
      });
    }

    if (!rack_number || !rack_number.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Rack number is required',
      });
    }

    // Check if rack_number already exists
    const { data: existing } = await supabase
      .from('shelves')
      .select('id')
      .eq('rack_number', rack_number)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Rack number ${rack_number} already exists`,
      });
    }

    const { data, error } = await supabase
      .from('shelves')
      .insert([
        {
          name: name.trim(),
          rack_number: rack_number.trim(),
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Shelf created successfully',
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create shelf',
    });
  }
});

// Update shelf
router.put('/shelves/:id', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { id } = req.params;
    const { name, rack_number, description } = req.body;

    // Check if new rack_number already exists on another shelf
    if (rack_number) {
      const { data: duplicate } = await supabase
        .from('shelves')
        .select('id')
        .eq('rack_number', rack_number)
        .neq('id', id)
        .single();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Rack number ${rack_number} already exists`,
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rack_number !== undefined) updateData.rack_number = rack_number;
    if (description !== undefined) updateData.description = description;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('shelves')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Shelf updated successfully',
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update shelf',
    });
  }
});

// Delete shelf
router.delete('/shelves/:id', async (req, res) => {
  try {
    const { supabase } = require('../config/database');
    const { id } = req.params;

    // Check if shelf has any books
    const { data: books } = await supabase
      .from('books')
      .select('id')
      .contains('shelves', [id]);

    if (books && books.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete shelf with ${books.length} book(s). Please reassign books first.`,
      });
    }

    const { error } = await supabase
      .from('shelves')
      .delete()
      .eq('id', id);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Shelf deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete shelf',
    });
  }
});

// Get shelf capacity overview
router.get('/shelves/capacity/overview', async (req, res) => {
  try {
    const { supabase } = require('../config/database');

    const { data: shelves, error } = await supabase
      .from('shelves')
      .select('*');

    if (error) {
      throw new APIError(error.message);
    }

    // Count books on each shelf
    const shelvesWithCount = await Promise.all(
      shelves.map(async (shelf) => {
        const { count } = await supabase
          .from('books')
          .select('id', { count: 'exact' })
          .contains('shelves', [shelf.id]);

        return {
          ...shelf,
          booksCount: count || 0,
          availableCapacity: shelf.capacity ? shelf.capacity - (count || 0) : null,
          utilizationPercent: shelf.capacity
            ? Math.round(((count || 0) / shelf.capacity) * 100)
            : null,
        };
      })
    );

    res.json({
      success: true,
      data: shelvesWithCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch shelf capacity overview',
    });
  }
});

module.exports = router;