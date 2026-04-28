// Advanced Books Controller - QR Code & ISBN Integration
// Handles book management with QR code generation and batch operations

const { supabase } = require('../config/supabase-new');
const { v4: uuidv4 } = require('uuid');

// ============================================
// QR CODE GENERATION UTILITIES
// ============================================

/**
 * Generate unique QR code ID
 * Format: BK-{timestamp}-{random}
 */
const generateQRCodeId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

/**
 * Generate batch QR code IDs
 */
const generateBatchQRCodeIds = (count) => {
  return Array.from({ length: count }, () => generateQRCodeId());
};

// ============================================
// BOOK MANAGEMENT ENDPOINTS
// ============================================

/**
 * POST /api/admin/books/add
 * Add new book with multiple copies and QR codes
 * 
 * Request body:
 * {
 *   isbn: "9780135957073",
 *   title: "JavaScript Design Patterns",
 *   author: "Addy Osmani",
 *   publisher: "O'Reilly Media",
 *   publishedDate: "2012",
 *   pages: 268,
 *   category: "Technology",
 *   imageUrl: "https://...",
 *   description: "...",
 *   quantity: 5,
 *   copies: [
 *     { qrCode: "BK-...-1" },
 *     { qrCode: "BK-...-2" }
 *   ]
 * }
 */
const addBook = async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publishedDate,
      pages,
      category,
      imageUrl,
      description,
      quantity,
      copies = []
    } = req.body;

    // Validation
    if (!isbn || !title) {
      return res.status(400).json({
        success: false,
        error: 'ISBN and title are required'
      });
    }

    if (!quantity || quantity < 1 || copies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one copy with QR code is required'
      });
    }

    // Check if ISBN already exists
    const { data: existingBook } = await supabase
      .from('books')
      .select('*')
      .eq('isbn', isbn)
      .single();

    let book;

    if (existingBook) {
      // Update existing book - increment quantity
      const existingCopies = (existingBook.total_copies || 0);
      const newQuantity = existingCopies + quantity;
      
      const { data: updatedBook, error: updateError } = await supabase
        .from('books')
        .update({
          total_copies: newQuantity,
          available_copies: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingBook.id)
        .select()
        .single();

      if (updateError) throw updateError;
      book = updatedBook;
    } else {
      // Create new book
      const { data: newBook, error: createError } = await supabase
        .from('books')
        .insert({
          isbn,
          title,
          author: author || null,
          publisher: publisher || null,
          published_date: publishedDate || null,
        pages: pages ? parseInt(pages) : null,
          category: category || null,
          cover_image_url: imageUrl || null,
          description: description || null,
          total_copies: quantity,
          available_copies: quantity,
          is_available: true,
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;
      book = newBook;
    }

    // Add book copies with QR codes
    const bookCopies = copies.map((copy, index) => ({
      book_id: book.id,
      qr_code: copy.qrCode,
      isbn: isbn,
      copy_number: (existingBook ? existingBook.total_copies : 0) + index + 1,
      barcode: copy.qrCode,
      status: 'available',
      condition: 'good'
    }));

    const { data: insertedCopies, error: copiesError } = await supabase
      .from('book_copies')
      .insert(bookCopies)
      .select();

    if (copiesError) throw copiesError;

    return res.status(existingBook ? 200 : 201).json({
      success: true,
      message: existingBook
        ? `Book updated successfully with ${quantity} new copies`
        : `Book added successfully with ${quantity} copies`,
      book: {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        quantity: book.total_copies,
        availableCopies: book.available_copies,
        createdAt: book.created_at,
        copies: insertedCopies
      }
    });
  } catch (error) {
    console.error('Add book error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      context: error.context,
      status: error.status
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to add book',
      message: error.message,
      code: error.code,
      details: error.details
    });
  }
};

/**
 * GET /api/admin/books?page=1&limit=10&search=...&category=...
 * Get all books with pagination and filtering
 */
const getBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    let query = supabase
      .from('books')
      .select('*', { count: 'exact' });

    // Filters
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Sorting
    const validSortFields = ['title', 'author', 'created_at', 'total_copies'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'title';
    const ascending = sortOrder === 'asc';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: books, count, error } = await query
      .order(sortField, { ascending })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Transform to camelCase
    const transformedBooks = books.map(book => ({
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      category: book.category,
      imageUrl: book.cover_image_url,
      quantity: book.total_copies,
      availableCopies: book.available_copies,
      status: book.is_available ? 'active' : 'inactive',
      createdAt: book.created_at
    }));

    return res.json({
      success: true,
      books: transformedBooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch books'
    });
  }
};

