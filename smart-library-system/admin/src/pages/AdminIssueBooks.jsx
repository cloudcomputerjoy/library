import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  LinearProgress,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Undo,
  Refresh,
  QrCode,
  Close,
  Done,
  Schedule,
  CloudOff,
  CloudDone,
  Menu as MenuIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { getOfflineAdminIssueService } from '../services/OfflineAdminIssueService';
import { getCurrencyService } from '../services/CurrencyService';
import {
  SessionInfoSkeleton,
  PendingRequestsSkeleton,
  ListItemSkeleton,
} from '../components/SkeletonLoader';

/**
 * Admin Issue Books Component
 * Admin controls the entire book issuance process
 * 
 * Flow:
 * 1. Admin scans student QR → Initialize session
 * 2. Admin scans books → Real-time validation
 * 3. Auto-finalize or manual finish
 * 4. Show results with undo option
 */

const AdminIssueBooks = () => {
  const qrInputRef = useRef(null);
  const offlineServiceRef = useRef(null);
  const currencyServiceRef = useRef(getCurrencyService());

  // Session and UI State
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [scannedBooks, setScannedBooks] = useState([]);
  const [lastScanTime, setLastScanTime] = useState(Date.now());

  // Pending Issuance Requests (New Two-Step Flow)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPendingRequests, setShowPendingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestRefreshing, setRequestRefreshing] = useState(false);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(true);

  // Active issues table state
  const [activeIssues, setActiveIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Offline Support State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, failed
  const [queueLength, setQueueLength] = useState(0);
  const [failedQueueLength, setFailedQueueLength] = useState(0);
  const [showQueueManager, setShowQueueManager] = useState(false);

  // UI State
  const [scanMode, setScanMode] = useState('student'); // 'student' or 'book'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resultScreen, setResultScreen] = useState(false);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [undoId, setUndoId] = useState(null);
  const [manualQrInput, setManualQrInput] = useState('');

  // Session tracking
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60);
  const [inactivityTimer, setInactivityTimer] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ============================================================
  // Handler Functions (defined before useEffect hooks)
  // ============================================================

  /**
   * STEP 3 & 4: Finalize & Bulk Issue
   */
  const handleFinalize = useCallback(async (autoFinalize = false) => {
    try {
      if (scannedBooks.length === 0) {
        setError('Please scan at least one book');
        return;
      }

      setLoading(true);

      const finalize = async () => {
        const response = await axios.post(
          `${API_URL}/api/issue/finalize`,
          {
            session_id: sessionId,
            force_finalize: autoFinalize
          },
          { timeout: 5000 }
        );

        if (response.data.success) {
          setIssuedBooks(response.data.result.books_issued);
          setUndoId(response.data.result.undo_id);
          setResultScreen(true);
          setSessionActive(false);

          // Auto clear undo after 10 seconds
          setTimeout(() => {
            setUndoId(null);
          }, 10000);
        }
      };

      // If online, proceed normally
      if (isOnline) {
        await finalize();
      } else {
        // Queue for offline sync
        const transactionData = {
          session_id: sessionId,
          force_finalize: autoFinalize
        };

        const queueId = await offlineServiceRef.current.queueFinalizeTransaction(
          transactionData
        );

        setIssuedBooks(scannedBooks.map(book => ({
          ...book,
          status: 'pending_sync'
        })));
        
        setResultScreen(true);
        setSessionActive(false);
        setSuccess(`✓ Transaction queued for sync (Offline mode)\nQueue ID: ${queueId}`);

        // Update queue display
        const status = offlineServiceRef.current.getStatus();
        setQueueLength(status.pending_count);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Finalization failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [scannedBooks, sessionId, isOnline, offlineServiceRef, API_URL]);

  /**
   * Session timeout handler
   */
  const handleSessionTimeout = useCallback(() => {
    setError('⏰ Session expired after 60 seconds of inactivity');
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Reset session
   */
  const resetSession = () => {
    setSessionActive(false);
    setSessionId(null);
    setStudentInfo(null);
    setScannedBooks([]);
    setIssuedBooks([]);
    setUndoId(null);
    setResultScreen(false);
    setScanMode('student');
    setSessionTimeLeft(60);
    setError(null);
    setSuccess(null);
    setShowPendingRequests(true);
    setSelectedRequest(null);
    setManualQrInput('');

    // Refresh pending requests (will be defined later in component)
    setTimeout(() => fetchPendingRequests(), 0);

    // Focus on QR scanner
    setTimeout(() => {
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    }, 100);
  };

  // Focus QR input
  useEffect(() => {
    if (qrInputRef.current && sessionActive && scanMode === 'book') {
      qrInputRef.current.focus();
    }
  }, [sessionActive, scanMode]);

  // Initialize offline service and currency
  useEffect(() => {
    offlineServiceRef.current = getOfflineAdminIssueService();
    currencyServiceRef.current.initialize();
    
    // Set up sync listener
    const handleSyncEvent = (event) => {
      if (event.status === 'online') {
        setIsOnline(true);
        setSuccess('✓ Connection restored');
      } else if (event.status === 'offline') {
        setIsOnline(false);
        setError('⚠️ Working offline - transactions will sync when connected');
      } else if (event.status === 'syncing') {
        setSyncStatus('syncing');
      } else if (event.status === 'sync_complete') {
        setSyncStatus('synced');
        setSuccess(`✓ Synced: ${event.synced_count} transactions`);
      } else if (event.status === 'sync_failed') {
        setSyncStatus('failed');
        setError(`❌ Sync failed: ${event.message}`);
      }

      // Update queue lengths
      const status = offlineServiceRef.current.getStatus();
      setQueueLength(status.pending_count);
      setFailedQueueLength(status.failed_count);
    };

    offlineServiceRef.current.addSyncListener(handleSyncEvent);

    // Update initial status
    const initialStatus = offlineServiceRef.current.getStatus();
    setIsOnline(initialStatus.isOnline);
    setQueueLength(initialStatus.pending_count);
    setFailedQueueLength(initialStatus.failed_count);

    return () => {
      offlineServiceRef.current.removeSyncListener(handleSyncEvent);
    };
  }, []);

  // Fetch pending issuance requests on mount and periodically
  useEffect(() => {
    fetchPendingRequests();
    
    // Auto-refresh pending requests every 5 seconds
    const interval = setInterval(fetchPendingRequests, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  /**
   * Fetch pending issuance requests from students
   */
  const fetchPendingRequests = async () => {
    try {
      if (pendingRequestsLoading) {
        setRequestRefreshing(true);
      }
      const response = await axios.get(`${API_URL}/api/issues/pending-requests`, {
        timeout: 5000,
      });
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      // Don't show error to avoid UI spam
    } finally {
      setRequestRefreshing(false);
      setPendingRequestsLoading(false);
    }
  };

  const fetchActiveIssues = useCallback(async () => {
    try {
      setIssuesLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/transactions`, { timeout: 7000 });
      const payload = response.data || {};
      const rows = payload.data || payload.transactions || [];
      const active = (Array.isArray(rows) ? rows : []).filter((tx) => {
        const status = String(tx.status || '').toLowerCase();
        return ['active', 'issued', 'pending'].includes(status) &&
          !(tx.return_date || tx.returnDate || tx.returned_date);
      });
      setActiveIssues(active.slice(0, 20));
    } catch (err) {
      setActiveIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchActiveIssues();
    const t = setInterval(fetchActiveIssues, 30000);
    return () => clearInterval(t);
  }, [fetchActiveIssues]);

  /**
   * Handle book QR scan in two-step flow (admin scans any book QR to complete request)
   */
  const handleBookQRScanTwoStep = async (qrCode) => {
    try {
      setLoading(true);
      
      // Complete the first pending request with this scanned book
      if (pendingRequests.length > 0) {
        const requestToComplete = selectedRequest || pendingRequests[0];
        
        const response = await axios.post(
          `${API_URL}/api/issues/complete-request`,
          {
            requestId: requestToComplete.id,
            bookQrCode: qrCode,
            completedAt: new Date().toISOString(),
          },
          { timeout: 5000 }
        );

        if (response.data.success) {
          const actionLabel = requestToComplete.requestType || 'issue';
          setSuccess(`✓ ${actionLabel} completed for ${requestToComplete.studentName}!`);
          setIssuedBooks([{
            id: response.data.issueId,
            title: requestToComplete.bookTitle,
            isbn: requestToComplete.bookIsbn,
            status: 'issued',
            studentName: requestToComplete.studentName,
            studentId: requestToComplete.studentId,
          }]);
          setResultScreen(true);
          setShowPendingRequests(false);
          setSelectedRequest(null);

          // Refresh pending requests
          await fetchPendingRequests();

          // Auto clear success message
          setTimeout(() => {
            setSuccess(null);
          }, 3000);
        }
      } else {
        setError('❌ No pending requests available');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to complete issuance';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setManualQrInput('');
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    }
  };

  // Auto-finalize on inactivity (3 seconds)
  useEffect(() => {
    if (sessionActive && scanMode === 'book' && scannedBooks.length > 0) {
      clearTimeout(inactivityTimer);
      const timer = setTimeout(() => {
        if (Date.now() - lastScanTime > 3000) {
          handleFinalize(true);
        }
      }, 3000);
      setInactivityTimer(timer);
    }

    return () => clearTimeout(inactivityTimer);
  }, [lastScanTime, sessionActive, scanMode, scannedBooks, inactivityTimer, handleFinalize]);

  // Session timeout countdown (60 seconds)
  useEffect(() => {
    if (sessionActive && sessionExpiry) {
      const timer = setInterval(() => {
        const now = new Date();
        const expiry = new Date(sessionExpiry);
        const timeLeft = Math.max(0, Math.floor((expiry - now) / 1000));

        setSessionTimeLeft(timeLeft);

        if (timeLeft === 0) {
          handleSessionTimeout();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionExpiry, sessionActive, handleSessionTimeout]);

  /**
   * STEP 1: Scan Student QR & Initialize Session
   */
  const handleStudentQrScan = async (qrCode) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/issue/start-session`,
        {
          qr_code: qrCode,
          librarian_id: 'admin-001' // Get from auth context
        },
        { timeout: 5000 }
      );

      if (response.data.success) {
        const session = response.data.session;
        setSessionId(session.session_id);
        setStudentInfo({
          name: session.student_name,
          email: session.student_email,
          canBorrow: session.can_borrow,
          alreadyIssued: session.books_already_issued,
          maxLimit: session.max_borrow_limit,
          pendingFines: session.pending_fines
        });
        setSessionExpiry(session.session_expires);
        setScanMode('book');
        setSessionActive(true);
        setScannedBooks([]);
        setSuccess(`✓ Student "${session.student_name}" session started`);

        // Focus on book scanner
        setTimeout(() => {
          if (qrInputRef.current) {
            qrInputRef.current.focus();
          }
        }, 100);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to scan student QR';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setManualQrInput('');
    }
  };

  /**
   * STEP 2: Scan Book & Real-Time Validation
   */
  const handleBookQrScan = async (qrCode) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/issue/scan-book`,
        {
          session_id: sessionId,
          book_qr_code: qrCode
        },
        { timeout: 3000 }
      );

      if (response.data.validation_status === 'accepted') {
        // Add to scanned books
        const newBook = {
          id: response.data.book.id,
          title: response.data.book.title,
          isbn: response.data.book.isbn,
          status: 'valid',
          scanned_time: new Date().toLocaleTimeString()
        };

        setScannedBooks([...scannedBooks, newBook]);
        setLastScanTime(Date.now());
        setSuccess(`✓ "${newBook.title}" added`);

        if (response.data.warning) {
          setError(`⚠️ Warning: ${response.data.warning}`);
        }
      } else if (response.data.validation_status === 'rejected') {
        setError(`❌ ${response.data.message}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to scan book';
      setError(errorMsg);
    }

    setManualQrInput('');
    if (qrInputRef.current) {
      qrInputRef.current.focus();
    }
  };

  /**
   * Handle QR input (manual entry or scanner)
   */
  const handleQrInput = (value) => {
    // NEW TWO-STEP FLOW: Admin scans book QR to complete pending requests
    if (showPendingRequests && pendingRequests.length > 0) {
      handleBookQRScanTwoStep(value);
    }
    // OLD FLOW: Student QR → Book QR
    else if (scanMode === 'student') {
      handleStudentQrScan(value);
    } else if (scanMode === 'book') {
      handleBookQrScan(value);
    }
  };

  /**
   * Remove scanned book from list
   */
  const removeScannedBook = (bookId) => {
    setScannedBooks(scannedBooks.filter(b => b.id !== bookId));
  };

  /**
   * STEP 6: Undo Issuance
   */
  const handleUndo = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/issue/undo`,
        { undo_id: undoId },
        { timeout: 5000 }
      );

      if (response.data.success) {
        setSuccess(`✓ ${response.data.restored_count} books restored successfully`);
        setTimeout(() => {
          resetSession();
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Undo failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI: Result Screen
  // ============================================================
  if (resultScreen) {
    return (
      <Box sx={{ p: 3 }}>
        <Card sx={{ boxShadow: 3 }}>
          <CardContent>
            {/* Success Header */}
            <Box sx={{ textAlign: 'center', mb: 3, pt: 2 }}>
              <CheckCircle sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                {issuedBooks.length} Books Issued Successfully
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                Issued to <strong>{issuedBooks[0]?.studentName || studentInfo?.name || 'Student'}</strong>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Issued Books Table */}
            <TableContainer component={Paper} sx={{ mb: 3, backgroundColor: '#f9f9f9' }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#667eea' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Book Title</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ISBN</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Due Date</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {issuedBooks.map((book, index) => (
                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Done sx={{ color: '#4CAF50' }} />
                          {book.title}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {book.isbn}
                      </TableCell>
                      <TableCell>
                        {new Date(book.due_date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="Issued" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Undo Button (if available) */}
            {undoId && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    ⏱️ Undo available for next 10 seconds
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Undo />}
                    onClick={handleUndo}
                    disabled={loading}
                    sx={{ backgroundColor: '#ff9800' }}
                  >
                    Undo Issuance
                  </Button>
                </Box>
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={resetSession}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4
                }}
              >
                New Session
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ============================================================
  // UI: Scanning Screen
  // ============================================================
  return (
    <Box sx={{ p: 3 }}>
      {/* Offline Status Bar */}
      {!isOnline && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          onClose={() => {}}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudOff sx={{ color: '#ff9800' }} />
              <Typography variant="body2">
                <strong>Working Offline</strong> - Transactions will be synced automatically when connection restored
              </Typography>
            </Box>
            {queueLength > 0 && (
              <Button
                size="small"
                onClick={() => setShowQueueManager(true)}
                endIcon={<MenuIcon />}
              >
                Queue: {queueLength}
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {/* Sync Status Bar */}
      {!isOnline && queueLength > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">
                {syncStatus === 'syncing'
                  ? `Syncing ${queueLength} transaction(s)...`
                  : `${queueLength} transaction(s) pending sync`}
              </Typography>
            </Box>
            {failedQueueLength > 0 && (
              <Button
                size="small"
                color="error"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const result = await offlineServiceRef.current.retryFailed(API_URL);
                    setSuccess(`✓ Retried ${result.retried} transactions, ${result.success} succeeded`);
                  } catch (err) {
                    setError('Retry failed: ' + err.message);
                  } finally {
                    setLoading(false);
                    const status = offlineServiceRef.current.getStatus();
                    setQueueLength(status.pending_count);
                    setFailedQueueLength(status.failed_count);
                  }
                }}
              >
                Retry {failedQueueLength} Failed
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {/* Online Status Indicator */}
      {isOnline && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudDone sx={{ color: '#4CAF50' }} />
            <Typography variant="body2">
              <strong>Online</strong> - All transactions will be synced immediately
            </Typography>
          </Box>
        </Alert>
      )}

      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          {/* Header with Offline Badge */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                📚 Admin Book Issuance
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {showPendingRequests && pendingRequests.length > 0
                  ? `${pendingRequests.length} pending issuance request(s) - Just scan any book QR to issue!`
                  : sessionActive
                  ? `Scanning books for ${studentInfo?.name}`
                  : 'Scan student QR to start session'}
              </Typography>
            </Box>
            {!isOnline && (
              <Tooltip title={`${queueLength} pending transaction(s)`}>
                <Chip
                  icon={<CloudOff />}
                  label={queueLength > 0 ? `${queueLength} offline` : 'Offline'}
                  color={queueLength > 0 ? 'warning' : 'default'}
                />
              </Tooltip>
            )}
          </Box>

          {/* PENDING ISSUANCE REQUESTS (NEW TWO-STEP FLOW) */}
          {showPendingRequests && pendingRequests.length > 0 && !requestRefreshing ? (
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e3f2fd', border: '2px solid #2196f3' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ color: '#2196f3' }} />
                  Pending Issuance Requests
                </Typography>
                <Chip
                  label={`${pendingRequests.length} waiting`}
                  color="primary"
                />
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontStyle: 'italic' }}>
                ℹ️ Students submitted issue/return/reissue requests from mobile. Scan a book QR to complete the selected request.
              </Typography>

              <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {pendingRequests.map((request) => (
                  <ListItem
                    key={request.id}
                    button
                    onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                    sx={{
                      backgroundColor: selectedRequest?.id === request.id ? '#c3e7ff' : '#f5f5f5',
                      mb: 1,
                      borderRadius: 1,
                      border: selectedRequest?.id === request.id ? '2px solid #2196f3' : '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                        borderColor: '#2196f3',
                      }
                    }}
                    secondaryAction={
                      <Badge badgeContent={request.status === 'pending' ? '●' : ''} color="success">
                        <Chip
                          label={request.status}
                          size="small"
                          color={request.status === 'pending' ? 'warning' : 'success'}
                          variant="outlined"
                        />
                      </Badge>
                    }
                  >
                    <ListItemIcon>
                      <Schedule sx={{ color: '#2196f3' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`📖 ${request.bookTitle}`}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block" sx={{ color: '#333' }}>
                            👤 Student: {request.studentName} (ID: {request.studentId})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Type: {(request.requestType || 'issue').toUpperCase()} | ISBN: {request.bookIsbn} | QR: {request.qrCode} | Time: {new Date(request.createdAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>👉 Action Required:</strong> Scan any book QR code below to match and issue it to the selected student!
              </Alert>
            </Paper>
          ) : showPendingRequests && pendingRequestsLoading && requestRefreshing ? (
            <PendingRequestsSkeleton count={3} />
          ) : null}

          {/* Session Info */}
          {sessionActive && studentInfo ? (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f0f4ff', border: '1px solid #667eea' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Student Name
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {studentInfo.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Available Slots
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {studentInfo.canBorrow} / {studentInfo.maxLimit}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Already Issued
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {studentInfo.alreadyIssued} books
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    Session Timeout
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule sx={{ fontSize: 18, color: sessionTimeLeft < 10 ? '#ff9800' : '#4CAF50' }} />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        color: sessionTimeLeft < 10 ? '#ff9800' : '#4CAF50'
                      }}
                    >
                      {sessionTimeLeft}s
                    </Typography>
                  </Box>
                </Grid>
                {studentInfo.pendingFines > 0 && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      ⚠️ Outstanding Fine: {currencyServiceRef.current.format(studentInfo.pendingFines)}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ) : sessionActive ? (
            <SessionInfoSkeleton />
          ) : null}

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert
              severity="success"
              onClose={() => setSuccess(null)}
              sx={{ mb: 2 }}
            >
              {success}
            </Alert>
          )}

          {/* QR Input Field */}
          <TextField
            ref={qrInputRef}
            fullWidth
            label={
              sessionActive
                ? 'Scan Book QR or ISBN'
                : 'Scan Student QR'
            }
            placeholder={
              sessionActive
                ? 'Point scanner to book QR code'
                : 'Point scanner to student QR code'
            }
            value={manualQrInput}
            onChange={(e) => setManualQrInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && manualQrInput.trim()) {
                handleQrInput(manualQrInput.trim());
              }
            }}
            disabled={loading}
            autoFocus
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <QrCode sx={{ mr: 1, color: '#667eea' }} />
              )
            }}
          />

          <Paper sx={{ p: 2, mb: 3, border: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Active Issues
              </Typography>
              <Button size="small" startIcon={<Refresh />} onClick={fetchActiveIssues} disabled={issuesLoading}>
                Refresh
              </Button>
            </Box>
            {issuesLoading ? <LinearProgress sx={{ mb: 1 }} /> : null}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Book</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeIssues.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No active issues</TableCell></TableRow>
                  ) : activeIssues.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.user_name || tx.user?.name || tx.users?.name || tx.user_id?.slice?.(0, 8) || '-'}</TableCell>
                      <TableCell>{tx.book_title || tx.book?.title || tx.books?.title || '-'}</TableCell>
                      <TableCell>{tx.issue_date || tx.issued_date ? new Date(tx.issue_date || tx.issued_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{tx.due_date ? new Date(tx.due_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Chip size="small" label={tx.status || 'active'} color="warning" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Scanned Books List */}
          {sessionActive && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                📖 Scanned Books ({scannedBooks.length}/{studentInfo?.canBorrow})
              </Typography>
              {loading && scannedBooks.length === 0 ? (
                <ListItemSkeleton rows={3} />
              ) : (
                <List>
                  {scannedBooks.map((book, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        backgroundColor: '#f9f9f9',
                        mb: 1,
                        borderRadius: 1,
                        border: '1px solid #e0e0e0'
                      }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => removeScannedBook(book.id)}
                          disabled={loading}
                        >
                          <Close />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#4CAF50' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={book.title}
                        secondary={`ISBN: ${book.isbn} | Scanned: ${book.scanned_time}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {!sessionActive ? (
              <Button
                variant="contained"
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  px: 4
                }}
                disabled={loading}
              >
                Ready to Scan Student
              </Button>
            ) : (
              <>
                {scannedBooks.length > 0 && (
                  <Button
                    variant="contained"
                    endIcon={<Done />}
                    onClick={() => handleFinalize(false)}
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                      px: 4
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Finalizing...
                      </>
                    ) : (
                      `Done (${scannedBooks.length} books)`
                    )}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={resetSession}
                  disabled={loading}
                  sx={{ px: 4 }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>

          {/* Session Timer Progress */}
          {sessionActive && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Session Time Remaining
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {sessionTimeLeft}s
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(sessionTimeLeft / 60) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    background: sessionTimeLeft < 10
                      ? 'linear-gradient(90deg, #ff9800, #ff5722)'
                      : 'linear-gradient(90deg, #4CAF50, #45a049)'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Queue Manager Dialog */}
      <Dialog
        open={showQueueManager}
        onClose={() => setShowQueueManager(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Offline Transaction Queue
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {offlineServiceRef.current && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Pending Transactions
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {queueLength}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Failed Transactions
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: failedQueueLength > 0 ? '#ff6b6b' : '#4CAF50' }}>
                      {failedQueueLength}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {offlineServiceRef.current.getStatus().queue_items.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Queue Items:
                  </Typography>
                  <List
                    sx={{
                      maxHeight: 300,
                      overflowY: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1
                    }}
                  >
                    {offlineServiceRef.current.getStatus().queue_items.map((item) => (
                      <ListItem key={item.id} sx={{ py: 1 }}>
                        <ListItemIcon>
                          {item.status === 'completed' || item.synced ? (
                            <CheckCircle sx={{ color: '#4CAF50' }} />
                          ) : item.status === 'failed' ? (
                            <Error sx={{ color: '#ff6b6b' }} />
                          ) : (
                            <Schedule sx={{ color: '#667eea' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Transaction ${item.id.slice(0, 12)}...`}
                          secondary={
                            <Box>
                              <Typography variant="caption">
                                Status: {item.status} | Retries: {item.retries || 0}/3
                              </Typography>
                              {item.error && (
                                <Typography variant="caption" sx={{ color: '#ff6b6b', display: 'block' }}>
                                  Error: {item.error}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Alert severity="info">
                  No queued transactions
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {failedQueueLength > 0 && (
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await offlineServiceRef.current.retryFailed(API_URL);
                  setSuccess(`✓ Retried ${result.retried} transactions, ${result.success} succeeded`);
                  const status = offlineServiceRef.current.getStatus();
                  setQueueLength(status.pending_count);
                  setFailedQueueLength(status.failed_count);
                } catch (err) {
                  setError('Retry failed: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              color="warning"
              startIcon={<Refresh />}
            >
              Retry Failed
            </Button>
          )}
          <Button onClick={() => setShowQueueManager(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminIssueBooks;
