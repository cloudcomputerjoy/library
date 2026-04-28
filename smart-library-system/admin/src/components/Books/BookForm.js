import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextareaAutosize,
} from '@mui/material';
import { useAdmin } from '../../context/AdminContext';
import { BOOK_STATUS } from '../../utils/constants';

const BookForm = ({ book, onClose }) => {
  const { createBook, updateBook } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(
    book || {
      title: '',
      author: '',
      isbn: '',
      description: '',
      category: '',
      publisher: '',
      totalCopies: 1,
      status: BOOK_STATUS.AVAILABLE,
    }
  );
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.author) newErrors.author = 'Author is required';
    if (!formData.isbn) newErrors.isbn = 'ISBN is required';
    if (formData.totalCopies < 1) newErrors.totalCopies = 'At least 1 copy required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (book?.id) {
        await updateBook(book.id, formData);
      } else {
        await createBook(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            error={!!errors.author}
            helperText={errors.author}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="ISBN"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            error={!!errors.isbn}
            helperText={errors.isbn}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Copies"
            name="totalCopies"
            type="number"
            value={formData.totalCopies}
            onChange={handleChange}
            error={!!errors.totalCopies}
            helperText={errors.totalCopies}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value={BOOK_STATUS.AVAILABLE}>Available</MenuItem>
              <MenuItem value={BOOK_STATUS.DAMAGED}>Damaged</MenuItem>
              <MenuItem value={BOOK_STATUS.LOST}>Lost</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Book'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookForm;