/**
 * GET /api/admin/books/:id
 * Get single book with all copies
 */
const getBook = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Get all copies
    const { data: copies, error: copiesError } = await supabase
      .from('book_copies')
      .select('*')
      .eq('book_id', id)
      .order('copy_number', { ascending: true });

    if (copiesError) throw copiesError;

    return res.json({
      success: true,
      book: {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        pages: book.pages,
        category: book.category,
        imageUrl: book.cover_image_url,
        description: book.description,
        quantity: book.total_copies,
        availableCopies: book.available_copies,
        status: book.is_available ? 'active' : 'inactive',
        createdAt: book.created_at,
        copies: copies.map(copy => ({
          id: copy.id,
          qrCode: copy.qr_code,
          status: copy.status,
          condition: copy.condition,
          issuedTo: copy.issued_to ? { id: copy.issued_to } : null,
          issuedDate: copy.issued_date,
          dueDate: copy.due_date
        }))
      }
    });
  } catch (error) {
    console.error('Get book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch book'
    });
  }
};

/**
 * POST /api/admin/books/search-qr
 * Find book by scanning QR code
 */
const searchByQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'QR code is required'
      });
    }

    // Find copy by QR code
    const { data: copy, error: copyError } = await supabase
      .from('book_copies')
      .select('*')
      .eq('qr_code', qrCode)
      .single();

    if (copyError || !copy) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Get associated book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', copy.book_id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    return res.json({
      success: true,
      book: {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        quantity: book.total_copies,
        imageUrl: book.cover_image_url
      },
      copy: {
        id: copy.id,
        qrCode: copy.qr_code,
        status: copy.status
      }
    });
  } catch (error) {
    console.error('Search QR error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search by QR code'
    });
  }
};

/**
 * PUT /api/admin/books/:id
 * Update book details
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      author,
      publisher,
      pages,
      category,
      description,
      imageUrl,
      status
    } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (publisher) updateData.publisher = publisher;
    if (pages) updateData.pages = parseInt(pages);
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (imageUrl) updateData.cover_image_url = imageUrl;
    if (status) updateData.is_available = status === 'active';

    const { data: book, error } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    return res.json({
      success: true,
      message: 'Book updated successfully',
      book: {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        quantity: book.total_copies
      }
    });
  } catch (error) {
    console.error('Update book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update book'
    });
  }
};

/**
 * PUT /api/admin/books/:id/quantity
 * Add or remove book copies
 */
const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityChange, action, copies = [] } = req.body;

    if (!quantityChange || !action || !['add', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'quantityChange and action (add/remove) are required'
      });
    }

    // Get current book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    const currentQuantity = book.total_copies;

    if (action === 'remove') {
      // Cannot remove more than available
      if (quantityChange > book.available_copies) {
        return res.status(409).json({
          success: false,
          error: `Cannot remove ${quantityChange} copies. Only ${book.available_copies} available copies.`
        });
      }

      // Remove copies (find by condition)
      const { data: copiesToRemove, error: findError } = await supabase
        .from('book_copies')
        .select('id')
        .eq('book_id', id)
        .eq('status', 'available')
        .limit(quantityChange);

      if (findError) throw findError;

      if (copiesToRemove.length < quantityChange) {
        return res.status(409).json({
          success: false,
          error: 'Not enough available copies to remove'
        });
      }

      const copyIds = copiesToRemove.map(c => c.id);
      await supabase
        .from('book_copies')
        .delete()
        .in('id', copyIds);

      // Update book quantity
      const newQuantity = currentQuantity - quantityChange;
      const { data: updatedBook } = await supabase
        .from('books')
        .update({
          total_copies: newQuantity,
          available_copies: Math.min(book.available_copies - quantityChange, newQuantity),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      return res.json({
        success: true,
        message: `Quantity updated: ${currentQuantity} → ${newQuantity} copies`,
        book: {
          id: updatedBook.id,
          quantity: updatedBook.total_copies,
          availableCopies: updatedBook.available_copies
        }
      });
    } else {
      // Add action - insert new copies
      if (!copies || copies.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'QR codes for new copies are required'
        });
      }

      const newCopies = copies.map((copy, index) => ({
        book_id: id,
        qr_code: copy.qrCode,
        isbn: book.isbn,
        copy_number: currentQuantity + index + 1,
        barcode: copy.qrCode,
        status: 'available',
        condition: 'good'
      }));

      const { data: insertedCopies, error: insertError } = await supabase
        .from('book_copies')
        .insert(newCopies)
        .select();

      if (insertError) throw insertError;

      // Update book quantity
      const newQuantity = currentQuantity + quantityChange;
      const { data: updatedBook } = await supabase
        .from('books')
        .update({
          total_copies: newQuantity,
          available_copies: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      return res.json({
        success: true,
        message: `Quantity updated: ${currentQuantity} → ${newQuantity} copies`,
        book: {
          id: updatedBook.id,
          quantity: updatedBook.total_copies,
          availableCopies: updatedBook.available_copies
        }
      });
    }
  } catch (error) {
    console.error('Update quantity error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update quantity'
    });
  }
};

