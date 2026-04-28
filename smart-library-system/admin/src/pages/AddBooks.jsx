import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  QrCode2,
  Inventory2,
  Delete,
  Add,
  Download,
  Check,
} from '@mui/icons-material';
import { useAdmin } from '../context/AdminContext';
import { searchByISBN } from '../services/googleBooksAPI';
import { generateBatchQRCodeIds, generateQRCodeImage } from '../services/qrCodeService';
import {
  FormFieldSkeleton,
  QRCodeGridSkeleton,
} from '../components/SkeletonLoader';

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
 * Add Books Page
 * Advanced book management with ISBN scanning, Google Books API, and QR code generation
 */

const AddBooks = () => {
  const { addNotification } = useAdmin();
  const barcodeInputRef = useRef(null);
  const qrInputRef = useRef(null);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [isbnInput, setIsbnInput] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookCopies, setBookCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedQRCodes, setGeneratedQRCodes] = useState([]);
  const [qrCodeCount, setQrCodeCount] = useState(30);

  /**
   * Handle ISBN scan/search
   */
  const handleISBNSearch = async (e) => {
    e.preventDefault();
    if (!isbnInput.trim()) {
      setError('Please enter an ISBN');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Search for book by ISBN
      const bookData = await searchByISBN(isbnInput);

      if (!bookData) {
        setError('Book not found. Please enter a valid ISBN');
        return;
      }

      setSelectedBook(bookData);
      addNotification(`Found: ${bookData.title}`, 'success');
    } catch (err) {
      setError(`Error: ${err.message}`);
      addNotification('Failed to search book', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle QR code scan for book copy
   */
  const handleQRCodeScan = (qrCode) => {
    if (!selectedBook) {
      setError('Please select a book first');
      return;
    }

    // Check if QR code already assigned
    const exists = bookCopies.some(copy => copy.qrCode === qrCode);
    if (exists) {
      addNotification('This QR code is already assigned to this book', 'warning');
      return;
    }

    // Add new copy
    const newCopy = {
      id: Date.now(),
      isbn: selectedBook.isbn,
      qrCode,
      addedAt: new Date().toLocaleString(),
    };

    setBookCopies([...bookCopies, newCopy]);
    addNotification(`Copy added (Total: ${bookCopies.length + 1})`, 'success');

    // Clear QR input
    if (qrInputRef.current) {
      qrInputRef.current.value = '';
      qrInputRef.current.focus();
    }
  };

  /**
   * Handle QR code input
   */
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

  /**
   * Generate random QR codes for printing
   */
  const handleGenerateQRCodes = async () => {
    try {
      setLoading(true);
      const newCodes = generateBatchQRCodeIds(qrCodeCount);
      
      // Generate images for each QR code
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

  /**
   * Download QR codes as print sheet
   */
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
  };

  /**
   * Remove book copy
   */
  const handleRemoveCopy = (id) => {
    setBookCopies(bookCopies.filter(copy => copy.id !== id));
    addNotification('Copy removed', 'info');
  };

  /**
   * Save book with all copies
   */
  const handleSaveBook = async () => {
    if (!selectedBook || bookCopies.length === 0) {
      setError('Please add at least one book copy');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare request payload
      const bookData = {
        isbn: selectedBook.isbn,
        title: selectedBook.title,
        author: selectedBook.authors?.join(', ') || '',
        publisher: selectedBook.publisher || '',
        publishedDate: selectedBook.publishedDate || '',
        pages: selectedBook.pages || 0,
        category: 'General',
        imageUrl: selectedBook.imageUrl || '',
        description: selectedBook.description || '',
        quantity: bookCopies.length,
        copies: bookCopies.map(copy => ({
          qrCode: copy.qrCode
        }))
      };

      // Call backend API
      const response = await api.post('/api/admin/books/add', bookData);

      if (response.data.success) {
        addNotification(response.data.message, 'success');
        
        // Reset form
        setSelectedBook(null);
        setBookCopies([]);
        setIsbnInput('');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to save book';
      setError(errorMsg);
      addNotification(errorMsg, 'error');
      console.error('Save book error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        📚 Advanced Book Management
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Add Books" icon={<Add />} iconPosition="start" />
        <Tab label="Generate QR Codes" icon={<QrCode2 />} iconPosition="start" />
        <Tab label="Book Inventory" icon={<Inventory2 />} iconPosition="start" />
      </Tabs>

      {/* TAB 1: Add Books */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Left: ISBN Scanning & Book Details */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  🔍 Scan ISBN Code
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading ? (
                  <FormFieldSkeleton count={4} />
                ) : (
                  <>
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

                    {selectedBook && (
                      <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          ✅ Book Found
                        </Typography>
                        <Typography variant="body2"><strong>Title:</strong> {selectedBook.title}</Typography>
                        <Typography variant="body2"><strong>Author:</strong> {selectedBook.authors?.join(', ')}</Typography>
                        <Typography variant="body2"><strong>ISBN:</strong> {selectedBook.isbn}</Typography>
                        <Typography variant="body2"><strong>Publisher:</strong> {selectedBook.publisher}</Typography>
                        <Typography variant="body2"><strong>Pages:</strong> {selectedBook.pages}</Typography>
                        {selectedBook.imageUrl && (
                          <img src={selectedBook.imageUrl} alt={selectedBook.title} style={{ maxHeight: '150px', marginTop: '10px' }} />
                        )}
                      </Paper>
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
                  📱 Scan Book QR Codes
                </Typography>

                {selectedBook ? (
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
                      onClick={handleSaveBook}
                      disabled={loading || bookCopies.length === 0}
                      sx={{ mt: 2 }}
                      startIcon={<Check />}
                    >
                      Save Book with {bookCopies.length} Copies
                    </Button>
                  </>
                ) : (
                  <Alert severity="info">
                    👈 Scan ISBN code first to select a book
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: Generate QR Codes */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              🎲 Generate Random QR Codes
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Generate batch QR codes to print and stick on physical books
            </Alert>

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

            {loading && generatedQRCodes.length === 0 ? (
              <QRCodeGridSkeleton count={15} />
            ) : generatedQRCodes.length > 0 ? (
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
                      <img
                        src={qr.imageUrl}
                        alt={qr.id}
                        style={{ width: '100%', height: 'auto' }}
                      />
                      <Typography variant="caption" sx={{ wordBreak: 'break-all', fontSize: '10px' }}>
                        {qr.id}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Inventory (Placeholder) */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              📊 Book Inventory
            </Typography>
            <Alert severity="info">
              Book inventory will be shown here with manage options for each book
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AddBooks;
