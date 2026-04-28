/**
 * Book Management Routes
 * CRUD operations for books and inventory management
 */

const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken, requireLibrarian, requireStudent } = require('../middleware/auth');
const { validateISBN, validateRequired } = require('../utils/validator');
const {
  APIError,
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /books
 * List all books with filters
 * Public endpoint (anyone can search)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      search,
      category,
      author,
      available = true,
      page = 1,
      limit = 20,
      sortBy = 'title',
    } = req.query;

    let query = supabase
      .from('books')
      .select('*');

    // Filters
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,isbn.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (available === 'true') {
      query = query.gt('available_copies', 0);
    }

    // Sorting
    const sortOptions = {
      title: { column: 'title', ascending: true },
      newest: { column: 'created_at', ascending: false },
      popular: { column: 'borrowed_count', ascending: false },
    };
    const sortOption = sortOptions[sortBy] || sortOptions.title;
    query = query.order(sortOption.column, { ascending: sortOption.ascending });

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: books, error, count } = await query;

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  })
);

router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const { data, error } = await supabase
      .from('books')
      .select(
        `
        *,
        categories!category_id(id, name),
        authors:book_authors(author_id)
      `
      )
      .order('borrowed_count', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data,
    });
  })
);

router.get(
  '/category/:categoryId',
  asyncHandler(async (req, res) => {
    const { limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { categoryId } = req.params;

    const { data, error, count } = await supabase
      .from('books')
      .select(
        `
        *,
        categories!category_id(id, name),
        authors:book_authors(author_id)
      `,
        { count: 'exact' }
      )
      .eq('category_id', categoryId)
      .order('title', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  })
);

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 20, sortBy = 'title' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('books')
      .select(
        `
        *,
        categories: category_id (id, name),
        authors: book_authors (author_id)
      `,
        { count: 'exact' }
      );

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,isbn.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    const sortMap = {
      title: 'title.asc',
      newest: 'created_at.desc',
      popular: 'borrowed_count.desc',
    };

    query = query.order(sortMap[sortBy] || 'title.asc');
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  })
);

router.get(
  '/:id/copies',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('books')
      .select('id, title, available_copies, total_copies')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Book');
    }

    res.json({
      success: true,
      data: {
        ...data,
        isAvailable: data.available_copies > 0,
      },
    });
  })
);

/**
 * GET /books/:id
 * Get single book details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data: book, error } = await supabase
      .from('books')
      .select(
        `
        *,
        categories:category_id(id, name),
        authors:book_authors(author_id),
        reviews:book_reviews(id, rating, comment, user_id, created_at)
      `
      )
      .eq('id', req.params.id)
      .single();

    if (!book || error) {
      throw new NotFoundError('Book');
    }

    // Calculate average rating
    const avgRating =
      book.reviews.length > 0
        ? (
            book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
          ).toFixed(2)
        : null;

    res.json({
      success: true,
      data: {
        ...book,
        averageRating: avgRating,
        reviewCount: book.reviews.length,
      },
    });
  })
);

/**
 * POST /books
 * Create new book (Librarian/Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const {
      title,
      isbn,
      author,
      publisher,
      categoryId,
      description,
      totalCopies,
      language,
      publicationYear,
    } = req.body;

    // Validation
    const titleValidation = validateRequired(title, 'Title');
    if (!titleValidation.valid) throw new ValidationError(titleValidation.error);

    if (isbn && !validateISBN(isbn)) {
      throw new ValidationError('Invalid ISBN format');
    }

    if (!totalCopies || totalCopies < 1) {
      throw new ValidationError('Total copies must be at least 1');
    }

    // Check if ISBN already exists (if provided)
    if (isbn) {
      const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', isbn)
        .single();

      if (existingBook) {
        throw new ConflictError('Book with this ISBN already exists');
      }
    }

    // Create book
    const { data: newBook, error: bookError } = await supabaseAdmin
      .from('books')
      .insert([
        {
          title,
          isbn,
          publisher,
          category_id: categoryId,
          description,
          total_copies: parseInt(totalCopies),
          available_copies: parseInt(totalCopies),
          language,
          publication_year: publicationYear,
          created_by: req.userId,
          created_at: new Date(),
          status: 'active',
        },
      ])
      .select()
      .single();

    if (bookError) {
      throw new APIError(bookError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: newBook,
    });
  })
);

/**
 * PUT /books/:id
 * Update book details (Librarian/Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { title, description, categoryId, language, status } = req.body;

    // Check if book exists
    const { data: existingBook } = await supabase
      .from('books')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existingBook) {
      throw new NotFoundError('Book');
    }

    // Update book
    const { data: updatedBook, error } = await supabaseAdmin
      .from('books')
      .update({
        title,
        description,
        category_id: categoryId,
        language,
        status,
        updated_at: new Date(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  })
);

/**
 * DELETE /books/:id
 * Delete book (Admin only, soft delete)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { data: existingBook } = await supabase
      .from('books')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existingBook) {
      throw new NotFoundError('Book');
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('books')
      .update({
        status: 'deleted',
        deleted_at: new Date(),
      })
      .eq('id', req.params.id);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  })
);

/**
 * POST /books/:id/review
 * Add review to book (Students only)
 */
