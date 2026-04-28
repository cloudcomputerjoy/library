// Books Controller - Supabase Integration

const {
  supabase,
  getAll,
  getById,
  create,
  update,
  deleteRecord,
  logAdminAction,
  searchBooks,
} = require('../config/supabase-new');
const { v4: uuidv4 } = require('uuid');

// ============================================
// BOOK MANAGEMENT
// ============================================

/**
 * GET /api/admin/books
 * Get all books with filtering
 */
const getBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;

    let query = supabase
      .from('books')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (page - 1) * parseInt(limit);
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
    console.error('Get books error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch books',
    });
  }
};

/**
 * GET /api/admin/books/:id
 * Get single book with copies
 */
const getBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await getById('books', id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found',
      });
    }

    // Get all copies
    const { data: copies } = await supabase
      .from('book_copies')
      .select('*')
      .eq('book_id', id)
      .order('created_at', { ascending: true });

    return res.json({
      success: true,
      data: {
        ...book,
        copies: copies || [],
      },
    });
  } catch (error) {
    console.error('Get book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch book',
    });
  }
};

/**
 * POST /api/admin/books
 * Create new book
 */
const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, publisher, category, description, cover_image_url } = req.body;

    if (!title || !isbn) {
      return res.status(400).json({
        success: false,
        error: 'Title and ISBN are required',
      });
    }

    const book = await create('books', {
      title,
      author: author || null,
      isbn,
      publisher: publisher || null,
      category: category || null,
      description: description || null,
      cover_image_url: cover_image_url || null,
      status: 'active',
    });

    await logAdminAction(
      req.user.id,
      'create',
      'book',
      book.id,
      { title, isbn, author }
    );

    return res.status(201).json({
      success: true,
      data: book,
      message: 'Book created successfully',
    });
  } catch (error) {
    console.error('Create book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create book',
    });
  }
};

/**
 * PUT /api/admin/books/:id
 * Update book
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, publisher, category, description, cover_image_url, total_copies, available_copies } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Book ID is required',
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (publisher) updateData.publisher = publisher;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (cover_image_url) updateData.cover_image_url = cover_image_url;
    if (total_copies !== undefined && total_copies !== null) updateData.total_copies = total_copies;
    if (available_copies !== undefined && available_copies !== null) updateData.available_copies = available_copies;

    // Update timestamp
    updateData.updated_at = new Date().toISOString();

    const book = await update('books', id, updateData);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found or update failed',
      });
    }

    await logAdminAction(
      req.user?.id || 'system',
      'update',
      'book',
      id,
      updateData
    );

    return res.json({
      success: true,
      data: book,
      message: 'Book updated successfully',
    });
  } catch (error) {
    console.error('Update book error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update book',
    });
  }
};

/**
 * DELETE /api/admin/books/:id
 * Delete book (soft delete)
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Book ID is required',
      });
    }

    // Soft delete - mark as deleted
    const result = await update('books', id, { 
      status: 'deleted',
      updated_at: new Date().toISOString()
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Book not found',
      });
    }

    await logAdminAction(
      req.user?.id || 'system',
      'delete',
      'book',
      id,
      { status: 'deleted' }
    );

    return res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete book',
    });
  }
};

// ============================================
// BOOK COPIES MANAGEMENT
// ============================================

/**
 * POST /api/admin/books/:id/copies
 * Add book copies
 */
