import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  InputAdornment,
  Alert,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  LibraryBooks,
  CheckCircle,
  Warning,
  QrCode2,
  Inventory2,
  Download,
  Check,
} from '@mui/icons-material';
import { useAdmin } from '../context/AdminContext';
import { searchByISBN } from '../services/googleBooksAPI';
import { generateBatchQRCodeIds, generateQRCodeImage } from '../services/qrCodeService';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Books Management Page
 * Comprehensive book management with inventory, ISBN search, and QR code generation
 * Combines functionality from Books.js and AddBooks.jsx
 */
const BooksManagement = () => {
  const { addNotification } = useAdmin();
  const barcodeInputRef = useRef(null);
  const qrInputRef = useRef(null);

  // ============================================================
  // State Management
  // ============================================================

  // Tab Navigation
  const [activeTab, setActiveTab] = useState(0);

  // Books List State
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Advanced Add Books State (Tab 1)
  const [isbnInput, setIsbnInput] = useState('');
  const [selectedBookFromAPI, setSelectedBookFromAPI] = useState(null);
  const [bookCopies, setBookCopies] = useState([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualBookForm, setManualBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    category: '',
    shelves: [],
    pages: '',
    description: '',
    imageUrl: '',
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const imageFileInputRef = useRef(null);
  const [isUpdatingBook, setIsUpdatingBook] = useState(false);

  // Generate QR Codes State (Tab 2)
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [qrCodeCount, setQrCodeCount] = useState(30);

  // Category & Shelf Dialogs
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [openShelfDialog, setOpenShelfDialog] = useState(false);
  const [shelfForm, setShelfForm] = useState({ name: '', rackNumber: '', description: '' });
  const [shelves, setShelves] = useState([]);
  const [editingShelf, setEditingShelf] = useState(null);

  // ============================================================
  // Fetch Books and Categories from Backend
  // ============================================================

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      // Support multiple backend response formats safely
      const data = response.data.data || response.data.categories || (Array.isArray(response.data) ? response.data : []);
      setCategories(data);
      console.log('Categories loaded:', data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      console.error('Categories API error:', err.response?.data);
    }
  };

  const fetchShelves = async () => {
    try {
      const response = await api.get('/api/shelves');
      // Support multiple backend response formats safely
      const data = response.data.data || response.data.shelves || (Array.isArray(response.data) ? response.data : []);
      setShelves(data);
    } catch (err) {
      console.error('Failed to fetch shelves:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchShelves();
    fetchBooks();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/books');
      
      if (response.data.success && response.data.data) {
        // Normalize snake_case to camelCase
        const normalizedBooks = response.data.data.map(book => ({
          id: book.id || book.book_id || book._id,
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          category: book.category,
          publisher: book.publisher,
          totalCopies: book.total_copies || book.totalCopies || 0,
          availableCopies: book.available_copies || book.availableCopies || 0,
          issuedCopies: book.issued_copies || book.issuedCopies || 0,
          description: book.description,
          isAvailable: (book.available_copies || book.availableCopies || 0) > 0,
          createdAt: book.created_at,
          updatedAt: book.updated_at,
          // Keep original snake_case fields too
          ...book
        }));
        setBooks(normalizedBooks);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('Failed to load books. Please try again.');
      // Demo data if backend unavailable
      setBooks([
        {
          id: '1',
          isbn: '978-0-123456-78-9',
          title: 'React Handbook',
          author: 'John Doe',
          category: 'Programming',
          publisher: 'Tech Books Inc',
          totalCopies: 5,
          availableCopies: 3,
          issuedCopies: 2,
          isAvailable: true,
          createdAt: '2024-01-15',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Category & Shelf Handlers
  // ============================================================
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      addNotification('Category name is required', 'error');
      return;
    }
    try {
      setLoading(true);
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim()
        });
        addNotification('Category updated successfully', 'success');
      } else {
        await api.post('/api/categories', {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim()
        });
        addNotification('Category added successfully', 'success');
      }
      setCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
      fetchCategories(); // Refresh the categories dropdown
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save category';
      addNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/api/categories/${id}`);
        addNotification('Category deleted successfully', 'success');
        fetchCategories();
      } catch (err) {
        addNotification('Failed to delete category', 'error');
      }
    }
  };

  const handleSaveShelf = async () => {
    if (!shelfForm.name.trim() || !shelfForm.rackNumber.trim()) {
      addNotification('Shelf name and rack number are required', 'error');
      return;
    }
    try {
      setLoading(true);
      if (editingShelf) {
        await api.put(`/api/shelves/${editingShelf.id}`, {
          name: shelfForm.name.trim(),
          rack_number: shelfForm.rackNumber.trim(),
          description: shelfForm.description.trim()
        });
        addNotification('Shelf updated successfully', 'success');
      } else {
        await api.post('/api/shelves', {
          name: shelfForm.name.trim(),
          rack_number: shelfForm.rackNumber.trim(),
          description: shelfForm.description.trim()
        });
        addNotification('Shelf added successfully', 'success');
      }
      setShelfForm({ name: '', rackNumber: '', description: '' });
      setEditingShelf(null);
      fetchShelves();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save shelf';
      addNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditShelf = (shelf) => {
    setEditingShelf(shelf);
    setShelfForm({ name: shelf.name, rackNumber: shelf.rack_number || shelf.rackNumber, description: shelf.description || '' });
  };

  const handleDeleteShelf = async (id) => {
    if (window.confirm('Are you sure you want to delete this shelf/rack?')) {
      try {
        await api.delete(`/api/shelves/${id}`);
        addNotification('Shelf deleted successfully', 'success');
        fetchShelves();
      } catch (err) {
        addNotification('Failed to delete shelf', 'error');
      }
    }
  };

  // ============================================================
  // Books List Tab (Tab 0) Handlers
  // ============================================================

  const handleUpdateBookDetails = async () => {
    if (!selectedBookFromAPI?.dbId) {
      addNotification('No book selected for update', 'error');
      return;
    }

    try {
      setIsUpdatingBook(true);

      // Validate required fields
      if (!manualBookForm.title || !manualBookForm.author || !manualBookForm.isbn || !manualBookForm.category) {
        setError('Title, Author, ISBN, and Category are required');
        setIsUpdatingBook(false);
        return;
      }

      const bookData = {
        title: manualBookForm.title.trim(),
        author: manualBookForm.author.trim(),
        isbn: manualBookForm.isbn.trim(),
        publisher: manualBookForm.publisher?.trim() || '',
        category: manualBookForm.category || null,
        shelves: manualBookForm.shelves || [],
        description: manualBookForm.description?.trim() || '',
        cover_image_url: manualBookForm.imageUrl?.trim() || null,
      };

      console.log('Updating book ID:', selectedBookFromAPI.dbId);
      await api.put(`/api/admin/books/${selectedBookFromAPI.dbId}`, bookData);
      addNotification('Book details updated successfully', 'success');
      setSelectedBookFromAPI(null);
      setManualBookForm({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        category: '',
        shelves: [],
        pages: '',
        description: '',
        imageUrl: '',
      });
      setBookCopies([]);
      fetchBooks();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update book';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      console.error('Update book error:', err);
    } finally {
      setIsUpdatingBook(false);
    }
  };

  const handleDeleteBook = async (bookId, force = false) => {
    if (!bookId) {
      addNotification('Error: Invalid Book ID', 'error');
      return;
    }

    const message = force
      ? 'âš ï¸ WARNING: This book has issued copies! Are you absolutely sure you want to FORCE delete it? This cannot be undone.'
      : 'Are you sure you want to delete this book and all its available copies?';

    if (window.confirm(message)) {
      try {
        setLoading(true);
        const endpoint = force ? `/api/admin/books/${bookId}?force=true` : `/api/admin/books/${bookId}`;
        await api.delete(endpoint);
        addNotification('Book deleted successfully', 'success');
        fetchBooks();
      } catch (err) {
        if (err.response?.status === 409 && !force) {
          const conflictMsg = err.response?.data?.message || err.response?.data?.error || 'This book currently has issued copies.';
          if (window.confirm(`${conflictMsg}\n\nDo you want to FORCE delete it anyway?`)) {
            handleDeleteBook(bookId, true);
          }
        } else {
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete book';
          setError(errorMsg);
          addNotification(errorMsg, 'error');
          console.error('Delete book error:', err);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Load book to Tab 1 for copy management - Load directly from database without API search
  const handleManageCopies = async (book) => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Fetch full book details from database (includes copies)
      const response = await api.get(`/api/admin/books/${book.id}`);
      const bookDetails = response.data.book || response.data.data;

      if (!bookDetails) {
        setError('Failed to load book details');
        addNotification('Failed to load book details', 'error');
        return;
      }

      // Step 2: Build structured book object from database (skip API search)
      const structuredBook = {
        dbId: book.id,
        isbn: bookDetails.isbn || book.isbn,
        title: bookDetails.title || book.title,
        authors: [bookDetails.author || book.author],
        publisher: bookDetails.publisher || book.publisher || 'Unknown',
        pages: bookDetails.pages || book.pages || '',
        imageUrl: bookDetails.cover_image_url || book.cover_image_url || book.imageUrl || '',
        description: bookDetails.description || '',
        category: bookDetails.category || book.category || 'General',
        isManualEntry: true // Flag indicating this is from database, not API
      };

      setSelectedBookFromAPI(structuredBook);
      setIsbnInput(bookDetails.isbn || book.isbn);

      // Step 3: Populate manual form with database data for display
      setManualBookForm({
        isbn: bookDetails.isbn || book.isbn || '',
        title: bookDetails.title || book.title || '',
        author: bookDetails.author || book.author || '',
        publisher: bookDetails.publisher || book.publisher || '',
        category: bookDetails.category || book.category || '',
        pages: bookDetails.pages || book.pages || '',
        description: bookDetails.description || book.description || '',
        imageUrl: bookDetails.cover_image_url || book.cover_image_url || book.imageUrl || '',
      });

      // Step 4: Load existing copies from database
      if (bookDetails && bookDetails.copies && Array.isArray(bookDetails.copies) && bookDetails.copies.length > 0) {
        const existingCopies = bookDetails.copies.map(copy => ({
          id: copy.id || copy.copy_id,
          isbn: bookDetails.isbn || book.isbn,
          qrCode: copy.qr_code || copy.qrCode,
          addedAt: new Date(copy.created_at || copy.createdAt || Date.now()).toLocaleString(),
          isExisting: true // Flag to prevent re-saving existing copies
        }));
        setBookCopies(existingCopies);
        addNotification(`âœ… Loaded ${existingCopies.length} existing copies`, 'success');
      } else {
        setBookCopies([]); // Reset if no copies found
        addNotification('No existing copies found - Ready to add new copies', 'info');
      }

      // Step 5: Switch to Tab 1 and prepare for QR scanning
      setActiveTab(1);
      setIsManualEntry(true); // Set manual entry mode since we're loading from database
      addNotification(`ðŸ“š Ready to manage copies for "${bookDetails.title || book.title}"`, 'success');
      
      // Step 6: Focus the QR input for scanning
      setTimeout(() => {
        if (qrInputRef.current) {
          qrInputRef.current.focus();
        }
      }, 100);
    } catch (err) {
      console.error('Error loading book for copy management:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load book details';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.isbn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================================
  // Advanced Add Books Tab (Tab 1) Handlers
  // ============================================================

  const handleISBNSearch = async (e) => {
    e.preventDefault();
    const queryIsbn = isbnInput.trim();
    if (!queryIsbn) {
      setError('Please enter an ISBN');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const normalizeIsbn = (isbn) => (isbn || '').replace(/[- ]/g, '');
      const existingBook = books.find(b => normalizeIsbn(b.isbn) === normalizeIsbn(queryIsbn));
      
      if (existingBook) {
        addNotification('Book found in database. Loading existing copies...', 'success');
        await handleManageCopies(existingBook);
        return;
      }

      const bookData = await searchByISBN(queryIsbn);

      if (!bookData) {
        // Book not found - Auto-switch to manual entry mode with pre-filled ISBN
        setError('');
        addNotification(
          'ðŸ“Œ Book not found in Google Books database. Switching to manual entry mode...',
          'warning'
        );
        
        // Pre-fill the manual entry form with the ISBN
        setManualBookForm(prev => ({
          ...prev,
          isbn: queryIsbn
        }));
        
        // Switch to manual entry mode
        setIsManualEntry(true);
        setSelectedBookFromAPI(null);
        setBookCopies([]);
        
        // Focus on title field after switching
        setTimeout(() => {
          const titleInputs = document.querySelectorAll('input[placeholder*="Enter book title"]');
          if (titleInputs.length > 0) {
            titleInputs[titleInputs.length - 1].focus();
          }
        }, 100);
        
        return;
      }

      setSelectedBookFromAPI(bookData);
      addNotification(`âœ… Found: ${bookData.title}`, 'success');
    } catch (err) {
      setError(`Error: ${err.message}`);
      addNotification('Failed to search book', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQRCodeScan = (qrCode) => {
    if (!selectedBookFromAPI) {
      setError('Please select a book first');
      return;
    }

    const exists = bookCopies.some(copy => copy.qrCode === qrCode);
    if (exists) {
      addNotification('This QR code is already assigned to this book', 'warning');
      return;
    }

    const newCopy = {
      id: Date.now(),
      isbn: selectedBookFromAPI.isbn,
      qrCode,
      addedAt: new Date().toLocaleString(),
    };

    setBookCopies([...bookCopies, newCopy]);
    addNotification(`Copy added (Total: ${bookCopies.length + 1})`, 'success');

    if (qrInputRef.current) {
      qrInputRef.current.value = '';
      qrInputRef.current.focus();
    }
  };

  const handleQRInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const qrCode = e.target.value.trim();
      if (qrCode) {
        handleQRCodeScan(qrCode);
        e.target.value = '';
      }
    }
  };

  const handleRemoveCopy = async (id) => {
    const copyToRemove = bookCopies.find(c => c.id === id);

    if (copyToRemove && copyToRemove.isExisting) {
      if (window.confirm('Are you sure you want to permanently delete this existing copy from the database?')) {
        try {
          setLoading(true);
          const bookId = selectedBookFromAPI?.dbId;
          await api.delete(`/api/admin/books/${bookId}/copies/${copyToRemove.id}`);
          setBookCopies(bookCopies.filter(copy => copy.id !== id));
          addNotification('Copy deleted from database', 'success');
          fetchBooks(); // Refresh the main list to update copy counts
        } catch (err) {
          console.error('Failed to delete copy:', err);
          const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to delete copy from database';
          addNotification(errorMsg, 'error');
        } finally {
          setLoading(false);
        }
      }
    } else {
      setBookCopies(bookCopies.filter(copy => copy.id !== id));
      addNotification('New copy removed', 'info');
    }
  };

  const handleSaveBookWithCopies = async () => {
    if (!selectedBookFromAPI) {
      setError('Please select a book first');
      return;
    }

    const newCopies = bookCopies.filter(copy => !copy.isExisting);

    if (newCopies.length === 0) {
      addNotification('No new copies to save. Existing copies are already stored.', 'info');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const bookData = {
        isbn: selectedBookFromAPI.isbn,
        title: selectedBookFromAPI.title,
        author: selectedBookFromAPI.authors?.join(', ') || '',
        publisher: selectedBookFromAPI.publisher || '',
        publishedDate: selectedBookFromAPI.publishedDate || '',
        pages: selectedBookFromAPI.pages || 0,
        category: 'General',
        imageUrl: selectedBookFromAPI.imageUrl || '',
        description: selectedBookFromAPI.description || '',
        quantity: newCopies.length,
        copies: newCopies.map(copy => ({
          qrCode: copy.qrCode
        }))
      };

      const response = await api.post('/api/admin/books/add', bookData);

      if (response.data.success) {
        addNotification(response.data.message || 'Book added successfully', 'success');
        setSelectedBookFromAPI(null);
        setBookCopies([]);
        setIsbnInput('');
        fetchBooks(); // Refresh the books list
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save book';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      console.error('Save book error:', err);
      console.error('Response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Manual Book Entry Handlers
  const handleManualBookChange = (field, value) => {
    setManualBookForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualBookForm(prev => ({
          ...prev,
          imageUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadManualBook = () => {
    if (!manualBookForm.title || !manualBookForm.author || !manualBookForm.isbn) {
      addNotification('Please enter ISBN, title, and author', 'error');
      return;
    }

    // Check if ISBN already exists in the local database
    const normalizeIsbn = (isbn) => (isbn || '').replace(/[- ]/g, '');
    const existingBook = books.find(b => normalizeIsbn(b.isbn) === normalizeIsbn(manualBookForm.isbn));
    
    if (existingBook) {
      addNotification(`A book with ISBN ${manualBookForm.isbn} already exists in the database.`, 'error');
      return;
    }

    // Load manual book to selectedBookFromAPI
    setSelectedBookFromAPI({
      title: manualBookForm.title,
      authors: [manualBookForm.author],
      publisher: manualBookForm.publisher || 'Unknown',
      pages: manualBookForm.pages || '',
      imageUrl: manualBookForm.imageUrl || '',
      description: manualBookForm.description || '',
      isbn: manualBookForm.isbn,
      category: manualBookForm.category || 'General'
    });

    setBookCopies([]); // Reset scanned copies
    addNotification('Book loaded - Ready to scan QR codes', 'success');
    
    // Focus QR input
    setTimeout(() => {
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    }, 100);
  };

  // ============================================================
  // Generate QR Codes Tab (Tab 2) Handlers
  // ============================================================

  const handleGenerateQRCodes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const newCodes = generateBatchQRCodeIds(qrCodeCount);
      
      const codesWithImages = await Promise.all(
        newCodes.map(async (code) => {
          const imageUrl = await generateQRCodeImage(code);
          return { id: code, imageUrl };
        })
      );

      setGeneratedQRCodes(codesWithImages);
      addNotification(`Generated ${qrCodeCount} QR codes`, 'success');
    } catch (err) {
      setError(`Error generating QR codes: ${err.message}`);
      addNotification('Failed to generate QR codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQRCodes = () => {
    const html = `
      <html>
        <head>
          <title>Book QR Codes</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            .qr-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
            .qr-item { border: 1px solid #ddd; padding: 10px; text-align: center; page-break-inside: avoid; }
            .qr-item img { width: 150px; height: 150px; }
            .qr-item small { display: block; margin-top: 5px; word-break: break-all; font-size: 10px; }
            @media print { body { margin: 0; } .qr-item { padding: 15px; } }
          </style>
        </head>
        <body>
          <h1>Book QR Codes - Print Sheet</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <div class="qr-grid">
            ${generatedQRCodes.map(qr => `
              <div class="qr-item">
                <img src="${qr.imageUrl}" alt="${qr.id}" />
                <small>${qr.id}</small>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-Codes-${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('QR codes downloaded', 'success');
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        ðŸ“š Books Management System
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Book List" icon={<LibraryBooks />} iconPosition="start" />
        <Tab label="Add Books (ISBN)" icon={<Add />} iconPosition="start" />
        <Tab label="Generate QR Codes" icon={<QrCode2 />} iconPosition="start" />
      </Tabs>

      {/* ========================================================== */}
      {/* TAB 0: Book List View */}
      {/* ========================================================== */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: '600' }}>
              All Books ({filteredBooks.length})
            </Typography>
            
          </Box>

          {/* Search Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search books by title, author, ISBN, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenCategoryDialog(true)}
                >
                  Add Category
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenShelfDialog(true)}
                >
                  Add Shelve
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Books Table */}
          <Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell>Book Details</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>ISBN</TableCell>
                      <TableCell>Copies</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBooks.length > 0 ? (
                      filteredBooks.map((book) => (
                        <TableRow key={book.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <LibraryBooks sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {book.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {book.publisher}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>
                            <Chip label={book.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{book.isbn}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {book.availableCopies}/{book.totalCopies} available
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {book.issuedCopies || 0} issued
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={book.isAvailable ? 'Available' : 'Unavailable'}
                              size="small"
                              color={book.isAvailable ? 'success' : 'warning'}
                              icon={book.isAvailable ? <CheckCircle /> : <Warning />}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleManageCopies(book)}
                              color="info"
                              title="Manage individual copies and QR codes"
                            >
                              <Inventory2 />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBook(book.id || book.book_id || book._id)}
                              color="error"
                              title="Delete book"
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            {searchTerm ? 'No books match your search' : 'No books found'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      )}

      {/* ========================================================== */}
      {/* TAB 1: Advanced Add Books (ISBN Search & Manual Entry) */}
      {/* ========================================================== */}
      {activeTab === 1 && (
        <Box>
          {/* Mode Toggle */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant={!isManualEntry ? 'contained' : 'outlined'}
              onClick={() => {
                setIsManualEntry(false);
                setSelectedBookFromAPI(null);
                setBookCopies([]);
              }}
            >
              ðŸ” ISBN Search
            </Button>
            <Button
              variant={isManualEntry ? 'contained' : 'outlined'}
              onClick={() => {
                setIsManualEntry(true);
                setSelectedBookFromAPI(null);
                setBookCopies([]);
              }}
            >
              âœï¸ Manual Entry
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Left: ISBN Search or Manual Entry */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  {!isManualEntry ? (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        ðŸ” Scan ISBN Code
                      </Typography>

                      <form onSubmit={handleISBNSearch}>
                        <TextField
                          fullWidth
                          label="ISBN Barcode"
                          placeholder="Scan or enter ISBN..."
                          value={isbnInput}
                          onChange={(e) => setIsbnInput(e.target.value)}
                          disabled={loading}
                          inputRef={barcodeInputRef}
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Inventory2 />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          disabled={loading}
                          sx={{ mb: 2 }}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Search From Google Books'}
                        </Button>
                      </form>

                      {selectedBookFromAPI && (
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            âœ… Book Found
                          </Typography>
                          <Typography variant="body2"><strong>Title:</strong> {selectedBookFromAPI.title}</Typography>
                          <Typography variant="body2"><strong>Author:</strong> {selectedBookFromAPI.authors?.join(', ')}</Typography>
                          <Typography variant="body2"><strong>ISBN:</strong> {selectedBookFromAPI.isbn}</Typography>
                          <Typography variant="body2"><strong>Publisher:</strong> {selectedBookFromAPI.publisher}</Typography>
                          <Typography variant="body2"><strong>Pages:</strong> {selectedBookFromAPI.pages}</Typography>
                          {selectedBookFromAPI.imageUrl && (
                            <img src={selectedBookFromAPI.imageUrl} alt={selectedBookFromAPI.title} style={{ maxHeight: '150px', marginTop: '10px' }} />
                          )}
                        </Paper>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        âœï¸ Enter Book Details Manually
                      </Typography>

                      {/* Auto-switch notification for ISBN not found */}
                      {manualBookForm.isbn === isbnInput && isbnInput && !selectedBookFromAPI?.isManualEntry && (
                        <Alert severity="info" sx={{ mb: 2 }} icon={<Inventory2 />}>
                          <Typography variant="body2">
                            <strong>ðŸ“Œ ISBN Not Found:</strong> The ISBN "{isbnInput}" was not found in Google Books database. 
                            Please enter the book details manually. You'll still be able to manage multiple copies with QR codes.
                          </Typography>
                        </Alert>
                      )}



                      <TextField
                        fullWidth
                        label="ISBN"
                        placeholder="Enter ISBN (e.g. 978...)"
                        value={manualBookForm.isbn}
                        onChange={(e) => handleManualBookChange('isbn', e.target.value)}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        label="Title"
                        placeholder="Enter book title..."
                        value={manualBookForm.title}
                        onChange={(e) => handleManualBookChange('title', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Author"
                        placeholder="Enter author name..."
                        value={manualBookForm.author}
                        onChange={(e) => handleManualBookChange('author', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Publisher"
                        placeholder="Enter publisher..."
                        value={manualBookForm.publisher}
                        onChange={(e) => handleManualBookChange('publisher', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      
                      {/* Category Dropdown */}
                      <TextField
                        fullWidth
                        select
                        label="Category"
                        value={manualBookForm.category}
                        onChange={(e) => handleManualBookChange('category', e.target.value)}
                        sx={{ mb: 2 }}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </TextField>

                      {/* Shelves Multi-select */}
                      <TextField
                        fullWidth
                        select
                        SelectProps={{ multiple: true }}
                        label="Shelves/Racks"
                        value={manualBookForm.shelves || []}
                        onChange={(e) => handleManualBookChange('shelves', e.target.value)}
                        sx={{ mb: 2 }}
                      >
                        {shelves.map((shelf) => (
                          <MenuItem key={shelf.id} value={shelf.name}>
                            {shelf.name} (Rack: {shelf.rack_number || shelf.rackNumber})
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth
                        label="Pages"
                        placeholder="Number of pages..."
                        type="number"
                        value={manualBookForm.pages}
                        onChange={(e) => handleManualBookChange('pages', e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Description"
                        placeholder="Enter book description..."
                        multiline
                        rows={3}
                        value={manualBookForm.description}
                        onChange={(e) => handleManualBookChange('description', e.target.value)}
                        sx={{ mb: 2 }}
                      />

                      {/* Image Upload */}
                      <Box sx={{ mb: 2 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => imageFileInputRef.current?.click()}
                          startIcon={<Download />}
                        >
                          {selectedImageFile ? 'ðŸ“¸ Change Image' : 'ðŸ“¸ Choose Image'}
                        </Button>
                        <input
                          ref={imageFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileSelect}
                          style={{ display: 'none' }}
                        />
                      </Box>

                      {/* Image Preview */}
                      {manualBookForm.imageUrl && (
                        <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', textAlign: 'center', mb: 2 }}>
                          <img
                            src={manualBookForm.imageUrl}
                            alt="Book preview"
                            style={{ maxHeight: '150px' }}
                          />
                          <Typography variant="caption" display="block">
                            Image selected
                          </Typography>
                        </Paper>
                      )}

                      {/* Action Buttons */}
                      {selectedBookFromAPI?.dbId ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            onClick={() => {
                              setSelectedBookFromAPI(null);
                              setManualBookForm({
                                isbn: '',
                                title: '',
                                author: '',
                                publisher: '',
                                category: '',
                                shelves: [],
                                pages: '',
                                description: '',
                                imageUrl: '',
                              });
                              setBookCopies([]);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={handleUpdateBookDetails}
                            disabled={isUpdatingBook || loading}
                            startIcon={<Check />}
                          >
                            {isUpdatingBook ? <CircularProgress size={24} /> : 'Update Book Details'}
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          onClick={handleLoadManualBook}
                          disabled={loading}
                        >
                          Load Book for QR Scanning
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right: QR Code Scanning & Quantity */}
            <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  ðŸ“± Scan Book QR Codes
                </Typography>

                {selectedBookFromAPI ? (
                  <>
                    <TextField
                      fullWidth
                      label="QR Code"
                      placeholder="Scan each book copy QR code..."
                      inputRef={qrInputRef}
                      onKeyPress={handleQRInput}
                      sx={{ mb: 2 }}
                      helperText="Press ENTER after each scan to add copy"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <QrCode2 />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff3cd', borderRadius: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#856404' }}>
                        Total Copies: {bookCopies.length}
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>QR Code</TableCell>
                            <TableCell>Added</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bookCopies.map((copy) => (
                            <TableRow key={copy.id}>
                              <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                {copy.qrCode}
                                {copy.isExisting && (
                                  <Chip label="Saved" size="small" color="success" sx={{ ml: 1, height: '20px', fontSize: '10px' }} />
                                )}
                              </TableCell>
                              <TableCell>{copy.addedAt}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveCopy(copy.id)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={handleSaveBookWithCopies}
                      disabled={loading || bookCopies.filter(c => !c.isExisting).length === 0}
                      sx={{ mt: 2 }}
                      startIcon={<Check />}
                    >
                      Save {bookCopies.filter(c => !c.isExisting).length} New Copies
                    </Button>
                  </>
                ) : (
                  null
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </Box>
      )}

      {/* ========================================================== */}
      {/* TAB 2: Generate QR Codes */}
      {/* ========================================================== */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              ðŸŽ² Generate Random QR Codes
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of QR Codes"
                  value={qrCodeCount}
                  onChange={(e) => setQrCodeCount(Math.max(1, parseInt(e.target.value) || 30))}
                  inputProps={{ min: 1, max: 500 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleGenerateQRCodes}
                  disabled={loading}
                  sx={{ height: '56px' }}
                  startIcon={<QrCode2 />}
                >
                  {loading ? <CircularProgress size={24} /> : `Generate ${qrCodeCount} Codes`}
                </Button>
              </Grid>
            </Grid>

            {generatedQRCodes.length > 0 && (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleDownloadQRCodes}
                  startIcon={<Download />}
                  sx={{ mb: 2 }}
                >
                  Download Print Sheet
                </Button>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Generated QR Codes ({generatedQRCodes.length})
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 2,
                  mt: 2,
                }}>
                  {generatedQRCodes.map((qr) => (
                    <Paper key={qr.id} sx={{ p: 1, textAlign: 'center' }}>
                      <img src={qr.imageUrl} alt={qr.id} style={{ width: '100%', height: 'auto' }} />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, wordBreak: 'break-all' }}>
                        {qr.id}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}


      {/* ========================================================== */}
      {/* Add Category Dialog */}
      {/* ========================================================== */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Book Category' : 'Manage Book Categories'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              {editingCategory && (
                <Button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); }}>
                  Cancel Edit
                </Button>
              )}
              <Button onClick={handleSaveCategory} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (editingCategory ? 'Update Category' : 'Add Category')}
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Existing Categories</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
              <Table size="small" stickyHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleEditCategory(cat)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteCategory(cat.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow><TableCell colSpan={2} align="center">No categories found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCategoryDialog(false); setEditingCategory(null); setCategoryForm({ name: '', description: '' }); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================== */}
      {/* Add Shelf Dialog */}
      {/* ========================================================== */}
      <Dialog open={openShelfDialog} onClose={() => setOpenShelfDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingShelf ? 'Edit Shelve / Rack' : 'Manage Shelves / Racks'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Shelve Name/Code"
              value={shelfForm.name}
              onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
              placeholder="e.g., Fiction-A"
              required
            />
            <TextField
              fullWidth
              label="Rack Number"
              value={shelfForm.rackNumber}
              onChange={(e) => setShelfForm({ ...shelfForm, rackNumber: e.target.value })}
              placeholder="e.g., Rack 3"
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={shelfForm.description}
              onChange={(e) => setShelfForm({ ...shelfForm, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              {editingShelf && (
                <Button onClick={() => { setEditingShelf(null); setShelfForm({ name: '', rackNumber: '', description: '' }); }}>
                  Cancel Edit
                </Button>
              )}
              <Button onClick={handleSaveShelf} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (editingShelf ? 'Update Shelve' : 'Add Shelve')}
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Existing Shelves & Racks</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
              <Table size="small" stickyHeader>
                <TableBody>
                  {shelves.map((shelf) => (
                    <TableRow key={shelf.id}>
                      <TableCell>
                        <strong>{shelf.name}</strong><br/>
                        <Typography variant="caption" color="text.secondary">Rack: {shelf.rack_number || shelf.rackNumber}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleEditShelf(shelf)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteShelf(shelf.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {shelves.length === 0 && (
                    <TableRow><TableCell colSpan={2} align="center">No shelves found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenShelfDialog(false); setEditingShelf(null); setShelfForm({ name: '', rackNumber: '', description: '' }); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BooksManagement;