router.post(
  '/:id/review',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Check if book exists
    const { data: book } = await supabase
      .from('books')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!book) {
      throw new NotFoundError('Book');
    }

    // Create review
    const { data: review, error } = await supabaseAdmin
      .from('book_reviews')
      .insert([
        {
          book_id: req.params.id,
          user_id: req.userId,
          rating: parseInt(rating),
          comment: comment || null,
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review,
    });
  })
);

/**
 * GET /books/:id/recommendations
 * Get AI-based book recommendations based on this book
 */
router.get(
  '/:id/recommendations',
  asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;

    // Get the current book's category and metadata
    const { data: book } = await supabase
      .from('books')
      .select('category_id, id')
      .eq('id', req.params.id)
      .single();

    if (!book) {
      throw new NotFoundError('Book');
    }

    // Get similar books from same category
    const { data: recommendations, error } = await supabase
      .from('books')
      .select('*')
      .eq('category_id', book.category_id)
      .neq('id', req.params.id)
      .gt('available_copies', 0)
      .order('borrowed_count', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: recommendations,
    });
  })
);

/**
 * POST /books/scan-qr
 * Get book details by scanning QR code
 * Body: { qrCode }
 */
router.post(
  '/scan-qr',
  asyncHandler(async (req, res) => {
    const { qrCode } = req.body;

    if (!qrCode) {
      throw new ValidationError('QR code is required');
    }

    // Search for book by QR code in qr_codes table
    const { data: qrCodeRecord, error: qrError } = await supabase
      .from('qr_codes')
      .select('entity_id')
      .eq('qr_data', qrCode)
      .eq('entity_type', 'book')
      .single();

    let bookId = null;

    // If found in QR codes table, use that
    if (qrCodeRecord) {
      bookId = qrCodeRecord.entity_id;
    } else {
      // Otherwise try to match by ISBN (in case QR contains ISBN)
      const { data: bookByIsbn } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', qrCode)
        .single();

      if (bookByIsbn) {
        bookId = bookByIsbn.id;
      }
    }

    if (!bookId) {
      return res.status(404).json({
        success: false,
        message: 'Book not found for this QR code'
      });
    }

    // Get full book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        *,
        categories!category_id(id, name)
      `)
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      throw new NotFoundError('Book');
    }

    res.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        author: book.author,
        publisher: book.publisher,
        pages: book.pages,
        category: book.categories?.name,
        cover_image_url: book.cover_image_url,
        available_copies: book.available_copies,
        total_copies: book.total_copies,
        description: book.description
      }
    });
  })
);

module.exports = router;
