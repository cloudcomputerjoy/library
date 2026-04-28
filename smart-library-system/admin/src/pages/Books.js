import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  LibraryBooks,
  CheckCircle,
  Warning,
  QrCode,
} from '@mui/icons-material';
import { useAdmin } from '../context/AdminContext';

const Books = () => {
  const { api } = useAdmin();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [bookForm, setBookForm] = useState({
    isbn: '',
    title: '',
    author: '',
    category_id: '',
    publisher: '',
    totalCopies: 1,
    availableCopies: 1,
    description: '',
    shelves: [],
  });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/books');
      if (response.data.success) {
        setBooks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
      // Mock data for demo
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
        {
          id: '2',
          isbn: '978-0-987654-32-1',
          title: 'Node.js Guide',
          author: 'Jane Smith',
          category: 'Programming',
          publisher: 'Dev Press',
          totalCopies: 3,
          availableCopies: 0,
          issuedCopies: 3,
          isAvailable: false,
          createdAt: '2024-01-10',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/admin/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const fetchShelves = async () => {
    try {
      const response = await api.get('/api/admin/shelves');
      if (response.data.success) {
        setShelves(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch shelves:', error);
      setShelves([]);
    }
  };

  const handleAddBook = () => {
    setSelectedBook(null);
    setBookForm({
      isbn: '',
      title: '',
      author: '',
      category_id: '',
      publisher: '',
      totalCopies: 1,
      availableCopies: 1,
      description: '',
      shelves: [],
    });
    setOpenDialog(true);
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setBookForm({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category_id: book.category_id || '',
      publisher: book.publisher,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      description: book.description || '',
      shelves: book.shelves || [],
    });
    setOpenDialog(true);
  };

  const handleSaveBook = async () => {
    try {
      const bookData = { ...bookForm };

      if (selectedBook) {
        await api.put(`/api/admin/books/${selectedBook.id}`, bookData);
      } else {
        await api.post('/api/admin/books', bookData);
      }

      setOpenDialog(false);
      fetchBooks();
    } catch (error) {
      console.error('Failed to save book:', error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await api.delete(`/api/admin/books/${bookId}`);
        fetchBooks();
      } catch (error) {
        console.error('Failed to delete book:', error);
      }
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          📚 Book Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddBook}
          sx={{ borderRadius: 2 }}
        >
          Add Book
        </Button>
      </Box>

      {/* Search and Filters */}
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
            <Button variant="outlined" startIcon={<LibraryBooks />}>
              Bulk Import
            </Button>
            <Button variant="outlined" startIcon={<QrCode />}>
              Generate QR Codes
            </Button>
            <Button variant="outlined">
              Export Catalog
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
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
              {filteredBooks.map((book) => (
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
                      {book.issuedCopies} issued
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
                      onClick={() => handleEditBook(book)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteBook(book.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Book Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedBook ? 'Edit Book' : 'Add New Book'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="ISBN"
              value={bookForm.isbn}
              onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              helperText="Enter ISBN-13 format"
            />
            <TextField
              fullWidth
              label="Title"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Author"
              value={bookForm.author}
              onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Category"
                select
                value={bookForm.category_id}
                onChange={(e) => setBookForm({ ...bookForm, category_id: e.target.value })}
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Publisher"
                value={bookForm.publisher}
                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
              />
            </Box>
            <TextField
              fullWidth
              label="Shelves"
              select
              SelectProps={{ multiple: true }}
              value={bookForm.shelves}
              onChange={(e) => setBookForm({ ...bookForm, shelves: e.target.value })}
              helperText="Select one or more shelves where this book is located"
            >
              {shelves.map((shelf) => (
                <MenuItem key={shelf.id} value={shelf.id}>
                  {shelf.name} ({shelf.rack_number})
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Total Copies"
                type="number"
                value={bookForm.totalCopies}
                onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) })}
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                label="Available Copies"
                type="number"
                value={bookForm.availableCopies}
                onChange={(e) => setBookForm({ ...bookForm, availableCopies: parseInt(e.target.value) })}
                inputProps={{ min: 0, max: bookForm.totalCopies }}
              />
            </Box>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveBook} variant="contained">
            {selectedBook ? 'Update' : 'Create'} Book
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Books;