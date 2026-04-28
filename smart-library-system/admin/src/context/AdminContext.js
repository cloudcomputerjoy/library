import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Data State
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fines, setFines] = useState([]);

  // Settings
  const [settings, setSettings] = useState({
    libraryTiming: { open: '08:00', close: '18:00' },
    maxBooksPerStudent: 5,
    finePerDay: 10,
    qrExpiry: 15,
  });

  // API Base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Create axios instance for direct API access
  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
  });

  // Add token to requests
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Notification Helper - Define early so it can be used in other callbacks
  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // API Helper with proper error handling
  const apiCall = useCallback(
    async (method, endpoint, data = null) => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          method,
          url: `${API_URL}/api/admin${endpoint}`,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 10000,
        };

        if (data) config.data = data;

        const response = await axios(config);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        console.error('API Error:', errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, API_URL]
  );

  // Auth API Helper (for /api/auth endpoints, not /api/admin)
  const authApiCall = useCallback(
    async (method, endpoint, data = null) => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          method,
          url: `${API_URL}/api/auth${endpoint}`,
          headers: {},
          timeout: 10000,
        };

        if (data) config.data = data;

        const response = await axios(config);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        console.error('Auth API Error:', errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  // Auth Methods
  const login = useCallback(
    async (email, password) => {
      try {
        const data = await authApiCall('POST', '/login', { email, password });
        
        // Handle Supabase auth response format
        const accessToken = data.session?.access_token || data.token;
        const refreshToken = data.session?.refresh_token;
        const user = data.user || {};
        
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('adminToken', accessToken);
        
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        if (data.session?.expires_at) {
          localStorage.setItem('tokenExpiry', data.session.expires_at);
        }
        
        return data;
      } catch (err) {
        throw err;
      }
    },
    [authApiCall]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setUsers([]);
    setBooks([]);
    setTransactions([]);
    setFines([]);
    localStorage.removeItem('adminToken');
  }, []);

  // Dashboard Methods
  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await apiCall('GET', '/dashboard/stats');
      // Handle both response formats and convert snake_case to camelCase
      const statsData = data.data || data;
      
      // Transform snake_case to camelCase
      const transformedStats = {
        totalUsers: statsData.total_users || statsData.totalUsers || 0,
        activeUsers: statsData.active_users || statsData.activeUsers || 0,
        booksIssued: statsData.books_issued || statsData.booksIssued || 0,
        overdueBooks: statsData.overdue_books || statsData.overdueBooks || 0,
        studentsInside: statsData.current_students_inside || statsData.currentStudentsInside || statsData.students_inside || 0,
        pendingPrintJobs: statsData.pending_print_jobs || statsData.pendingPrintJobs || 0,
        totalRevenue: statsData.total_revenue || statsData.totalRevenue || 0,
        totalBooks: statsData.total_books || statsData.totalBooks || 0,
        pendingFines: statsData.pending_fines || statsData.pendingFines || 0,
      };
      
      setStats(transformedStats);
      return transformedStats;
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      // Set default stats on error to prevent null reference
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        booksIssued: 0,
        overdueBooks: 0,
        studentsInside: 0,
        pendingPrintJobs: 0,
        totalRevenue: 0,
        totalBooks: 0,
        pendingFines: 0,
      });
      throw err;
    }
  }, [apiCall]);

  // User Methods
  const fetchUsers = useCallback(
    async (filters = {}) => {
      try {
        const query = new URLSearchParams(filters).toString();
        const data = await apiCall('GET', `/users?${query}`);
        setUsers(Array.isArray(data) ? data : data.users || []);
        return data;
      } catch (err) {
        console.error('Failed to fetch users:', err);
        throw err;
      }
    },
    [apiCall]
  );

  const createUser = useCallback(
    async (userData) => {
      try {
        const data = await apiCall('POST', '/users', userData);
        setUsers([...users, data]);
        addNotification('User created successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to create user', 'error');
        throw err;
      }
    },
    [apiCall, users, addNotification]
  );

  const updateUser = useCallback(
    async (userId, userData) => {
      try {
        const data = await apiCall('PUT', `/users/${userId}`, userData);
        setUsers(users.map((u) => (u.id === userId ? data : u)));
        addNotification('User updated successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to update user', 'error');
        throw err;
      }
    },
    [apiCall, users, addNotification]
  );

  const deleteUser = useCallback(
    async (userId) => {
      try {
        await apiCall('DELETE', `/users/${userId}`);
        setUsers(users.filter((u) => u.id !== userId));
        addNotification('User deleted successfully', 'success');
      } catch (err) {
        addNotification('Failed to delete user', 'error');
        throw err;
      }
    },
    [apiCall, users, addNotification]
  );

  // Book Methods
  const fetchBooks = useCallback(
    async (filters = {}) => {
      try {
        const query = new URLSearchParams(filters).toString();
        const data = await apiCall('GET', `/books?${query}`);
        setBooks(Array.isArray(data) ? data : data.books || []);
        return data;
      } catch (err) {
        console.error('Failed to fetch books:', err);
        throw err;
      }
    },
    [apiCall]
  );

  const createBook = useCallback(
    async (bookData) => {
      try {
        const data = await apiCall('POST', '/books', bookData);
        setBooks([...books, data]);
        addNotification('Book created successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to create book', 'error');
        throw err;
      }
    },
    [apiCall, books, addNotification]
  );

  const updateBook = useCallback(
    async (bookId, bookData) => {
      try {
        const data = await apiCall('PUT', `/books/${bookId}`, bookData);
        setBooks(books.map((b) => (b.id === bookId ? data : b)));
        addNotification('Book updated successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to update book', 'error');
        throw err;
      }
    },
    [apiCall, books, addNotification]
  );

  // Transaction Methods
  const issueBook = useCallback(
    async (transactionData) => {
      try {
        const data = await apiCall('POST', '/transactions/issue', transactionData);
        addNotification('Book issued successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to issue book', 'error');
        throw err;
      }
    },
    [apiCall, addNotification]
  );

  const returnBook = useCallback(
    async (transactionData) => {
      try {
        const data = await apiCall('POST', '/transactions/return', transactionData);
        addNotification('Book returned successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to return book', 'error');
        throw err;
      }
    },
    [apiCall, addNotification]
  );

  // Settings Methods
  const updateSettings = useCallback(
    async (newSettings) => {
      try {
        const data = await apiCall('PUT', '/settings', newSettings);
        setSettings(data);
        addNotification('Settings updated successfully', 'success');
        return data;
      } catch (err) {
        addNotification('Failed to update settings', 'error');
        throw err;
      }
    },
    [apiCall, addNotification]
  );

  const value = {
    // API Client
    api,
    
    // State
    user,
    token,
    loading,
    error,
    
    // UI State
    sidebarOpen,
    setSidebarOpen,
    theme,
    setTheme,
    
    // Data
    stats,
    users,
    books,
    transactions,
    fines,
    settings,
    
    // Auth Methods
    login,
    logout,
    
    // Dashboard
    fetchDashboardStats,
    refreshStats: fetchDashboardStats, // Alias for backward compatibility
    
    // User Methods
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    
    // Book Methods
    fetchBooks,
    createBook,
    updateBook,
    
    // Transaction Methods
    issueBook,
    returnBook,
    
    // Settings
    updateSettings,
    
    // Utilities
    apiCall,
    addNotification,
    notifications,
    clearError,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// Custom Hook
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
