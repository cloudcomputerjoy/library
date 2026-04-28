/**
 * Books API Service
 * All book-related API calls (search, detail, availability, etc.)
 */

import { apiClient } from './api';

// ============================================================
// BOOK SEARCH & DISCOVERY
// ============================================================

/**
 * Search books with filters and pagination
 * @param {string} query - Search query (title, author, isbn)
 * @param {string} category - Category filter
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Promise<{books, totalCount, hasMore}>}
 */
export const searchBooks = async (query = '', category = 'all', page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/books', {
      params: {
        search: query,
        category: category !== 'all' ? category : undefined,
        page,
        limit,
      },
    });

    return {
      books: response.data.books || [],
      totalCount: response.data.totalCount || 0,
      currentPage: page,
      hasMore: page < Math.ceil((response.data.totalCount || 0) / limit),
    };
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};

/**
 * Get book details with availability
 * @param {string} bookId - Book ID
 * @returns {Promise<{book, copies, availability}>}
 */
export const getBookDetail = async (bookId) => {
  try {
    const response = await apiClient.get(`/books/${bookId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching book detail:', error);
    throw error;
  }
};

/**
 * Get featured/recommended books
 * @param {number} limit - Number of books to fetch
 * @returns {Promise<Book[]>}
 */
export const getFeaturedBooks = async (limit = 6) => {
  try {
    const response = await apiClient.get('/books/featured', {
      params: { limit },
    });
    return response.data.books || [];
  } catch (error) {
    console.error('Error fetching featured books:', error);
    throw error;
  }
};

/**
 * Get books by category
 * @param {string} category - Category name
 * @param {number} limit - Items per page
 * @returns {Promise<Book[]>}
 */
export const getBooksByCategory = async (category, limit = 10) => {
  try {
    const response = await apiClient.get('/books', {
      params: { category, limit },
    });
    return response.data.books || [];
  } catch (error) {
    console.error('Error fetching books by category:', error);
    throw error;
  }
};

/**
 * Get available categories
 * @returns {Promise<Category[]>}
 */
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/categories');
    return response.data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Add book to wishlist/bookmarks
 * @param {string} bookId - Book ID
 * @returns {Promise<{success}>}
 */
export const bookmarkBook = async (bookId) => {
  try {
    const response = await apiClient.post(`/users/bookmarks`, {
      bookId,
    });
    return { success: true, bookmark: response.data };
  } catch (error) {
    console.error('Error bookmarking book:', error);
    throw error;
  }
};

/**
 * Remove book from bookmarks
 * @param {string} bookId - Book ID
 * @returns {Promise<{success}>}
 */
export const removeBookmark = async (bookId) => {
  try {
    await apiClient.delete(`/users/bookmarks/${bookId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
};

/**
 * Get user's bookmarked books
 * @returns {Promise<Book[]>}
 */
export const getBookmarkedBooks = async () => {
  try {
    const response = await apiClient.get('/users/bookmarks');
    return response.data.books || [];
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
};

// ============================================================
// BOOK AVAILABILITY & RESERVATIONS
// ============================================================

/**
 * Check if a book copy is available for issue
 * @param {string} bookId - Book ID
 * @returns {Promise<{isAvailable, availableCopies}>}
 */
export const checkBookAvailability = async (bookId) => {
  try {
    const response = await apiClient.get(`/books/${bookId}/availability`);
    return response.data;
  } catch (error) {
    console.error('Error checking book availability:', error);
    throw error;
  }
};

/**
 * Reserve a book
 * @param {string} bookId - Book ID
 * @returns {Promise<{reservation, estimatedAvailableDate}>}
 */
export const reserveBook = async (bookId) => {
  try {
    const response = await apiClient.post(`/issues/reserve`, {
      bookId,
    });
    return response.data;
  } catch (error) {
    console.error('Error reserving book:', error);
    throw error;
  }
};

/**
 * Get user's reservations
 * @returns {Promise<Reservation[]>}
 */
export const getReservations = async () => {
  try {
    const response = await apiClient.get('/issues/reservations');
    return response.data.reservations || [];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

/**
 * Cancel a reservation
 * @param {string} reservationId - Reservation ID
 * @returns {Promise<{success}>}
 */
export const cancelReservation = async (reservationId) => {
  try {
    await apiClient.delete(`/issues/reservations/${reservationId}`);
    return { success: true };
  } catch (error) {
    console.error('Error canceling reservation:', error);
    throw error;
  }
};

// ============================================================
// QR CODE SCANNING
// ============================================================

/**
 * Get book details by scanning QR code
 * @param {string} qrCode - QR code scanned from book
 * @returns {Promise<Book>}
 */
export const getBookByQRCode = async (qrCode) => {
  try {
    const response = await apiClient.post('/books/scan-qr', {
      qrCode,
    });
    return response.data.book || response.data;
  } catch (error) {
    console.error('Error scanning QR code:', error);
    throw error;
  }
};

export default {
  searchBooks,
  getBookDetail,
  getFeaturedBooks,
  getBooksByCategory,
  getCategories,
  bookmarkBook,
  removeBookmark,
  getBookmarkedBooks,
  checkBookAvailability,
  reserveBook,
  getReservations,
  cancelReservation,
  getBookByQRCode,
};
