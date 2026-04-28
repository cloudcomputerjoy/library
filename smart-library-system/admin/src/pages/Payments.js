import React, { useState, useEffect } from 'react';
import {
  Box,
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
  TextField,
} from '@mui/material';
import { useAdmin } from '../context/AdminContext';
import { TableSkeleton } from '../components/SkeletonLoader';

const Payments = () => {
  const { api } = useAdmin();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/payments');
      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        💰 Fine Payments
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by user or fine ID..."
            size="small"
          />
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>User</TableCell>
                  <TableCell>Fine Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{payment.userName || 'Unknown'}</TableCell>
                    <TableCell>Rs. {payment.amount || '0'}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status || 'pending'}
                        size="small"
                        color={payment.status === 'paid' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{payment.date || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default Payments;
