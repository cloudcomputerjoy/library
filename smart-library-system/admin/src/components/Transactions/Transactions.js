import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAdmin } from '../../context/AdminContext';
import { Loading, DataTable, StatusBadge } from '../Common';
import IssueForm from './IssueForm';
import ReturnForm from './ReturnForm';
import { formatDate, formatDateTime } from '../../utils/formatters';

const Transactions = () => {
  const { transactions, loading, fetchUsers } = useAdmin(); // Assuming transactions in admin context
  const [tabValue, setTabValue] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [formType, setFormType] = useState('issue');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers(); // Load transactions
  }, []);

  const handleOpenForm = (type) => {
    setFormType(type);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setFormType('issue');
  };

  if (loading) {
    return <Loading message="Loading transactions..." />;
  }

  const issueColumns = [
    { id: 'id', label: 'ID' },
    { id: 'userName', label: 'User' },
    { id: 'bookTitle', label: 'Book' },
    { id: 'issuedDate', label: 'Issued', render: (v) => formatDate(v) },
    { id: 'dueDate', label: 'Due Date', render: (v) => formatDate(v) },
    {
      id: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  const returnColumns = [
    { id: 'id', label: 'ID' },
    { id: 'userName', label: 'User' },
    { id: 'bookTitle', label: 'Book' },
    { id: 'returnDate', label: 'Returned', render: (v) => formatDate(v) },
    { id: 'condition', label: 'Condition' },
    { id: 'fine', label: 'Fine', render: (v) => `$${v || 0}` },
  ];

  // Mock data - replace with real data from API
  const issueTransactions = [];
  const returnTransactions = [];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <h2>Transactions</h2>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm('issue')}
          >
            Issue Book
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm('return')}
          >
            Return Book
          </Button>
        </Box>
      </Box>

      <Card>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Active Issues" />
          <Tab label="Returns" />
        </Tabs>

        <Box p={2}>
          {tabValue === 0 && (
            <DataTable
              columns={issueColumns}
              rows={issueTransactions}
              searchable
              onSearch={setSearch}
            />
          )}
          {tabValue === 1 && (
            <DataTable
              columns={returnColumns}
              rows={returnTransactions}
              searchable
              onSearch={setSearch}
            />
          )}
        </Box>
      </Card>

      {/* Transaction Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formType === 'issue' ? 'Issue Book' : 'Return Book'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {formType === 'issue' ? (
            <IssueForm onClose={handleCloseForm} />
          ) : (
            <ReturnForm onClose={handleCloseForm} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Transactions;
