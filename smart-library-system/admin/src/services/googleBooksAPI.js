/**
 * Google Books API Service
 * Fetch book data from Google Books using ISBN or title
 */

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY || '';

// Fallback: OpenLibrary API (free, no key required)
const OPENLIBRARY_API_URL = 'https://openlibrary.org';

/**
 * Search books by ISBN
 * @param {string} isbn - ISBN number (10 or 13 digits)
 * @returns {Promise<Object>} Book data
 */
export const searchByISBN = async (isbn) => {
  try {
    // Try Google Books API first if key is available
    if (API_KEY) {
      try {
        return await searchGoogleBooksISBN(isbn);
      } catch (error) {
        console.warn('Google Books API failed, trying OpenLibrary:', error);
      }
    }

    // Fallback to OpenLibrary
    return await searchOpenLibraryISBN(isbn);
  } catch (error) {
    console.error('Error searching ISBN:', error);
    throw new Error(`Failed to fetch book data for ISBN ${isbn}: ${error.message}`);
  }
};

/**
 * Search books by title
 * @param {string} title - Book title
 * @returns {Promise<Array>} Array of book results
 */
export const searchByTitle = async (title) => {
  try {
    // Try Google Books API first if key is available
    if (API_KEY) {
      try {
        return await searchGoogleBooksTitle(title);
      } catch (error) {
        console.warn('Google Books API failed, trying OpenLibrary:', error);
      }
    }

    // Fallback to OpenLibrary
    return await searchOpenLibraryTitle(title);
  } catch (error) {
    console.error('Error searching title:', error);
    throw new Error(`Failed to search for books with title "${title}": ${error.message}`);
  }
};

/**
 * Google Books API - Search by ISBN
 * @private
 */
const searchGoogleBooksISBN = async (isbn) => {
  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    key: API_KEY,
  });

  const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Books API returned ${response.status}: ${error}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('No books found with this ISBN on Google Books');
  }

  return parseGoogleBooksData(data.items[0]);
};

/**
 * Google Books API - Search by Title
 * @private
 */
const searchGoogleBooksTitle = async (title) => {
  const params = new URLSearchParams({
    q: `intitle:${title}`,
    maxResults: '10',
    key: API_KEY,
  });

  const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Books API returned ${response.status}: ${error}`);
  }

  const data = await response.json();

  if (!data.items) {
    return [];
  }

  return data.items.map(item => parseGoogleBooksData(item));
};

/**
 * OpenLibrary API - Search by ISBN (Free, No Key Required)
 * @private
 */
const searchOpenLibraryISBN = async (isbn) => {
  // Remove hyphens from ISBN
  const cleanISBN = isbn.replace(/-/g, '');

  const response = await fetch(`${OPENLIBRARY_API_URL}/isbn/${cleanISBN}.json`);

  if (!response.ok) {
    throw new Error(`OpenLibrary returned ${response.status}`);
  }

  const data = await response.json();
  return parseOpenLibraryData(data);
};

/**
 * OpenLibrary API - Search by Title (Free, No Key Required)
 * @private
 */
const searchOpenLibraryTitle = async (title) => {
  const params = new URLSearchParams({
    title: title,
    limit: '10',
  });

  const response = await fetch(`${OPENLIBRARY_API_URL}/search.json?${params}`);

  if (!response.ok) {
    throw new Error(`OpenLibrary returned ${response.status}`);
  }

  const data = await response.json();

  if (!data.docs) {
    return [];
  }

  return data.docs.map(doc => parseOpenLibrarySearchData(doc));
};

/**
 * Parse book data from Google Books API response
 * @param {Object} item - Book item from Google Books API
 * @returns {Object} Parsed book data
 */
const parseGoogleBooksData = (item) => {
  const volumeInfo = item.volumeInfo || {};
  const industryIdentifiers = volumeInfo.industryIdentifiers || [];

  // Get ISBN10 and ISBN13
  const isbn10 = industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier;
  const isbn13 = industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier;
  const isbn = isbn13 || isbn10 || '';

  return {
    id: item.id,
    source: 'google_books',
    isbn,
    isbn10,
    isbn13,
    title: volumeInfo.title || 'Unknown Title',
    authors: volumeInfo.authors || [],
    description: volumeInfo.description || '',
    publisher: volumeInfo.publisher || '',
    publishedDate: volumeInfo.publishedDate || '',
    pages: volumeInfo.pageCount || 0,
    language: volumeInfo.language || 'en',
    categories: volumeInfo.categories || [],
    imageUrl: volumeInfo.imageLinks?.thumbnail || '',
    previewLink: volumeInfo.previewLink || '',
  };
};

/**
 * Parse book data from OpenLibrary ISBN API response
 * @param {Object} data - Book data from OpenLibrary
 * @returns {Object} Parsed book data
 */
const parseOpenLibraryData = (data) => {
  const isbn13 = data.isbn_13?.[0] || '';
  const isbn10 = data.isbn_10?.[0] || '';
  const isbn = isbn13 || isbn10 || '';

  return {
    id: data.key || '',
    source: 'openlibrary',
    isbn,
    isbn10,
    isbn13,
    title: data.title || 'Unknown Title',
    authors: (data.authors || []).map(author => author.name || ''),
    description: data.description?.value || '',
    publisher: data.publishers?.[0] || '',
    publishedDate: data.first_publish_date || '',
    pages: data.number_of_pages || 0,
    language: data.languages?.[0]?.key?.replace('/languages/', '') || 'en',
    categories: data.subjects?.slice(0, 5) || [],
    imageUrl: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg` : '',
    previewLink: `https://openlibrary.org${data.key}`,
  };
};

/**
 * Parse book data from OpenLibrary search API response
 * @param {Object} doc - Book document from OpenLibrary search
 * @returns {Object} Parsed book data
 */
const parseOpenLibrarySearchData = (doc) => {
  const isbn13 = doc.isbn?.[0] || '';
  const isbn = isbn13 || '';

  return {
    id: doc.key || '',
    source: 'openlibrary',
    isbn,
    isbn13,
    isbn10: '',
    title: doc.title || 'Unknown Title',
    authors: doc.author_name || [],
    description: '',
    publisher: doc.publisher?.[0] || '',
    publishedDate: doc.first_publish_year?.toString() || '',
    pages: doc.number_of_pages_median || 0,
    language: 'en',
    categories: doc.subject?.slice(0, 5) || [],
    imageUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
    previewLink: `https://openlibrary.org${doc.key}`,
  };
};

const googleBooksAPIService = {
  searchByISBN,
  searchByTitle,
  searchGoogleBooksISBN,
  searchGoogleBooksTitle,
  searchOpenLibraryISBN,
  searchOpenLibraryTitle,
};

export default googleBooksAPIService;
