/**
 * Socket.IO Service - Real-time event handling
 */

import { io } from 'socket.io-client/dist/socket.io.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_SERVER_URL } from '../config/api';

let socket = null;

export const socketService = {
  /**
   * Connect to Socket.IO server
   */
  connect: async (token) => {
    if (socket?.connected) {
      return socket;
    }

    const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_SERVER_URL;

    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected');
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
    });

    socket.on('error', (error) => {
      console.error('[Socket.IO] Error:', error);
    });

    return socket;
  },

  /**
   * Disconnect from Socket.IO
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Get Socket instance
   */
  getSocket: () => socket,

  /**
   * Listen to entry success event
   */
  onEntrySuccess: (callback) => {
    socket?.on('entry_success', callback);
  },

  /**
   * Listen to exit success event
   */
  onExitSuccess: (callback) => {
    socket?.on('exit_success', callback);
  },

  /**
   * Listen to book issued event
   */
  onBookIssued: (callback) => {
    socket?.on('book_issued', callback);
  },

  /**
   * Listen to book available event
   */
  onBookAvailable: (callback) => {
    socket?.on('book_available', callback);
  },

  /**
   * Listen to file uploaded event
   */
  onFileUploaded: (callback) => {
    socket?.on('file_uploaded', callback);
  },

  /**
   * Listen to file received event
   */
  onFileReceived: (callback) => {
    socket?.on('file_received', callback);
  },

  /**
   * Listen to file auto-deleted event
   */
  onFileAutoDeleted: (callback) => {
    socket?.on('file_auto_deleted', callback);
  },

  /**
   * Listen to print status updated
   */
  onPrintStatusUpdated: (callback) => {
    socket?.on('print_status_updated', callback);
  },

  /**
   * Listen to print ready for pickup
   */
  onPrintReadyForPickup: (callback) => {
    socket?.on('print_ready_for_pickup', callback);
  },

  /**
   * Listen to new print job
   */
  onNewPrintJob: (callback) => {
    socket?.on('new_print_job', callback);
  },

  /**
   * Listen to notification
   */
  onNotification: (callback) => {
    socket?.on('notification', callback);
  },

  /**
   * Listen to fine charged
   */
  onFineCharged: (callback) => {
    socket?.on('fine_charged', callback);
  },

  /**
   * Listen to book issuance success (real-time)
   */
  onIssuanceSuccess: (userId, callback) => {
    socket?.on(`issuance_success_${userId}`, callback);
  },

  /**
   * Listen to due date reminder (real-time)
   */
  onDueDateReminder: (userId, callback) => {
    socket?.on(`due_date_reminder_${userId}`, callback);
  },

  /**
   * Listen to book returned notification (real-time)
   */
  onBookReturned: (userId, callback) => {
    socket?.on(`book_returned_${userId}`, callback);
  },

  /**
   * Emit entry scan event
   */
  emitEntryScan: (data) => {
    socket?.emit('entry_scan', data);
  },

  /**
   * Emit exit scan event
   */
  emitExitScan: (data) => {
    socket?.emit('exit_scan', data);
  },

  /**
   * Emit file uploaded event
   */
  emitFileUploaded: (data) => {
    socket?.emit('file_uploaded', data);
  },

  /**
   * Emit file shared event
   */
  emitFileShared: (data) => {
    socket?.emit('file_shared', data);
  },

  /**
   * Emit print requested event
   */
  emitPrintRequested: (data) => {
    socket?.emit('print_requested', data);
  },

  /**
   * Emit print status check
   */
  emitPrintStatusCheck: (data) => {
    socket?.emit('print_status_check', data);
  },

  /**
   * Remove specific event listener
   */
  offEvent: (eventName, callback) => {
    if (socket) {
      socket.off(eventName, callback);
    }
  },

  /**
   * Remove issuance success listener
   */
  offIssuanceSuccess: (userId, callback) => {
    if (socket) {
      socket.off(`issuance_success_${userId}`, callback);
    }
  },

  /**
   * Remove due date reminder listener
   */
  offDueDateReminder: (userId, callback) => {
    if (socket) {
      socket.off(`due_date_reminder_${userId}`, callback);
    }
  },

  /**
   * Remove book returned listener
   */
  offBookReturned: (userId, callback) => {
    if (socket) {
      socket.off(`book_returned_${userId}`, callback);
    }
  },

  /**
   * Remove all listeners for event
   */
  offAllEvents: (eventName) => {
    if (socket) {
      socket.removeAllListeners(eventName);
    }
  },
};

export const initializeSocket = async (token) => {
  return await socketService.connect(token);
};

export const disconnectSocket = () => {
  socketService.disconnect();
};

export default socketService;