const addBookCopies = async (req, res, next) => {
  try {
    const { id: book_id } = req.params;
    const { count = 1, shelf_location, qr_codes } = req.body;

    if (!book_id) {
      return res.status(400).json({
        success: false,
        error: 'Book ID is required',
      });
    }

    if (count < 1) {
      return res.status(400).json({
        success: false,
        error: 'Copy count must be at least 1',
      });
    }

    const copies = [];
    
    // If manual QR codes provided, use them
    if (qr_codes && Array.isArray(qr_codes) && qr_codes.length > 0) {
      for (const qr_code of qr_codes) {
        if (qr_code.trim()) {
          copies.push({
            book_id,
            qr_code: qr_code.trim(),
            status: 'available',
            location: shelf_location || 'A-1-1-1',
            assigned_at: new Date().toISOString(),
          });
        }
      }
    } else {
      // Auto-generate QR codes
      for (let i = 0; i < parseInt(count); i++) {
        const qr_code = `QR-${uuidv4()}`;
        copies.push({
          book_id,
          qr_code,
          status: 'available',
          location: shelf_location || 'A-1-1-1',
          assigned_at: new Date().toISOString(),
        });
      }
    }

    if (copies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid QR codes provided',
      });
    }

    const { data: created, error } = await supabase
      .from('book_copies')
      .insert(copies)
      .select();

    if (error) throw error;

    // Update book total_copies and available_copies
    const book = await getById('books', book_id);
    const newTotal = (book.total_copies || 0) + created.length;
    const newAvailable = (book.available_copies || 0) + created.length;
    
    await update('books', book_id, {
      total_copies: newTotal,
      available_copies: newAvailable,
      updated_at: new Date().toISOString(),
    });

    await logAdminAction(
      req.user?.id || 'system',
      'create',
      'book_copy',
      book_id,
      { count: created.length, method: qr_codes ? 'manual' : 'auto' }
    );

    return res.status(201).json({
      success: true,
      data: created,
      message: `${created.length} copies added successfully`,
    });
  } catch (error) {
    console.error('Add book copies error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to add book copies',
    });
  }
};

/**
 * GET /api/admin/books/:id/copies
 * Get all copies of a book
 */
const getBookCopies = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('book_copies')
      .select('*')
      .eq('book_id', id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    return res.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Get book copies error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch book copies',
    });
  }
};

/**
 * PUT /api/admin/books/:id/copies/:copyId
 * Update book copy status and details
 */
const updateBookCopy = async (req, res, next) => {
  try {
    const { id: book_id, copyId } = req.params;
    const { status, location, barcode } = req.body;

    if (!copyId) {
      return res.status(400).json({
        success: false,
        error: 'Copy ID is required',
      });
    }

    const updateData = { updated_at: new Date().toISOString() };
    
    if (status) updateData.status = status;
    if (location) updateData.location = location;
    if (barcode) updateData.barcode = barcode;

    // Check if copy exists
    const { data: existing } = await supabase
      .from('book_copies')
      .select('*')
      .eq('id', copyId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Book copy not found',
      });
    }

    const { data: copy, error } = await supabase
      .from('book_copies')
      .update(updateData)
      .eq('id', copyId)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      req.user?.id || 'system',
      'update',
      'book_copy',
      copyId,
      updateData
    );

    return res.json({
      success: true,
      data: copy,
      message: 'Copy updated successfully',
    });
  } catch (error) {
    console.error('Update book copy error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update book copy',
    });
  }
};

/**
 * DELETE /api/admin/books/:bookId/copies/:copyId
 * Delete book copy
 */
const deleteBookCopy = async (req, res, next) => {
  try {
    const { bookId, copyId } = req.params;

    await deleteRecord('book_copies', copyId);

    // Update book total_copies
    const book = await getById('books', bookId);
    await update('books', bookId, {
      total_copies: Math.max(0, (book.total_copies || 1) - 1),
    });

    await logAdminAction(
      req.user.id,
      'delete',
      'book_copy',
      copyId,
      {}
    );

    return res.json({
      success: true,
      message: 'Copy deleted successfully',
    });
  } catch (error) {
    console.error('Delete book copy error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete book copy',
    });
  }
};

/**
 * GET /api/admin/books/search
 * Search books
 */
const searchBooksEndpoint = async (req, res, next) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query required',
      });
    }

    const books = await searchBooks(q, parseInt(limit));

    return res.json({
      success: true,
      data: books,
      count: books?.length || 0,
    });
  } catch (error) {
    console.error('Search books error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search books',
    });
  }
};

module.exports = {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  addBookCopies,
  getBookCopies,
  updateBookCopy,
  deleteBookCopy,
  searchBooksEndpoint,
};
