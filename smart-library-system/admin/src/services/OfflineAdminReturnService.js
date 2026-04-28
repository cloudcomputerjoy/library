/**
 * Offline Admin Return Service
 * Manages offline queue for book return transactions on PC admin dashboard
 */

class OfflineAdminReturnService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingQueue = [];
    this.syncListeners = [];
    this.syncInProgress = false;
    this.maxRetries = 3;
    this.retryDelays = [1000, 3000, 5000];
    this.STORAGE_KEY = 'admin_return_queue';

    this.initialize();
  }

  initialize() {
    this.loadQueue();
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingQueue.length > 0 && !this.syncInProgress) {
        this.sync();
      }
    }, 5000);
  }

  handleOnline() {
    this.isOnline = true;
    this.notifySyncListeners({
      status: 'online',
      message: '✓ Connection restored'
    });
    if (this.pendingQueue.length > 0) {
      this.sync();
    }
  }

  handleOffline() {
    this.isOnline = false;
    this.notifySyncListeners({
      status: 'offline',
      message: '⚠️ Working offline - returns will sync when connected'
    });
  }

  async queueReturnTransaction(transactionData) {
    const queueItem = {
      id: `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'finalize',
      data: transactionData,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending',
      error: null
    };

    this.pendingQueue.push(queueItem);
    this.saveQueue();

    this.notifySyncListeners({
      status: 'queued',
      message: `Return queued: ${queueItem.id}`,
      transaction_id: queueItem.id,
      queue_length: this.pendingQueue.length
    });

    if (this.isOnline && !this.syncInProgress) {
      this.sync();
    }

    return queueItem.id;
  }

  async sync(apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000') {
    if (this.syncInProgress || this.pendingQueue.length === 0 || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let syncedCount = 0;
    let failedCount = 0;

    this.notifySyncListeners({
      status: 'syncing',
      message: `Syncing ${this.pendingQueue.length} return(s)...`,
      queue_length: this.pendingQueue.length
    });

    for (let i = 0; i < this.pendingQueue.length; i++) {
      const item = this.pendingQueue[i];

      if (item.status === 'completed' || item.synced) {
        syncedCount++;
        continue;
      }

      try {
        const success = await this.syncWithRetry(item, apiUrl);

        if (success) {
          item.status = 'completed';
          item.synced = true;
          syncedCount++;

          this.notifySyncListeners({
            status: 'synced_item',
            message: `✓ Return synced: ${item.id}`,
            transaction_id: item.id,
            synced_count: syncedCount
          });
        } else {
          failedCount++;
          item.status = 'failed';

          this.notifySyncListeners({
            status: 'sync_failed',
            message: `❌ Failed to sync return: ${item.id}`,
            transaction_id: item.id,
            error: item.error,
            retries_left: this.maxRetries - item.retries
          });
        }
      } catch (err) {
        failedCount++;
        item.status = 'failed';
        item.error = err.message;
      }
    }

    this.pendingQueue = this.pendingQueue.filter(item => item.status !== 'completed');
    this.saveQueue();
    this.syncInProgress = false;

    const result = { synced: syncedCount, failed: failedCount };

    this.notifySyncListeners({
      status: 'sync_complete',
      message: `Sync complete: ${syncedCount} synced, ${failedCount} failed`,
      synced_count: syncedCount,
      failed_count: failedCount,
      pending_count: this.pendingQueue.length
    });

    return result;
  }

  async syncWithRetry(item, apiUrl) {
    while (item.retries < this.maxRetries) {
      try {
        if (item.type === 'finalize') {
          const response = await fetch(`${apiUrl}/api/return/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
            timeout: 5000
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.success) {
            return true;
          } else {
            throw new Error(data.message || 'Unknown error');
          }
        }

        return true;
      } catch (err) {
        item.error = err.message;
        item.retries++;

        if (item.retries < this.maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelays[item.retries - 1])
          );
        }
      }
    }

    return false;
  }

  async retryFailed(apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000') {
    const failedItems = this.pendingQueue.filter(item => item.status === 'failed');

    if (failedItems.length === 0) {
      return { retried: 0, success: 0 };
    }

    let successCount = 0;

    for (const item of failedItems) {
      item.retries = 0;
      item.status = 'pending';

      try {
        const success = await this.syncWithRetry(item, apiUrl);
        if (success) {
          item.status = 'completed';
          item.synced = true;
          successCount++;
        }
      } catch (err) {
        item.status = 'failed';
      }
    }

    this.pendingQueue = this.pendingQueue.filter(item => item.status !== 'completed');
    this.saveQueue();

    return { retried: failedItems.length, success: successCount };
  }

  getStatus() {
    const pendingItems = this.pendingQueue.filter(item => item.status === 'pending');
    const failedItems = this.pendingQueue.filter(item => item.status === 'failed');
    const completedItems = this.pendingQueue.filter(item => item.status === 'completed' || item.synced);

    return {
      isOnline: this.isOnline,
      pending_count: pendingItems.length,
      failed_count: failedItems.length,
      completed_count: completedItems.length,
      total_queue: this.pendingQueue.length,
      sync_in_progress: this.syncInProgress,
      queue_items: this.pendingQueue
    };
  }

  clearQueue() {
    this.pendingQueue = [];
    this.saveQueue();
    this.notifySyncListeners({
      status: 'queue_cleared',
      message: 'All queued returns cleared'
    });
  }

  saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingQueue));
    } catch (err) {
      console.error('Failed to save return queue:', err);
    }
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.pendingQueue = JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load return queue:', err);
      this.pendingQueue = [];
    }
  }

  addSyncListener(callback) {
    this.syncListeners.push(callback);
  }

  removeSyncListener(callback) {
    this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
  }

  notifySyncListeners(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

let instance = null;

export const getOfflineAdminReturnService = () => {
  if (!instance) {
    instance = new OfflineAdminReturnService();
  }
  return instance;
};

export default OfflineAdminReturnService;
