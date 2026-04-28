const pool = require('../config/database');
const { APIError } = require('../middleware/errorHandler');

// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [books] = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.status,
        b.created_at,
        COUNT(bc.id) as totalCopies,
        SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) as copiesAvailable
      FROM books b
      LEFT JOIN book_copies bc ON b.id = bc.book_id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [total] = await pool.query(`
      SELECT COUNT(DISTINCT id) as count FROM books ${whereClause}
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
};

// Create book
exports.createBook = async (req, res) => {
  try {
    const { title, author, isbn, description, category, publisher, totalCopies = 1, status = 'available' } = req.body;

    if (!title || !author || !isbn) {
      throw new APIError('Title, author, and ISBN are required', 400);
    }

    const [existing] = await pool.query('SELECT id FROM books WHERE isbn = ?', [isbn]);
    if (existing.length > 0) {
      throw new APIError('ISBN already exists', 409);
    }

    const [result] = await pool.query(`
      INSERT INTO books (title, author, isbn, description, category, publisher, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [title, author, isbn, description, category, publisher, status]);

    const bookId = result.insertId;

    // Create book copies
    for (let i = 0; i < totalCopies; i++) {
      const copyId = `${bookId}-${i + 1}`;
      await pool.query(`
        INSERT INTO book_copies (book_id, copy_id, status, shelf_location, created_at)
        VALUES (?, ?, 'available', NULL, NOW())
      `, [bookId, copyId]);
    }

    res.status(201).json({
      id: bookId,
      message: 'Book created successfully'
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to create book');
  }
};

// Update book
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, description, category, publisher, status } = req.body;

    const [result] = await pool.query(`
      UPDATE books
      SET title = ?, author = ?, isbn = ?, description = ?, category = ?, publisher = ?, status = ?
      WHERE id = ?
    `, [title, author, isbn, description, category, publisher, status, id]);

    if (result.affectedRows === 0) {
      throw new APIError('Book not found', 404);
    }

    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to update book');
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete book copies first
    await pool.query('DELETE FROM book_copies WHERE book_id = ?', [id]);

    // Delete book
    const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new APIError('Book not found', 404);
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    throw new APIError('Failed to delete book');
  }
};

// Get book copies
exports.getBookCopies = async (req, res) => {
  try {
    const { bookId } = req.params;

    const [copies] = await pool.query(`
      SELECT id, copy_id as copyId, status, shelf_location as shelfLocation, created_at
      FROM book_copies
      WHERE book_id = ?
      ORDER BY copy_id ASC
    `, [bookId]);

    res.json(copies);
  } catch (error) {
    throw new APIError('Failed to fetch book copies');
  }
};

// Add book copy
exports.addBookCopy = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { shelfLocation, status = 'available' } = req.body;

    // Get book info
    const [books] = await pool.query('SELECT id FROM books WHERE id = ?', [bookId]);
    if (books.length === 0) {
      throw new APIError('Book not found', 404);
    }

    // Generate copy ID
    const copyId = `${bookId}-${Date.now()}`;

    const [result] = await pool.query(`
      INSERT INTO book_copies (book_id, copy_id, status, shelf_location, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [bookId, copyId, status, shelfLocation]);

    res.status(201).json({
      id: result.insertId,
      copyId,
      message: 'Book copy added successfully'
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to add book copy');
  }
};

// Update book copy status
exports.updateBookCopyStatus = async (req, res) => {
  try {
    const { copyId } = req.params;
    const { status } = req.body;

    const [result] = await pool.query(`
      UPDATE book_copies
      SET status = ?
      WHERE copy_id = ?
    `, [status, copyId]);

    if (result.affectedRows === 0) {
      throw new APIError('Book copy not found', 404);
    }

    res.json({ message: 'Book copy status updated successfully' });
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to update book copy status');
  }
};

// Delete book copy
exports.deleteBookCopy = async (req, res) => {
  try {
    const { copyId } = req.params;

    const [result] = await pool.query('DELETE FROM book_copies WHERE copy_id = ?', [copyId]);

    if (result.affectedRows === 0) {
      throw new APIError('Book copy not found', 404);
    }

    res.json({ message: 'Book copy deleted successfully' });
  } catch (error) {
    throw new APIError('Failed to delete book copy');
  }
};
