/**
 * useUsers Hook - User Management
 * Manages user CRUD operations with real-time updates
 * Includes user option management for department/batch/session
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSocket } from './useSocket';

const normalizeUser = (user) => {
  const isActive = user?.is_active !== false;
  const firstName = user?.first_name || '';
  const lastName = user?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    ...user,
    name: fullName || user?.name || user?.email || 'Unknown User',
    user_type: user?.role || user?.user_type || 'student',
    status: isActive ? 'active' : 'inactive',
    is_active: isActive,
    photo_url: user?.photo_url || user?.profile_image_url || null,
  };
};

export const useUsers = (autoRefresh = true, refreshInterval = 30000) => {
  const { apiCall } = useAdmin();
  const socket = useSocket();

  const [users, setUsers] = useState([]);
  const [userOptions, setUserOptions] = useState({
    department: [],
    batch: [],
    session: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  /**
   * Fetch users from backend
   */
  const fetchUsers = useCallback(
    async (page = 1, limit = 20, filters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const endpoint = `/users?${params.toString()}`;
        const response = await apiCall('GET', endpoint);

        if (response?.success) {
          setUsers((response.data || []).map(normalizeUser));
          setPagination(
            response.pagination || {
              page,
              limit,
              total: response.data?.length || 0,
              pages: 1,
            }
          );
          setError(null);
        } else {
          setError(response?.error || 'Failed to fetch users');
          setUsers([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  /**
   * Get single user details
   */
  const getUser = useCallback(
    async (userId) => {
      const response = await apiCall('GET', `/users/${userId}`);
      if (response?.success) {
        return normalizeUser(response.data);
      }
      throw new Error(response?.error || 'Failed to get user');
    },
    [apiCall]
  );

  /**
   * Create new regular user (Student/Staff/Librarian)
   */
  const createUser = useCallback(
    async (userData) => {
      if (!userData.first_name || !userData.last_name || !userData.email) {
        throw new Error('First name, last name, and email are required');
      }

      const payload = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone || null,
        role: userData.role || 'student',
        student_id: userData.student_id || null,
        department: userData.department || null,
        session: userData.session || null,
        batch_number: userData.batch_number || null,
        emergency_contact: userData.emergency_contact || null,
        photo_url: userData.photo_url || null,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
      };

      const response = await apiCall('POST', '/users', payload);

      if (response?.success) {
        await fetchUsers();
        return normalizeUser(response.data);
      }
      throw new Error(response?.error || 'Failed to create user');
    },
    [apiCall, fetchUsers]
  );

  /**
   * Create new admin user - separate flow
   */
  const createAdminUser = useCallback(
    async (adminData) => {
      if (!adminData.first_name || !adminData.last_name || !adminData.email) {
        throw new Error('First name, last name, and email are required');
      }

      const payload = {
        first_name: adminData.first_name,
        last_name: adminData.last_name,
        email: adminData.email,
        phone: adminData.phone || null,
        role: 'admin',
        photo_url: adminData.photo_url || null,
        is_active: adminData.is_active !== undefined ? adminData.is_active : true,
      };

      const response = await apiCall('POST', '/users', payload);

      if (response?.success) {
        await fetchUsers();
        return normalizeUser(response.data);
      }
      throw new Error(response?.error || 'Failed to create admin user');
    },
    [apiCall, fetchUsers]
  );

  /**
   * Update user details
   */
  const updateUser = useCallback(
    async (userId, userData) => {
      const payload = {};
      if (userData.first_name !== undefined) payload.first_name = userData.first_name;
      if (userData.last_name !== undefined) payload.last_name = userData.last_name;
      if (userData.email !== undefined) payload.email = userData.email;
      if (userData.phone !== undefined) payload.phone = userData.phone;
      if (userData.role !== undefined) payload.role = userData.role;
      if (userData.student_id !== undefined) payload.student_id = userData.student_id;
      if (userData.department !== undefined) payload.department = userData.department;
      if (userData.session !== undefined) payload.session = userData.session;
      if (userData.batch_number !== undefined) payload.batch_number = userData.batch_number;
      if (userData.emergency_contact !== undefined) payload.emergency_contact = userData.emergency_contact;
      if (userData.photo_url !== undefined) payload.photo_url = userData.photo_url;
      if (userData.is_active !== undefined) payload.is_active = userData.is_active;

      const response = await apiCall('PUT', `/users/${userId}`, payload);

      if (response?.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? normalizeUser({ ...user, ...payload }) : user
          )
        );
        return normalizeUser(response.data);
      }
      throw new Error(response?.error || 'Failed to update user');
    },
    [apiCall]
  );

  /**
   * Delete user (hard delete)
   */
  const deleteUser = useCallback(
    async (userId) => {
      const response = await apiCall('DELETE', `/users/${userId}`);
      if (response?.success) {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        return response.data;
      }
      throw new Error(response?.error || 'Failed to delete user');
    },
    [apiCall]
  );

  /**
   * Toggle user status (active/inactive)
   */
  const toggleUserStatus = useCallback(
    async (userId, currentStatus) => {
      const currentlyActive = currentStatus === true || currentStatus === 'active';
      const newIsActive = !currentlyActive;

      const response = await apiCall('PUT', `/users/${userId}`, {
        is_active: newIsActive,
      });

      if (response?.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? normalizeUser({ ...user, is_active: newIsActive })
              : user
          )
        );
        return response.data;
      }
      throw new Error(response?.error || 'Failed to toggle user status');
    },
    [apiCall]
  );

  const inactivateUser = useCallback(
    async (userId) => {
      const response = await apiCall('PUT', `/users/${userId}`, {
        is_active: false,
      });
      if (response?.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? normalizeUser({ ...user, is_active: false }) : user
          )
        );
        return response.data;
      }
      throw new Error(response?.error || 'Failed to inactivate user');
    },
    [apiCall]
  );

  const activateUser = useCallback(
    async (userId) => {
      const response = await apiCall('PUT', `/users/${userId}`, {
        is_active: true,
      });
      if (response?.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? normalizeUser({ ...user, is_active: true }) : user
          )
        );
        return response.data;
      }
      throw new Error(response?.error || 'Failed to activate user');
    },
    [apiCall]
  );

  /**
   * Bulk import users
   */
  const bulkImportUsers = useCallback(
    async (usersData) => {
      const response = await apiCall('POST', '/users/bulk-import', {
        users: usersData,
      });

      if (response?.success) {
        await fetchUsers();
        return response;
      }
      throw new Error(response?.error || 'Failed to bulk import');
    },
    [apiCall, fetchUsers]
  );

  /**
   * Search users
   */
  const searchUsers = useCallback(
    (search) => {
      fetchUsers(1, 20, { search });
    },
    [fetchUsers]
  );

  /**
   * User form options (department, batch, session)
   */
  const fetchUserOptions = useCallback(async () => {
    const response = await apiCall('GET', '/users/options');
    if (response?.success) {
      setUserOptions({
        department: response.data?.department || [],
        batch: response.data?.batch || [],
        session: response.data?.session || [],
      });
      return response.data;
    }
    throw new Error(response?.error || 'Failed to fetch user options');
  }, [apiCall]);

  const addUserOption = useCallback(
    async (type, value) => {
      const response = await apiCall('POST', '/users/options', { type, value });
      if (response?.success) {
        await fetchUserOptions();
        return response.data;
      }
      throw new Error(response?.error || 'Failed to add user option');
    },
    [apiCall, fetchUserOptions]
  );

  const removeUserOption = useCallback(
    async (type, value) => {
      const response = await apiCall(
        'DELETE',
        `/users/options/${type}/${encodeURIComponent(value)}`
      );
      if (response?.success) {
        await fetchUserOptions();
        return response.data;
      }
      throw new Error(response?.error || 'Failed to remove user option');
    },
    [apiCall, fetchUserOptions]
  );

  /**
   * WebSocket listeners
   */
  useEffect(() => {
    if (!socket) return;

    const onCreated = () => fetchUsers(pagination.page, pagination.limit);
    const onUpdated = (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.user?.id ? normalizeUser({ ...user, ...data.user }) : user
        )
      );
    };
    const onDeleted = (data) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== data.userId));
    };
    const onStatusChanged = (data) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === data.userId
            ? normalizeUser({ ...user, is_active: data.status === 'active' })
            : user
        )
      );
    };

    socket.on('admin:user:created', onCreated);
    socket.on('admin:user:updated', onUpdated);
    socket.on('admin:user:deleted', onDeleted);
    socket.on('admin:user:status:changed', onStatusChanged);

    return () => {
      socket.off('admin:user:created', onCreated);
      socket.off('admin:user:updated', onUpdated);
      socket.off('admin:user:deleted', onDeleted);
      socket.off('admin:user:status:changed', onStatusChanged);
    };
  }, [socket, fetchUsers, pagination.page, pagination.limit]);

  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh) return;

    fetchUsers();
    fetchUserOptions();

    const timer = setInterval(() => {
      fetchUsers(pagination.page, pagination.limit);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, fetchUsers, fetchUserOptions, pagination.page, pagination.limit]);

  return {
    users,
    userOptions,
    loading,
    error,
    pagination,
    fetchUsers,
    getUser,
    createUser,
    createAdminUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    inactivateUser,
    activateUser,
    bulkImportUsers,
    searchUsers,
    fetchUserOptions,
    addUserOption,
    removeUserOption,
  };
};

export default useUsers;
