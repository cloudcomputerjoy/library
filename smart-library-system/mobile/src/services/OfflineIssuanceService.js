/**
 * Offline Issuance Service
 * Handles storing pending issuance operations locally
 * Syncs with server when online
 * 
 * Features:
 * - Store pending batch issues locally
 * - Queue management
 * - Automatic sync when online
 * - Conflict resolution
 * - Retry logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEY = 'offline_issue_queue';
const QUEUE_SIZE_LIMIT = 100; // Max pending operations

class OfflineIssuanceService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.isOnline = true;
    this.isSyncing = false;
    this.syncListeners = [];
  }

  /**
   * Initialize offline service
   * Set up connectivity listener
   */
  async initialize() {
    // Check initial connectivity
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected && netInfo.isInternetReachable;

    // Listen for connectivity changes
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      // If just came online, attempt sync
      if (!wasOnline && this.isOnline) {
        this.notifySyncListeners({ status: 'online', action: 'sync_started' });
        this.syncPendingOperations();
      }
    });
  }

  /**
   * Check if online
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * Add listener for sync events
   */
  addSyncListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all sync listeners
   */
  notifySyncListeners(event) {
    this.syncListeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  /**
   * Add pending batch issue to queue
   * Entry: { session_id, user_id, books: [book_ids], timestamp }
   */
  async addPendingIssue(entry) {
    try {
      const queue = await this._getQueue();

      // Check queue size
      if (queue.length >= QUEUE_SIZE_LIMIT) {
        throw new Error('Queue is full. Please sync pending operations.');
      }

      // Create entry with unique ID
      const pendingEntry = {
        id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
        retries: 0,
        status: 'pending',
        error: null
      };

      queue.push(pendingEntry);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

      return {
        success: true,
        pending_id: pendingEntry.id,
        queue_size: queue.length
      };
    } catch (err) {
      console.error('Error adding pending issue:', err);
      throw err;
    }
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations() {
    try {
      return await this._getQueue();
    } catch (err) {
      console.error('Error getting pending operations:', err);
      return [];
    }
  }

  /**
   * Sync all pending operations with server
   */
  async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;

    try {
      const queue = await this._getQueue();

      if (queue.length === 0) {
        this.notifySyncListeners({
          status: 'sync_complete',
          synced_count: 0,
          failed_count: 0
        });
        return;
      }

      let syncedCount = 0;
      let failedCount = 0;
      const failedEntries = [];

      for (const entry of queue) {
        if (entry.status === 'synced') continue;

        try {
          // Attempt to sync this entry
          const result = await this._syncSingleEntry(entry);

          if (result.success) {
            entry.status = 'synced';
            entry.sync_time = new Date().toISOString();
            syncedCount++;

            this.notifySyncListeners({
              status: 'syncing',
              progress: `${syncedCount}/${queue.length}`
            });
          } else {
            entry.retries = (entry.retries || 0) + 1;
            entry.error = result.error;

            // Max 3 retries
            if (entry.retries >= 3) {
              entry.status = 'failed';
              failedCount++;
            }

            failedEntries.push(entry);
          }
        } catch (err) {
          entry.retries = (entry.retries || 0) + 1;
          entry.error = err.message;

          if (entry.retries >= 3) {
            entry.status = 'failed';
            failedCount++;
          }

          failedEntries.push(entry);
        }
      }

      // Update queue
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

      this.notifySyncListeners({
        status: 'sync_complete',
        synced_count: syncedCount,
        failed_count: failedCount,
        queue_size: queue.length - syncedCount
      });

      if (failedCount > 0) {
        console.warn(`Failed to sync ${failedCount} entries`);
      }
    } catch (err) {
      console.error('Sync error:', err);

      this.notifySyncListeners({
        status: 'sync_error',
        error: err.message
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync single entry
   */
  async _syncSingleEntry(entry) {
    try {
      // Call finalize endpoint with offline data
      const response = await axios.post(
        `${this.apiUrl}/api/issue/sync-offline`,
        {
          offline_id: entry.id,
          session_id: entry.session_id,
          user_id: entry.user_id,
          books: entry.books,
          timestamp: entry.timestamp
        },
        { timeout: 10000 }
      );

      if (response.data.success) {
        return {
          success: true,
          server_id: response.data.issue_id
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Clear queue (after sync)
   */
  async clearQueue() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return { success: true };
    } catch (err) {
      console.error('Error clearing queue:', err);
      throw err;
    }
  }

  /**
   * Clear specific entry
   */
  async clearEntry(offlineId) {
    try {
      const queue = await this._getQueue();
      const filtered = queue.filter(e => e.id !== offlineId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { success: true };
    } catch (err) {
      console.error('Error clearing entry:', err);
      throw err;
    }
  }

  /**
   * Get queue from storage
   */
  async _getQueue() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error reading queue:', err);
      return [];
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const queue = await this._getQueue();

      return {
        total: queue.length,
        pending: queue.filter(e => e.status === 'pending').length,
        synced: queue.filter(e => e.status === 'synced').length,
        failed: queue.filter(e => e.status === 'failed').length,
        is_syncing: this.isSyncing,
        is_online: this.isOnline
      };
    } catch (err) {
      console.error('Error getting queue stats:', err);
      return {
        total: 0,
        pending: 0,
        synced: 0,
        failed: 0,
        is_syncing: false,
        is_online: this.isOnline
      };
    }
  }

  /**
   * Retry failed entries
   */
  async retryFailed() {
    try {
      const queue = await this._getQueue();
      const failedEntries = queue.filter(e => e.status === 'failed');

      failedEntries.forEach(entry => {
        entry.status = 'pending';
        entry.retries = 0;
        entry.error = null;
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));

      return {
        success: true,
        retrying_count: failedEntries.length
      };
    } catch (err) {
      console.error('Error retrying failed:', err);
      throw err;
    }
  }
}

// Singleton instance
let offlineServiceInstance = null;

/**
 * Get or create offline service instance
 */
export const getOfflineIssuanceService = (apiUrl = 'http://localhost:5000') => {
  if (!offlineServiceInstance) {
    offlineServiceInstance = new OfflineIssuanceService(apiUrl);
    offlineServiceInstance.initialize();
  }
  return offlineServiceInstance;
};

export default OfflineIssuanceService;
