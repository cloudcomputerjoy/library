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
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import { useAdmin } from '../../context/AdminContext';
import { BOOK_STATUS } from '../../utils/constants';

const IssueForm = ({ onClose }) => {
  const { issueBook } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    copyId: '',
    issuedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.userId) newErrors.userId = 'User ID is required';
    if (!formData.copyId) newErrors.copyId = 'Copy ID is required';
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
      await issueBook(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error issuing book:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box p={2}>
        <Alert severity="success">Book issued successfully!</Alert>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {errors.submit && (
          <Grid item xs={12}>
            <Alert severity="error">{errors.submit}</Alert>
          </Grid>
        )}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="User ID / Scan ID Card"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            error={!!errors.userId}
            helperText={errors.userId}
            autoFocus
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Copy ID / Scan QR Code"
            name="copyId"
            value={formData.copyId}
            onChange={handleChange}
            error={!!errors.copyId}
            helperText={errors.copyId}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Issue Date"
            name="issuedDate"
            type="date"
            value={formData.issuedDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Issue Book'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default IssueForm;
