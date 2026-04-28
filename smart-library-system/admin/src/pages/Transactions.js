import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  Avatar,
  InputAdornment,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Delete,
  Search,
  Person,
  Book,
} from '@mui/icons-material';
import { useAdmin } from '../context/AdminContext';
import { TransactionTableRowSkeleton } from '../components/SkeletonLoader';

const Transactions = () => {
  const { api } = useAdmin();
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch full list from backend, then apply UI tab filters client-side
      // because status labels differ across deployed backends (active/issued/completed/returned).
      const response = await api.get('/api/admin/transactions');
      const payload = response.data || {};
      const rows = payload.data || payload.transactions || [];
      setTransactions(Array.isArray(rows) ? rows : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions. Check your backend server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  const handleReturnBook = async (transaction) => {
    try {
      setLoading(true);
      await api.post(`/api/admin/transactions/return`, { transaction_id: transaction.id, transactionId: transaction.id });
      fetchTransactions();
    } catch (error) {
      console.error('Failed to return book:', error);
      setError('Failed to return the book.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.delete(`/api/admin/transactions/${transactionId}`);
        fetchTransactions();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'issue':
      case 'active':
        return 'warning';
      case 'completed':
      case 'return':
      case 'returned':
        return 'success';
      case 'cancelled':
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    (transaction.userName || transaction.user_name || transaction.user?.name || transaction.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.bookTitle || transaction.book_title || transaction.book?.title || transaction.books?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.bookIsbn || transaction.book_isbn || transaction.book?.isbn || transaction.books?.isbn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const now = new Date();
  const tabFilteredTransactions = filteredTransactions.filter((transaction) => {
    const status = String(transaction.status || '').toLowerCase();
    const due = transaction.dueDate || transaction.due_date;
    const dueDate = due ? new Date(due) : null;
    const isReturned = ['returned', 'completed', 'return'].includes(status) || !!(transaction.returnDate || transaction.returned_date || transaction.return_date);
    const isActive = ['active', 'issued', 'issue', 'pending'].includes(status) && !isReturned;
    const isOverdue = isActive && dueDate && dueDate < now;

    if (tabValue === 0) return isActive;
    if (tabValue === 1) return isOverdue;
    if (tabValue === 2) return isReturned;
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          📖 Transaction Management
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3, overflow: 'hidden', boxShadow: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Active Issues" />
          <Tab label="Overdue" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search transactions by user name, book title, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Transactions Table */}
      <Card>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Book</strong></TableCell>
                <TableCell><strong>Issue Date</strong></TableCell>
                <TableCell><strong>Due Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
              <TransactionTableRowSkeleton rows={8} />
            ) : tabFilteredTransactions.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No transactions found for this view.
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {tabFilteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>{transaction.id?.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Person sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {transaction.userName || transaction.user_name || transaction.user?.name || transaction.users?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {transaction.userEmail || transaction.user_email || transaction.user?.email || transaction.users?.email || transaction.user_id?.substring(0,8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Book sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {transaction.bookTitle || transaction.book_title || transaction.book?.title || transaction.books?.title || 'Unknown Book'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ISBN: {transaction.bookIsbn || transaction.book_isbn || transaction.book?.isbn || transaction.books?.isbn || transaction.book_id?.substring(0,8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.issueDate || transaction.issued_date || transaction.issue_date ? new Date(transaction.issueDate || transaction.issued_date || transaction.issue_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{transaction.dueDate || transaction.due_date ? new Date(transaction.dueDate || transaction.due_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status} 
                        color={getStatusColor(transaction.status)} 
                        size="small" 
                        sx={{ textTransform: 'capitalize' }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      {['active', 'issued', 'overdue', 'pending'].includes(String(transaction.status || '').toLowerCase()) && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleReturnBook(transaction)}
                          sx={{ mr: 1 }}
                        >
                          Return
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </Card>

    </Box>
  );
};

export default Transactions;
