const pool = require('../config/database');
const { APIError } = require('../middleware/errorHandler');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [userStats] = await pool.query(`
      SELECT
        COUNT(CASE WHEN role = 'student' THEN 1 END) as totalUsers,
        COUNT(CASE WHEN role = 'librarian' THEN 1 END) as totalLibrarians,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as totalAdmins
      FROM users WHERE is_active = true
    `);

    const [bookStats] = await pool.query(`
      SELECT
        COUNT(*) as totalBooks,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as availableBooks
      FROM books
    `);

    const [transactionStats] = await pool.query(`
      SELECT
        COUNT(CASE WHEN DATE(issue_date) = CURDATE() THEN 1 END) as issuesToday,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdueBooks
      FROM transactions
    `);

    const [fineStats] = await pool.query(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pendingFines
      FROM fines
    `);

    res.json({
      totalUsers: userStats[0].totalUsers || 0,
      totalBooks: bookStats[0].totalBooks || 0,
      issuesToday: transactionStats[0].issuesToday || 0,
      pendingFines: fineStats[0].pendingFines || 0,
    });
  } catch (error) {
    throw new APIError('Failed to fetch dashboard statistics');
  }
};

// Get live feed
exports.getLiveFeed = async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT 
        u.name as userName,
        'entry' as type,
        a.timestamp as time
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE DATE(a.timestamp) = CURDATE()
      ORDER BY a.timestamp DESC
      LIMIT 20
    `);

    res.json(events || []);
  } catch (error) {
    throw new APIError('Failed to fetch live feed');
  }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const [dailyIssues] = await pool.query(`
      SELECT 
        DATE(issue_date) as date,
        COUNT(*) as issues,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returns
      FROM transactions
      WHERE DATE(issue_date) BETWEEN ? AND ?
      GROUP BY DATE(issue_date)
      ORDER BY date ASC
    `, [startDate, endDate]);

    res.json(dailyIssues || []);
  } catch (error) {
    throw new APIError('Failed to fetch analytics');
  }
};

// Get Users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereClause += ' AND is_active = ?';
      params.push(status === 'active');
    }

    const [users] = await pool.query(`
      SELECT id, name, email, role, is_active as status, created_at as joinedDate, last_login
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
};

// Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email, userType, phone, status = 'active' } = req.body;

    if (!name || !email) {
      throw new APIError('Name and email are required', 400);
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new APIError('Email already exists', 409);
    }

    const [result] = await pool.query(`
      INSERT INTO users (name, email, role, phone, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [name, email, userType || 'user', phone, status === 'active']);

    res.status(201).json({
      id: result.insertId,
      message: 'User created successfully'
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to create user');
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, status } = req.body;

    const [result] = await pool.query(`
      UPDATE users
      SET name = ?, email = ?, role = ?, phone = ?, is_active = ?
      WHERE id = ?
    `, [name, email, role, phone, status === 'active', id]);

    if (result.affectedRows === 0) {
      throw new APIError('User not found', 404);
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to update user');
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new APIError('User not found', 404);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    throw new APIError('Failed to delete user');
  }
};

// Bulk import users from CSV
exports.bulkImportUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      throw new APIError('No users provided', 400);
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < users.length; i++) {
      try {
        const { name, email, userType = 'user' } = users[i];

        if (!name || !email) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Name and email are required`);
          continue;
        }

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Email already exists`);
          continue;
        }

        await pool.query(`
          INSERT INTO users (name, email, role, is_active, created_at)
          VALUES (?, ?, ?, true, NOW())
        `, [name, email, userType]);

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    throw new APIError('Failed to bulk import users');
  }
};

// ============== INSTITUTION DOMAINS MANAGEMENT ==============

/**
 * Get allowed institution domains for student signup
 */
exports.getInstitutionDomains = async (req, res) => {
  try {
    // For now, return default domains from environment or hardcoded list
    // In production, these can be stored in database
    const domainsEnv = process.env.ALLOWED_INSTITUTION_DOMAINS || '@aaub.edu.bd,@aiub.edu.bd';
    const domains = domainsEnv.split(',').map(d => d.trim());
    
    res.json({
      success: true,
      domains,
      message: 'Institution domains retrieved successfully'
    });
  } catch (error) {
    throw new APIError('Failed to fetch institution domains');
  }
};

/**
 * Set institution domains (replace all)
 */
exports.setInstitutionDomains = async (req, res) => {
  try {
    const { domains } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      throw new APIError('Domains must be a non-empty array', 400);
    }

    // Validate domain format
    const validDomains = domains.filter(d => {
      const trimmed = d.trim();
      return /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
    });

    if (validDomains.length === 0) {
      throw new APIError('No valid domains provided. Domains must start with @ (e.g., @aaub.edu.bd)', 400);
    }

    // In production, save to database:
    // await pool.query('UPDATE system_settings SET allowed_domains = ? WHERE id = 1', [JSON.stringify(validDomains)]);

    // For now, just return success
    res.json({
      success: true,
      domains: validDomains,
      message: `${validDomains.length} domain(s) configured successfully`
    });
  } catch (error) {
    throw new APIError(error.message || 'Failed to set institution domains');
  }
};

/**
 * Update institution domains (add/modify)
 */
exports.updateInstitutionDomains = async (req, res) => {
  try {
    const { domains } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      throw new APIError('Domains must be a non-empty array', 400);
    }

    // Validate domain format
    const validDomains = domains.filter(d => {
      const trimmed = d.trim();
      return /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
    });

    if (validDomains.length === 0) {
      throw new APIError('No valid domains provided. Domains must start with @ (e.g., @aaub.edu.bd)', 400);
    }

    // In production, merge with existing domains:
    // GET current domains from database
    // Merge with new ones (avoiding duplicates)
    // Save back to database

    res.json({
      success: true,
      domains: validDomains,
      message: `${validDomains.length} domain(s) added/updated successfully`
    });
  } catch (error) {
    throw new APIError(error.message || 'Failed to update institution domains');
  }
};

/**
 * Delete a specific institution domain
 */
exports.deleteInstitutionDomain = async (req, res) => {
  try {
    const { domain } = req.params;

    if (!domain || !/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      throw new APIError('Invalid domain format', 400);
    }

    // In production, remove from database:
    // await pool.query('UPDATE system_settings SET allowed_domains = JSON_REMOVE(allowed_domains, ?) ...');

    res.json({
      success: true,
      message: `Domain ${domain} deleted successfully`
    });
  } catch (error) {
    throw new APIError(error.message || 'Failed to delete institution domain');
  }
};
