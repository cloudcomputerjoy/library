import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  Alert,
  TablePagination,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Block,
  CheckCircle,
  Refresh,
  Download,
  BusinessCenter,
  PhotoCamera,
  RemoveCircleOutline,
} from '@mui/icons-material';
import useUsers from '../hooks/useUsers';
import { TableSkeleton } from '../components/SkeletonLoader';

const emptyUserForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  student_id: '',
  user_type: 'student',
  department: '',
  session: '',
  batch_number: '',
  emergency_contact: '',
  photo_url: '',
  status: 'active',
};

const emptyOptionForm = {
  department: '',
  batch: '',
  session: '',
};

const Users = () => {
  const {
    users,
    userOptions,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    createAdminUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    searchUsers,
    fetchUserOptions,
    addUserOption,
    removeUserOption,
  } = useUsers();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openOptionsDialog, setOpenOptionsDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [filteredDepartment, setFilteredDepartment] = useState('');
  const [filteredBatch, setFilteredBatch] = useState('');
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [optionForm, setOptionForm] = useState(emptyOptionForm);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchUserOptions().catch(() => {});
  }, [fetchUserOptions]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setPage(0);
      if (value.trim()) {
        searchUsers(value);
      } else {
        fetchUsers(1, rowsPerPage);
      }
    },
    [searchUsers, fetchUsers, rowsPerPage]
  );

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    fetchUsers(newPage + 1, rowsPerPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRows = parseInt(event.target.value, 10);
    setRowsPerPage(newRows);
    setPage(0);
    fetchUsers(1, newRows);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setPhotoPreview(null);
    setUserForm(emptyUserForm);
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setPhotoPreview(user.photo_url || null);
    setUserForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      student_id: user.student_id || '',
      user_type: user.user_type || 'student',
      department: user.department || '',
      session: user.session || '',
      batch_number: user.batch_number || '',
      emergency_contact: user.emergency_contact || '',
      photo_url: user.photo_url || '',
      status: user.is_active ? 'active' : 'inactive',
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      if (!userForm.first_name || !userForm.last_name || !userForm.email) {
        showSnackbar('First name, last name, and email are required', 'error');
        return;
      }

      setSaving(true);
      const payload = {
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        email: userForm.email,
        phone: userForm.phone || null,
        role: userForm.user_type,
        student_id: userForm.student_id || null,
        department: userForm.department || null,
        session: userForm.session || null,
        batch_number: userForm.batch_number || null,
        emergency_contact: userForm.emergency_contact || null,
        photo_url: userForm.photo_url || null,
        is_active: userForm.status === 'active',
      };

      if (selectedUser) {
        await updateUser(selectedUser.id, payload);
        showSnackbar('User updated successfully');
      } else if (payload.role === 'admin') {
        await createAdminUser(payload);
        showSnackbar('Admin user created successfully');
      } else {
        await createUser(payload);
        showSnackbar('User created successfully');
      }

      setOpenDialog(false);
    } catch (err) {
      showSnackbar(err.message || 'Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      showSnackbar('User deleted successfully');
    } catch (err) {
      showSnackbar(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await toggleUserStatus(userId, isActive);
      showSnackbar(`User ${isActive ? 'inactivated' : 'activated'} successfully`);
    } catch (err) {
      showSnackbar(err.message || 'Failed to update user status', 'error');
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const { url } = await response.json();
      setUserForm((prev) => ({ ...prev, photo_url: url }));
      showSnackbar('Photo uploaded successfully');
    } catch {
      showSnackbar('Failed to upload photo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportUsers = () => {
    try {
      let dataToExport = filteredUsers;
      if (filteredDepartment) {
        dataToExport = dataToExport.filter((u) => u.department === filteredDepartment);
      }
      if (filteredBatch) {
        dataToExport = dataToExport.filter((u) => u.batch_number === filteredBatch);
      }

      const headers = [
        'Name',
        'Email',
        'Phone',
        'Type',
        'Student ID',
        'Department',
        'Session',
        'Batch',
        'Emergency Contact',
        'Status',
        'Photo URL',
      ];
      const rows = dataToExport.map((user) => [
        user.name || '',
        user.email || '',
        user.phone || '',
        user.user_type || '',
        user.student_id || '',
        user.department || '',
        user.session || '',
        user.batch_number || '',
        user.emergency_contact || '',
        user.is_active ? 'active' : 'inactive',
        user.photo_url || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const element = document.createElement('a');
      element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
      element.setAttribute('download', `users_export_${Date.now()}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      showSnackbar(`Exported ${dataToExport.length} users successfully`);
    } catch {
      showSnackbar('Failed to export users', 'error');
    }
  };

  const handleAddOption = async (type) => {
    const rawValue = optionForm[type] || '';
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    try {
      await addUserOption(type, trimmed);
      setOptionForm((prev) => ({ ...prev, [type]: '' }));
      showSnackbar(`${type} option added`);
    } catch (err) {
      showSnackbar(err.message || `Failed to add ${type}`, 'error');
    }
  };

  const handleRemoveOption = async (type, value) => {
    if (!window.confirm(`Remove "${value}" from ${type} options?`)) return;
    try {
      await removeUserOption(type, value);
      showSnackbar(`${type} option removed`);
      if (type === 'department' && userForm.department === value) {
        setUserForm((prev) => ({ ...prev, department: '' }));
      }
      if (type === 'batch' && userForm.batch_number === value) {
        setUserForm((prev) => ({ ...prev, batch_number: '' }));
      }
      if (type === 'session' && userForm.session === value) {
        setUserForm((prev) => ({ ...prev, session: '' }));
      }
    } catch (err) {
      showSnackbar(err.message || `Failed to remove ${type}`, 'error');
    }
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query) ||
          user.student_id?.toLowerCase().includes(query)
      );
    }
    if (filteredDepartment) {
      list = list.filter((user) => user.department === filteredDepartment);
    }
    if (filteredBatch) {
      list = list.filter((user) => user.batch_number === filteredBatch);
    }
    return list;
  }, [users, searchTerm, filteredDepartment, filteredBatch]);

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'error';
      case 'librarian':
        return 'primary';
      case 'staff':
        return 'secondary';
      case 'student':
        return 'info';
      default:
        return 'default';
    }
  };

  const optionSections = [
    { type: 'department', label: 'Department', values: userOptions.department || [] },
    { type: 'batch', label: 'Batch', values: userOptions.batch || [] },
    { type: 'session', label: 'Session', values: userOptions.session || [] },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchUsers(page + 1, rowsPerPage)}
            size="small"
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddUser} sx={{ borderRadius: 2 }}>
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search users by name, email, or student ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<BusinessCenter />}
              onClick={() => setOpenOptionsDialog(true)}
            >
              Manage Department/Batch/Session
            </Button>
            <Button variant="outlined" startIcon={<Download />} onClick={handleExportUsers}>
              Export Users
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Department</InputLabel>
              <Select
                value={filteredDepartment}
                onChange={(e) => setFilteredDepartment(e.target.value)}
                label="Filter by Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {(userOptions.department || []).map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Batch</InputLabel>
              <Select
                value={filteredBatch}
                onChange={(e) => setFilteredBatch(e.target.value)}
                label="Filter by Batch"
              >
                <MenuItem value="">All Batches</MenuItem>
                {(userOptions.batch || []).map((batch) => (
                  <MenuItem key={batch} value={batch}>
                    {batch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={5} columns={12} />
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell>Image</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Session</TableCell>
                    <TableCell>Emergency Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Avatar src={user.photo_url} sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            {user.name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.user_type}
                            size="small"
                            color={getUserTypeColor(user.user_type)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{user.student_id || '-'}</TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>{user.batch_number || '-'}</TableCell>
                        <TableCell>{user.session || '-'}</TableCell>
                        <TableCell>{user.emergency_contact || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEditUser(user)} color="primary" title="Edit user">
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            color={user.is_active ? 'warning' : 'success'}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? <Block /> : <CheckCircle />}
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteUser(user.id)} color="error" title="Delete user">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No users found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={pagination.total || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Avatar src={photoPreview} sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                {userForm.first_name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Button variant="outlined" startIcon={<PhotoCamera />} component="label" disabled={saving}>
                Upload Photo
                <input hidden accept="image/*" type="file" onChange={handlePhotoUpload} />
              </Button>
            </Box>

            <TextField
              fullWidth
              label="First Name"
              value={userForm.first_name}
              onChange={(e) => setUserForm((prev) => ({ ...prev, first_name: e.target.value }))}
              required
              disabled={saving}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={userForm.last_name}
              onChange={(e) => setUserForm((prev) => ({ ...prev, last_name: e.target.value }))}
              required
              disabled={saving}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
              required
              disabled={saving}
            />
            <TextField
              fullWidth
              label="Phone"
              value={userForm.phone}
              onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={saving}
            />
            <TextField
              fullWidth
              label="Emergency Contact"
              value={userForm.emergency_contact}
              onChange={(e) => setUserForm((prev) => ({ ...prev, emergency_contact: e.target.value }))}
              disabled={saving}
            />
            <TextField
              select
              fullWidth
              label="User Type"
              value={userForm.user_type}
              onChange={(e) => setUserForm((prev) => ({ ...prev, user_type: e.target.value }))}
              disabled={saving}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="librarian">Librarian</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            {userForm.user_type === 'student' && (
              <>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={userForm.student_id}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, student_id: e.target.value }))}
                  disabled={saving}
                />
                <TextField
                  select
                  fullWidth
                  label="Department"
                  value={userForm.department}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, department: e.target.value }))}
                  disabled={saving}
                >
                  <MenuItem value="">Select Department</MenuItem>
                  {(userOptions.department || []).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Session"
                  value={userForm.session}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, session: e.target.value }))}
                  disabled={saving}
                >
                  <MenuItem value="">Select Session</MenuItem>
                  {(userOptions.session || []).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Batch Number"
                  value={userForm.batch_number}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, batch_number: e.target.value }))}
                  disabled={saving}
                >
                  <MenuItem value="">Select Batch</MenuItem>
                  {(userOptions.batch || []).map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}

            <TextField
              select
              fullWidth
              label="Status"
              value={userForm.status}
              onChange={(e) => setUserForm((prev) => ({ ...prev, status: e.target.value }))}
              disabled={saving}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : selectedUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openOptionsDialog} onClose={() => setOpenOptionsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Department, Batch, Session</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Add or remove options here. These values will appear in the Add User form dropdowns.
            </Alert>

            {optionSections.map((section) => (
              <Box key={section.type}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {section.label}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={`Add ${section.label}`}
                    value={optionForm[section.type]}
                    onChange={(e) =>
                      setOptionForm((prev) => ({ ...prev, [section.type]: e.target.value }))
                    }
                  />
                  <Button variant="contained" onClick={() => handleAddOption(section.type)}>
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {section.values.length > 0 ? (
                    section.values.map((value) => (
                      <Chip
                        key={`${section.type}-${value}`}
                        label={value}
                        onDelete={() => handleRemoveOption(section.type, value)}
                        deleteIcon={<RemoveCircleOutline />}
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography color="text.secondary">No options added yet.</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOptionsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