/**
 * DELETE /api/admin/books/:id
 * Delete book and all copies
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;

    // Get book with copies
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Check for issued copies
    const { data: issuedCopies, error: checkError } = await supabase
      .from('book_copies')
      .select('*')
      .eq('book_id', id)
      .eq('status', 'issued');

    if (checkError) throw checkError;

    if (issuedCopies && issuedCopies.length > 0 && !force) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete book with ${issuedCopies.length} issued copies. Use force=true to override.`
      });
    }

    // Delete all copies (cascade)
    const { error: copiesDeleteError } = await supabase
      .from('book_copies')
      .delete()
      .eq('book_id', id);

    if (copiesDeleteError) throw copiesDeleteError;

    // Delete book
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return res.json({
      success: true,
      message: 'Book and all copies deleted successfully',
      deletedBook: {
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        quantity: book.total_copies
      }
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete book'
    });
  }
};

/**
 * POST /api/admin/books/generate-qr-codes
 * Generate batch QR codes for printing
 */
const generateQRCodes = async (req, res) => {
  try {
    const { quantity = 50 } = req.body;

    if (quantity < 1 || quantity > 500) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be between 1 and 500'
      });
    }

    const codes = generateBatchQRCodeIds(parseInt(quantity));

    return res.json({
      success: true,
      codes,
      count: codes.length,
      message: `Generated ${codes.length} random QR codes`
    });
  } catch (error) {
    console.error('Generate QR codes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate QR codes'
    });
  }
};

/**
 * DELETE /api/admin/books/:id/copies/:copyId
 * Delete single book copy (for damaged books)
 */
const deleteBookCopy = async (req, res) => {
  try {
    const { id, copyId } = req.params;

    // Get copy
    const { data: copy, error: copyError } = await supabase
      .from('book_copies')
      .select('*')
      .eq('id', copyId)
      .eq('book_id', id)
      .single();

    if (copyError || !copy) {
      return res.status(404).json({
        success: false,
        error: 'Book copy not found'
      });
    }

    if (copy.status !== 'available') {
      return res.status(409).json({
        success: false,
        error: 'Can only delete available copies'
      });
    }

    // Check if it's the only copy
    const { data: allCopies, error: countError } = await supabase
      .from('book_copies')
      .select('*')
      .eq('book_id', id);

    if (countError) throw countError;

    if (allCopies.length === 1) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete the only copy of a book'
      });
    }

    // Delete copy
    const { error: deleteError } = await supabase
      .from('book_copies')
      .delete()
      .eq('id', copyId);

    if (deleteError) throw deleteError;

    // Update book quantity
    const { data: updatedBook } = await supabase
      .from('books')
      .update({
        total_copies: allCopies.length - 1,
        available_copies: allCopies.length - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return res.json({
      success: true,
      message: 'Book copy deleted successfully',
      remaining: {
        quantity: updatedBook.total_copies,
        availableCopies: updatedBook.available_copies
      }
    });
  } catch (error) {
    console.error('Delete copy error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete book copy'
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  addBook,
  getBooks,
  getBook,
  searchByQRCode,
  updateBook,
  updateQuantity,
  deleteBook,
  generateQRCodes,
  deleteBookCopy,
  generateQRCodeId,
  generateBatchQRCodeIds
};
