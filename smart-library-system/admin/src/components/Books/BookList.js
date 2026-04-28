import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAdmin } from '../../context/AdminContext';
import { Loading, DataTable, ConfirmDialog, StatusBadge } from '../Common';
import BookForm from './BookForm';
import CopyManager from './CopyManager';
import { formatDate } from '../../utils/formatters';

const BookList = () => {
  const { books, loading, fetchBooks, deleteBook } = useAdmin();
  const [openForm, setOpenForm] = useState(false);
  const [openCopies, setOpenCopies] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleEdit = (book) => {
    setSelectedBook(book);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (selectedBook) {
      await deleteBook(selectedBook.id);
      setOpenDelete(false);
      setSelectedBook(null);
      fetchBooks();
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title?.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { id: 'title', label: 'Title' },
    { id: 'author', label: 'Author' },
    { id: 'isbn', label: 'ISBN' },
    {
      id: 'copiesAvailable',
      label: 'Copies (Available/Total)',
      render: (_, row) => `${row.copiesAvailable || 0}/${row.totalCopies || 0}`,
    },
    {
      id: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            onClick={() => {
              setSelectedBook(row);
              setOpenCopies(true);
            }}
          >
            Manage Copies
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setSelectedBook(row);
              setOpenDelete(true);
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  if (loading) {
    return <Loading message="Loading books..." />;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <h2>Books Management</h2>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedBook(null);
            setOpenForm(true);
          }}
        >
          Add Book
        </Button>
      </Box>

      <DataTable
        columns={columns}
        rows={filteredBooks}
        searchable
        onSearch={setSearch}
      />

      {/* Book Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <BookForm
            book={selectedBook}
            onClose={() => {
              setOpenForm(false);
              setSelectedBook(null);
              fetchBooks();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Copy Manager Dialog */}
      <Dialog open={openCopies} onClose={() => setOpenCopies(false)} maxWidth="md" fullWidth>
        <DialogTitle>Manage Book Copies: {selectedBook?.title}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedBook && (
            <CopyManager
              book={selectedBook}
              onClose={() => {
                setOpenCopies(false);
                fetchBooks();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={openDelete}
        title="Delete Book"
        message={`Are you sure you want to delete "${selectedBook?.title}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => {
          setOpenDelete(false);
          setSelectedBook(null);
        }}
        severity="error"
      />
    </Box>
  );
};

export default BookList;
