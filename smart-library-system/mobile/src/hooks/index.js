/**
 * Custom React Hooks
 * useAuth, useQR, useFetch hooks for common functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';
import * as api from '../services/api';

/**
 * useAuth Hook - Authentication management
 * Provides login, signup, logout, token refresh functionality
 */
export const useAuth = () => {
  const { authStore, userStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.login(email, password);
      await authStore.saveAuth(response.user, response.token, response.refreshToken);
      
      return { success: true, data: response };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [authStore]);

  const signup = useCallback(async (name, email, phone, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [firstName, ...rest] = name.split(' ');
      const lastName = rest.join(' ') || '';
      const response = await api.register(email, password, phone, firstName, lastName);
      await authStore.saveAuth(response.user, response.token, response.refreshToken);
      
      return { success: true, data: response };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Signup failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [authStore]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      authStore.logout();
      setIsLoading(false);
    }
  }, [authStore]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.refreshToken();
      authStore.setToken(response.token);
      authStore.setRefreshToken(response.refreshToken || null);
      return { success: true };
    } catch (err) {
      authStore.logout();
      return { success: false, error: 'Token refresh failed' };
    }
  }, [authStore]);

  return {
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
    token: authStore.token,
    isLoading,
    error,
    login,
    signup,
    logout,
    refreshToken,
  };
};

/**
 * useQR Hook - QR code management
 * Handles QR generation, refresh, and countdown
 */
export const useQR = (enabled = true) => {
  const [qrCode, setQRCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(15);

  const generateQR = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.generateQR();
      setQRCode(response);
      setTimeRemaining(15); // Reset countdown to 15 seconds
      setError(null);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'QR generation failed';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!enabled) return;

    generateQR(); // Generate immediately

    const refreshInterval = setInterval(() => {
      generateQR();
    }, 10000); // 10 seconds

    return () => clearInterval(refreshInterval);
  }, [enabled, generateQR]);

  // Countdown timer for expiry display
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const manualRefresh = useCallback(async () => {
    return await generateQR();
  }, [generateQR]);

  return {
    qrCode,
    isLoading,
    error,
    timeRemaining,
    generateQR,
    manualRefresh,
  };
};

/**
 * useFetch Hook - Generic data fetching
 * Handles loading, error, and data states
 */
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch data';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = useCallback(async () => {
    return await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
  };
};

/**
 * useBooks Hook - Book management
 * Fetches and manages book list with filtering
 */
export const useBooks = () => {
  const { booksStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBooks = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const books = await api.getBooks(filters);
      booksStore.setBooks(books);
      return books;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch books';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [booksStore]);

  const searchBooks = useCallback((query) => {
    booksStore.setSearchQuery(query);
    return booksStore.filterBooks();
  }, [booksStore]);

  const filterBooks = useCallback((filters) => {
    booksStore.setFilter(filters);
    return booksStore.filterBooks();
  }, [booksStore]);

  return {
    books: booksStore.books,
    filteredBooks: booksStore.filterBooks(),
    isLoading,
    error,
    fetchBooks,
    searchBooks,
    filterBooks,
  };
};

/**
 * useTransactions Hook - Transaction (Issue/Return) management
 */
export const useTransactions = () => {
  const { userStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const issueBook = useCallback(async (bookId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.issueBook(bookId);
      userStore.increaseBookCount();
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to issue book';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userStore]);

  const returnBook = useCallback(async (transactionId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.returnBook(transactionId);
      userStore.decreaseBookCount();
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to return book';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userStore]);

  const reserveBook = useCallback(async (bookId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.reserveBook(bookId);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reserve book';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    issueBook,
    returnBook,
    reserveBook,
  };
};

/**
 * useFiles Hook - File sharing management
 */
export const useFiles = () => {
  const { filesStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file, description = '') => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await api.uploadFile(file, description);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      filesStore.addFile(response);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'File upload failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, [filesStore]);

  const fetchSharedFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const files = await api.getSharedFiles();
      filesStore.addFile(...files);
      return files;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch files';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [filesStore]);

  const deleteFile = useCallback(async (fileId) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.deleteFile(fileId);
      filesStore.deleteFile(fileId);
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete file';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [filesStore]);

  return {
    uploadedFiles: filesStore.uploadedFiles,
    sharedFiles: filesStore.sharedFiles,
    isLoading,
    error,
    uploadProgress,
    uploadFile,
    fetchSharedFiles,
    deleteFile,
  };
};

/**
 * usePrint Hook - Print job management
 */
export const usePrint = () => {
  const { printStore } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestPrint = useCallback(async (fileId, pages = null, isColor = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.requestPrint(fileId, pages, isColor);
      printStore.addPrintJob(response);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Print request failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [printStore]);

  const fetchPrintJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const jobs = await api.getPrintJobs();
      printStore.setJobs(jobs);
      return jobs;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch print jobs';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [printStore]);

  const updatePrintStatus = useCallback(async (jobId, status) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.updatePrintStatus(jobId, status);
      printStore.updatePrintStatus(jobId, response);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update print status';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [printStore]);

  return {
    printJobs: printStore.printJobs,
    isLoading,
    error,
    requestPrint,
    fetchPrintJobs,
    updatePrintStatus,
  };
};

export default {
  useAuth,
  useQR,
  useFetch,
  useBooks,
  useTransactions,
  useFiles,
  usePrint,
};
