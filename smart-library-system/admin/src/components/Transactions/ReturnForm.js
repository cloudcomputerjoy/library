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
  Card,
  CardContent,
} from '@mui/material';
import { useAdmin } from '../../context/AdminContext';
import { calculateFine, formatCurrency } from '../../utils/helpers';

const ReturnForm = ({ onClose }) => {
  const { returnBook } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: '',
    returnDate: new Date().toISOString().split('T')[0],
    condition: 'good',
    remarks: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [fineInfo, setFineInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transactionId) {
      setErrors({ transactionId: 'Transaction ID is required' });
      return;
    }

    // Calculate fine
    // This would be done by the backend API
    const fine = calculateFine(
      new Date(), // dueDate from transaction
      new Date(formData.returnDate),
      5 // finePerDay
    );

    setLoading(true);
    try {
      const payload = {
        ...formData,
        fine,
      };
      await returnBook(payload);
      setSuccess(true);
      setFineInfo({ fine, condition: formData.condition });
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error returning book:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box p={2}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Book returned successfully!
        </Alert>
        {fineInfo && (
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle2">Return Summary:</Typography>
            <Typography variant="body2">
              Condition: <strong>{fineInfo.condition}</strong>
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: fineInfo.fine > 0 ? 'error.main' : 'success.main',
              }}
            >
              Fine: <strong>{formatCurrency(fineInfo.fine)}</strong>
            </Typography>
          </Paper>
        )}
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
            label="Transaction ID / Scan QR Code"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleChange}
            error={!!errors.transactionId}
            helperText={errors.transactionId}
            autoFocus
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Return Date"
            name="returnDate"
            type="date"
            value={formData.returnDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Book Condition</InputLabel>
            <Select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              label="Book Condition"
            >
              <MenuItem value="good">Good</MenuItem>
              <MenuItem value="fair">Fair</MenuItem>
              <MenuItem value="damaged">Damaged</MenuItem>
              <MenuItem value="lost">Lost</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            name="remarks"
            multiline
            rows={2}
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Any additional notes about the book's condition..."
          />
        </Grid>
        <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Return Book'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReturnForm;
