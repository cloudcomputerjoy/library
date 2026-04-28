import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAdmin } from '../../context/AdminContext';
import { Loading, DataTable, ConfirmDialog, StatusBadge } from '../Common';
import UserForm from './UserForm';
import BulkUpload from './BulkUpload';
import { formatDate } from '../../utils/formatters';

const UserList = () => {
  const { users, loading, fetchUsers, deleteUser } = useAdmin();
  const [openForm, setOpenForm] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (selectedUser) {
      await deleteUser(selectedUser.id);
      setOpenDelete(false);
      setSelectedUser(null);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'userType', label: 'Type' },
    {
      id: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'joinedDate',
      label: 'Joined',
      render: (value) => formatDate(value),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Box display="flex" gap={1}>
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
              setSelectedUser(row);
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
    return <Loading message="Loading users..." />;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <h2>Users Management</h2>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedUser(null);
              setOpenForm(true);
            }}
          >
            Add User
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            onClick={() => setOpenBulk(true)}
          >
            Bulk Upload
          </Button>
        </Box>
      </Box>

      <DataTable
        columns={columns}
        rows={filteredUsers}
        searchable
        onSearch={setSearch}
      />

      {/* User Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <UserForm
            user={selectedUser}
            onClose={() => {
              setOpenForm(false);
              setSelectedUser(null);
              fetchUsers();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={openBulk} onClose={() => setOpenBulk(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload Users</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <BulkUpload
            onClose={() => {
              setOpenBulk(false);
              fetchUsers();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={openDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => {
          setOpenDelete(false);
          setSelectedUser(null);
        }}
        severity="error"
      />
    </Box>
  );
};

export default UserList;
