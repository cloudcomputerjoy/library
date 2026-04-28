/**
 * Books Controller
 * Handles book search, listing, and detail retrieval
 */

const { supabase } = require('../config/database');

/**
 * List all books with search and filters
 */
exports.listBooks = async (req, res) => {
  try {
    const {
      search = '',
      category = null,
      page = 1,
      limit = 20,
      sortBy = 'title',
      sortOrder = 'asc',
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from('books')
      .select(
        `
        *,
        category: category_id (id, name, color),
        authors: book_authors (author: author_id (id, name))
      `,
        { count: 'exact' }
      );

    // Apply search filter
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,isbn.ilike.%${search}%`
      );
    }

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Apply sorting
    const validSortFields = ['title', 'publication_year', 'created_at', 'available_copies'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'title';
    const ascending = sortOrder === 'asc';

    query = query.order(sortField, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
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
 * Get book details by ID
 */
exports.getBookDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('books')
      .select(
        `
        *,
        category: category_id (id, name, color, icon),
        authors: book_authors (
          author: author_id (id, name, bio, country)
        ),
        reviews: book_reviews (
          id,
          rating,
          comment,
          user: user_id (id, full_name, profile_image_url),
          created_at
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get categories
 */
exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get book availability
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { bookId } = req.params;

    const { data, error } = await supabase
      .from('books')
      .select('id, title, available_copies, total_copies, is_available')
      .eq('id', bookId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        ...data,
        availabilityStatus:
          data.available_copies > 0 ? 'available' : 'not_available',
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
 * Search books by ISBN
 */
exports.searchByISBN = async (req, res) => {
  try {
    const { isbn } = req.query;

    if (!isbn) {
      return res.status(400).json({
        success: false,
        message: 'ISBN is required',
      });
    }

    const { data, error } = await supabase
      .from('books')
      .select(
        `
        *,
        category: category_id (id, name),
        authors: book_authors (author: author_id (id, name))
      `
      )
      .eq('isbn', isbn)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get popular books
 */
exports.getPopularBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('books')
      .select(
        `
        *,
        category: category_id (id, name),
        authors: book_authors (author: author_id (id, name)),
        issue_count: transactions(count)
      `
      )
      .limit(limit)
      .order('publication_year', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
