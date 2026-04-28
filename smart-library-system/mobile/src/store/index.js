/**
 * Zustand Store - Global state management
 */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth Store - User authentication state
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => {
    const token = get().token;
    set({ user, isAuthenticated: !!user && !!token });
  },
  setToken: (token) => {
    const user = get().user;
    set({ token, isAuthenticated: !!token && !!user });
  },
  setRefreshToken: (refreshToken) => set({ refreshToken }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  saveAuth: async (user, token, refreshToken = null) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userToken', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      set({ user, token, refreshToken, isAuthenticated: true });
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('refreshToken');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  restoreAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem('userToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userJson = await AsyncStorage.getItem('user');
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error restoring auth:', error);
      set({ isLoading: false });
    }
  },
}));

/**
 * QR Store - QR code state
 */
export const useQRStore = create((set) => ({
  currentQR: null,
  qrHistory: [],
  attendanceStatus: null,
  isScanning: false,

  setCurrentQR: (qr) => set({ currentQR: qr }),
  setQRHistory: (history) => set({ qrHistory: history }),
  setAttendanceStatus: (status) => set({ attendanceStatus: status }),
  setIsScanning: (isScanning) => set({ isScanning }),

  addToHistory: (entry) =>
    set((state) => ({
      qrHistory: [entry, ...state.qrHistory].slice(0, 50),
    })),

  clearHistory: () => set({ qrHistory: [] }),
}));

/**
 * Book Store - Books and transactions state
 */
export const useBookStore = create((set) => ({
  books: [],
  myTransactions: [],
  selectedBook: null,
  isSearching: false,
  searchQuery: '',

  setBooks: (books) => set({ books }),
  setMyTransactions: (transactions) => set({ myTransactions: transactions }),
  setSelectedBook: (book) => set({ selectedBook: book }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  updateBooks: (books) =>
    set((state) => ({
      books: [...new Map([...state.books, ...books].map(item => [item.id, item])).values()],
    })),

  addTransaction: (transaction) =>
    set((state) => ({
      myTransactions: [transaction, ...state.myTransactions],
    })),
}));

/**
 * File Store - File sharing state
 */
export const useFileStore = create((set) => ({
  myFiles: [],
  uploadingFiles: [],
  selectedFile: null,

  setMyFiles: (files) => set({ myFiles: files }),
  setSelectedFile: (file) => set({ selectedFile: file }),

  addUploadingFile: (file) =>
    set((state) => ({
      uploadingFiles: [...state.uploadingFiles, file],
    })),

  removeUploadingFile: (fileId) =>
    set((state) => ({
      uploadingFiles: state.uploadingFiles.filter(f => f.id !== fileId),
    })),

  addFile: (file) =>
    set((state) => ({
      myFiles: [file, ...state.myFiles],
    })),

  deleteFile: (fileId) =>
    set((state) => ({
      myFiles: state.myFiles.filter(f => f.id !== fileId),
    })),

  updateFile: (fileId, updates) =>
    set((state) => ({
      myFiles: state.myFiles.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      ),
    })),
}));

/**
 * Print Store - Print management state
 */
export const usePrintStore = create((set) => ({
  printJobs: [],
  selectedPrintJob: null,
  printingFileId: null,

  setPrintJobs: (jobs) => set({ printJobs: jobs }),
  setSelectedPrintJob: (job) => set({ selectedPrintJob: job }),
  setPrintingFileId: (fileId) => set({ printingFileId: fileId }),

  addPrintJob: (job) =>
    set((state) => ({
      printJobs: [job, ...state.printJobs],
    })),

  updatePrintJob: (jobId, updates) =>
    set((state) => ({
      printJobs: state.printJobs.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    })),

  deletePrintJob: (jobId) =>
    set((state) => ({
      printJobs: state.printJobs.filter(job => job.id !== jobId),
    })),
}));

/**
 * Notification Store - Notifications state
 */
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));

/**
 * UI Store - General UI state
 */
export const useUIStore = create((set) => ({
  loading: false,
  error: null,
  success: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),

  clearMessages: () => set({ error: null, success: null }),
}));

export const useUserStore = create((set) => ({
  borrowedBooksCount: 0,
  reservedBooksCount: 0,

  increaseBookCount: () => set((state) => ({ borrowedBooksCount: state.borrowedBooksCount + 1 })),
  decreaseBookCount: () => set((state) => ({ borrowedBooksCount: Math.max(0, state.borrowedBooksCount - 1) })),
  addReservation: () => set((state) => ({ reservedBooksCount: state.reservedBooksCount + 1 })),
  clearReservations: () => set({ reservedBooksCount: 0 }),
}));

export const useStore = () => ({
  authStore: useAuthStore(),
  userStore: useUserStore(),
  qrStore: useQRStore(),
  booksStore: useBookStore(),
  fileStore: useFileStore(),
  printStore: usePrintStore(),
  notificationStore: useNotificationStore(),
  uiStore: useUIStore(),
});
