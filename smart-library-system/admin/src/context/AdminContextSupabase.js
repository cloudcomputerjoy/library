// Updated Admin Context - Integrated with Supabase Backend
import React, { createContext, useState, useCallback, useEffect } from 'react';
import {
  dashboardAPI,
  usersAPI,
  booksAPI,
  transactionsAPI,
  finesAPI,
  printJobsAPI,
  supportAPI,
  settingsAPI,
  reportsAPI,
  apiUtils,
} from '../services/supabaseApi';

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // State
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fines, setFines] = useState([]);
  const [printJobs, setPrintJobs] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // Message notification timing
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Error notification timing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ============================================
  // DASHBOARD FUNCTIONS
  // ============================================

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setDashboardStats(response.data.data);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLiveFeed = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getLiveFeed(limit);
      setLiveFeed(response.data.data);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // USER MANAGEMENT FUNCTIONS
  // ============================================

  const fetchUsers = useCallback(async (currentPage = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers(currentPage, 20, filters);
      setUsers(response.data.data);
      setTotalRecords(response.data.total);
      setPage(currentPage);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await usersAPI.getUser(userId);
      setSelectedUser(response.data.data);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await usersAPI.createUser(userData);
      setUsers([...users, response.data.data]);
      setMessage('User created successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [users]);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      setLoading(true);
      const response = await usersAPI.updateUser(userId, userData);
      setUsers(users.map(u => (u.id === userId ? response.data.data : u)));
      setMessage('User updated successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [users]);

  const deleteUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      await usersAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      setMessage('User deleted successfully');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [users]);

  const bulkImportUsers = useCallback(async (usersData) => {
    try {
      setLoading(true);
      const response = await usersAPI.bulkImportUsers(usersData);
      setMessage(`${response.data.imported} users imported successfully`);
      setError(null);
      await fetchUsers(1);
      return response.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  // ============================================
  // BOOK MANAGEMENT FUNCTIONS
  // ============================================

  const fetchBooks = useCallback(async (currentPage = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBooks(currentPage, 20, filters);
      setBooks(response.data.data);
      setTotalRecords(response.data.total);
      setPage(currentPage);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBook = useCallback(async (bookId) => {
    try {
      setLoading(true);
      const response = await booksAPI.getBook(bookId);
      setSelectedBook(response.data.data);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const searchBooks = useCallback(async (query, limit = 50) => {
    try {
      setLoading(true);
      const response = await booksAPI.searchBooks(query, limit);
      setBooks(response.data.data);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const addBook = useCallback(async (bookData) => {
    try {
      setLoading(true);
      const response = await booksAPI.createBook(bookData);
      setBooks([...books, response.data.data]);
      setMessage('Book created successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [books]);

  const updateBook = useCallback(async (bookId, bookData) => {
    try {
      setLoading(true);
      const response = await booksAPI.updateBook(bookId, bookData);
      setBooks(books.map(b => (b.id === bookId ? response.data.data : b)));
      setMessage('Book updated successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [books]);

  const deleteBook = useCallback(async (bookId) => {
    try {
      setLoading(true);
      await booksAPI.deleteBook(bookId);
      setBooks(books.filter(b => b.id !== bookId));
      setMessage('Book deleted successfully');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [books]);

  const addBookCopies = useCallback(async (bookId, count, shelfLocation = 'A-1-1-1') => {
    try {
      setLoading(true);
      const response = await booksAPI.addBookCopies(bookId, count, shelfLocation);
      setMessage(`${response.data.added} copies added successfully`);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // TRANSACTION FUNCTIONS
  // ============================================

  const fetchTransactions = useCallback(async (currentPage = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getTransactions(currentPage, 20, filters);
      setTransactions(response.data.data);
      setTotalRecords(response.data.total);
      setPage(currentPage);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const issueBook = useCallback(async (userId, bookId, copyId, dueDate = null) => {
    try {
      setLoading(true);
      const response = await transactionsAPI.issueBook(userId, bookId, copyId, dueDate);
      await fetchTransactions(1);
      setMessage('Book issued successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  const returnBook = useCallback(async (transactionId, condition = 'good', remarks = null) => {
    try {
      setLoading(true);
      const response = await transactionsAPI.returnBook(transactionId, condition, remarks);
      await fetchTransactions(1);
      setMessage('Book returned successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  // ============================================
  // FINE MANAGEMENT FUNCTIONS
  // ============================================

  const fetchFines = useCallback(async (currentPage = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await finesAPI.getFines(currentPage, 20, filters);
      setFines(response.data.data);
      setTotalRecords(response.data.total);
      setPage(currentPage);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const payFine = useCallback(async (fineId, paymentMethod = 'cash') => {
    try {
      setLoading(true);
      const response = await finesAPI.payFine(fineId, paymentMethod);
      await fetchFines(1);
      setMessage('Fine paid successfully');
      setError(null);
      return response.data.data;
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchFines]);

  // ============================================
  // PRINT JOBS FUNCTIONS
  // ============================================

  const fetchPrintJobs = useCallback(async (currentPage = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await printJobsAPI.getPrintJobs(currentPage, 20, filters);
      setPrintJobs(response.data.data);
      setTotalRecords(response.data.total);
      setPage(currentPage);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePrintJob = useCallback(async (jobId) => {
    try {
      setLoading(true);
      const response = await printJobsAPI.approvePrintJob(jobId);
      setPrintJobs(printJobs.map(j => (j.id === jobId ? response.data.data : j)));
      setMessage('Print job approved');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [printJobs]);

  const rejectPrintJob = useCallback(async (jobId, reason = '') => {
    try {
      setLoading(true);
      const response = await printJobsAPI.rejectPrintJob(jobId, reason);
      setPrintJobs(printJobs.map(j => (j.id === jobId ? response.data.data : j)));
      setMessage('Print job rejected');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [printJobs]);

  // ============================================
  // SUPPORT TICKETS FUNCTIONS
  // ============================================

  const fetchSupportTickets = useCallback(async (currentPage = 1, filters = {}) => {
    try {
      setLoading(true);
      const response = await supportAPI.getTickets(currentPage, 20, filters);
      setSupportTickets(response.data.data);
      setTotalRecords(response.data.total);
      setPage(currentPage);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const assignTicket = useCallback(async (ticketId, assignedTo) => {
    try {
      setLoading(true);
      const response = await supportAPI.assignTicket(ticketId, assignedTo);
      setSupportTickets(supportTickets.map(t => (t.id === ticketId ? response.data.data : t)));
      setMessage('Ticket assigned');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [supportTickets]);

  const resolveTicket = useCallback(async (ticketId, resolutionNotes) => {
    try {
      setLoading(true);
      const response = await supportAPI.resolveTicket(ticketId, resolutionNotes);
      setSupportTickets(supportTickets.map(t => (t.id === ticketId ? response.data.data : t)));
      setMessage('Ticket resolved');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [supportTickets]);

  // ============================================
  // SETTINGS FUNCTIONS
  // ============================================

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllSettings();
      setSettings(response.data.data);
      setError(null);
    } catch (err) {
      setError(apiUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    try {
      setLoading(true);
      const response = await settingsAPI.updateSetting(key, value);
      setSettings({ ...settings, [key]: response.data.data });
      setMessage('Setting updated successfully');
      setError(null);
    } catch (err) {
      const errorMsg = apiUtils.getErrorMessage(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Context value
  const value = {
    // State
    users,
    books,
    transactions,
    fines,
    printJobs,
    supportTickets,
    dashboardStats,
    liveFeed,
    settings,
    loading,
    error,
    message,
    page,
    totalRecords,
    selectedUser,
    selectedBook,

    // Dashboard
    fetchDashboardStats,
    fetchLiveFeed,

    // Users
    fetchUsers,
    fetchUser,
    addUser,
    updateUser,
    deleteUser,
    bulkImportUsers,

    // Books
    fetchBooks,
    fetchBook,
    searchBooks,
    addBook,
    updateBook,
    deleteBook,
    addBookCopies,

    // Transactions
    fetchTransactions,
    issueBook,
    returnBook,

    // Fines
    fetchFines,
    payFine,

    // Print Jobs
    fetchPrintJobs,
    approvePrintJob,
    rejectPrintJob,

    // Support Tickets
    fetchSupportTickets,
    assignTicket,
    resolveTicket,

    // Settings
    fetchSettings,
    updateSetting,

    // Utilities
    setError,
    setMessage,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export default AdminContext;
