import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAdmin } from '../../context/AdminContext';
import { BOOK_STATUS } from '../../utils/constants';
import QRCode from 'qrcode.react';

const CopyManager = ({ book, onClose }) => {
  const [copies, setCopies] = useState(book.copies || []);
  const [openAdd, setOpenAdd] = useState(false);
  const [newCopy, setNewCopy] = useState({
    shelfLocation: '',
    status: BOOK_STATUS.AVAILABLE,
  });
  const [loading, setLoading] = useState(false);

  const handleAddCopy = async () => {
    setLoading(true);
    try {
      // Generate unique ID for copy
      const copyId = `${book.id}-${Date.now()}`;
      const copyData = {
        ...newCopy,
        copyId,
        bookId: book.id,
        qrCode: copyId, // Use copy ID as QR code value
      };

      // Add to local state
      setCopies([...copies, copyData]);
      setNewCopy({ shelfLocation: '', status: BOOK_STATUS.AVAILABLE });
      setOpenAdd(false);

      // TODO: Call API to save copy
      // await createBookCopy(book.id, copyData);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCopy = (copyId) => {
    setCopies(copies.filter((c) => c.copyId !== copyId));
    // TODO: Call API to delete copy
    // await deleteBookCopy(copyId);
  };

  const handleStatusChange = (copyId, newStatus) => {
    setCopies(
      copies.map((c) =>
        c.copyId === copyId ? { ...c, status: newStatus } : c
      )
    );
    // TODO: Call API to update copy status
  };

  return (
    <Box>
      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
        >
          Add Copy
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Copy ID</TableCell>
              <TableCell>QR Code</TableCell>
              <TableCell>Shelf Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {copies.map((copy) => (
              <TableRow key={copy.copyId}>
                <TableCell>{copy.copyId}</TableCell>
                <TableCell>
                  <QRCode value={copy.qrCode} size={50} level="H" />
                </TableCell>
                <TableCell>{copy.shelfLocation}</TableCell>
                <TableCell>
                  <FormControl size="small">
                    <Select
                      value={copy.status}
                      onChange={(e) =>
                        handleStatusChange(copy.copyId, e.target.value)
                      }
                    >
                      <MenuItem value={BOOK_STATUS.AVAILABLE}>Available</MenuItem>
                      <MenuItem value={BOOK_STATUS.ISSUED}>Issued</MenuItem>
                      <MenuItem value={BOOK_STATUS.DAMAGED}>Damaged</MenuItem>
                      <MenuItem value={BOOK_STATUS.LOST}>Lost</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteCopy(copy.copyId)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
        <Button onClick={onClose}>Close</Button>
      </Box>

      {/* Add Copy Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add New Copy</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 400 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Shelf Location"
              value={newCopy.shelfLocation}
              onChange={(e) =>
                setNewCopy({ ...newCopy, shelfLocation: e.target.value })
              }
              placeholder="e.g., A1-2-3"
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={newCopy.status}
                onChange={(e) =>
                  setNewCopy({ ...newCopy, status: e.target.value })
                }
                label="Status"
              >
                <MenuItem value={BOOK_STATUS.AVAILABLE}>Available</MenuItem>
                <MenuItem value={BOOK_STATUS.DAMAGED}>Damaged</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleAddCopy}
                disabled={loading || !newCopy.shelfLocation}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Copy'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CopyManager;
