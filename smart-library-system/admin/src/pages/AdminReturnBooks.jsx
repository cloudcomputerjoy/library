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
  MoreVert,
  AttachMoney,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';
import { getOfflineAdminReturnService } from '../services/OfflineAdminReturnService';
import { getCurrencyService } from '../services/CurrencyService';
import {
  SessionInfoSkeleton,
  ListItemSkeleton,
} from '../components/SkeletonLoader';


/**
 * Admin Return Books Component
 * Admin controls the entire book return process
 * 
 * Flow:
 * 1. Admin scans student QR → Initialize session
 * 2. Admin scans books → Real-time validation & fine calculation
 * 3. Auto-finalize or manual finish
 * 4. Show results with fine details and undo option
 */

const AdminReturnBooks = () => {
  const qrInputRef = useRef(null);
  const offlineServiceRef = useRef(null);
  const currencyServiceRef = useRef(getCurrencyService());

  // Session and UI State
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [scannedBooks, setScannedBooks] = useState([]);
  const [lastScanTime, setLastScanTime] = useState(Date.now());

  // Offline Support State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [queueLength, setQueueLength] = useState(0);
  const [failedQueueLength, setFailedQueueLength] = useState(0);
  const [showQueueManager, setShowQueueManager] = useState(false);

  // Return page transaction tables
  const [completedReturns, setCompletedReturns] = useState([]);
  const [overdueIssues, setOverdueIssues] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // UI State
  const [scanMode, setScanMode] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resultScreen, setResultScreen] = useState(false);
  const [returnedBooks, setReturnedBooks] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const [undoId, setUndoId] = useState(null);
  const [manualQrInput, setManualQrInput] = useState('');

  // Session tracking
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60);
  const [inactivityTimer, setInactivityTimer] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * Reset session
   */
  const resetSession = () => {
    setSessionActive(false);
    setSessionId(null);
    setStudentInfo(null);
    setScannedBooks([]);
    setReturnedBooks([]);
    setUndoId(null);
    setResultScreen(false);
    setScanMode('student');
    setSessionTimeLeft(60);
    setError(null);
    setSuccess(null);
    setTotalFine(0);

    setTimeout(() => {
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    }, 100);
  };

  /**
   * Session timeout handler
   */
  const handleSessionTimeout = useCallback(() => {
    setError('⏰ Session expired after 60 seconds of inactivity');
    resetSession();
  }, []);

  /**
   * STEP 3-4: Finalize & Bulk Return
   */
  const handleFinalize = useCallback(async (autoFinalize = false) => {
    try {
      if (scannedBooks.length === 0) {
        setError('Please scan at least one book');
        return;
      }

      setLoading(true);

      const calcTotalFine = scannedBooks.reduce((sum, b) => sum + (b.fine_amount || 0), 0);

      const finalize = async () => {
        const response = await axios.post(
          `${API_URL}/api/return/finalize`,
          {
            session_id: sessionId,
            force_finalize: autoFinalize
          },
          { timeout: 5000 }
        );

        if (response.data.success) {
          setReturnedBooks(response.data.result.books_returned);
          setTotalFine(response.data.result.total_fine);
          setUndoId(response.data.result.undo_id);
          setResultScreen(true);
          setSessionActive(false);

          setTimeout(() => {
            setUndoId(null);
          }, 10000);
        }
      };

      if (isOnline) {
        await finalize();
      } else {
        const transactionData = {
          session_id: sessionId,
          force_finalize: autoFinalize
        };

        const queueId = await offlineServiceRef.current.queueReturnTransaction(
          transactionData
        );

        setReturnedBooks(scannedBooks.map(book => ({
          ...book,
          status: 'pending_sync'
        })));

        setTotalFine(calcTotalFine);
        setResultScreen(true);
        setSessionActive(false);
        setSuccess(`✓ Return queued for sync (Offline mode)\nQueue ID: ${queueId}`);

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

  // Focus QR input
  useEffect(() => {
    if (qrInputRef.current && sessionActive && scanMode === 'book') {
      qrInputRef.current.focus();
    }
  }, [sessionActive, scanMode]);

  // Initialize offline service and currency
  useEffect(() => {
    offlineServiceRef.current = getOfflineAdminReturnService();
    currencyServiceRef.current.initialize();

    const handleSyncEvent = (event) => {
      if (event.status === 'online') {
        setIsOnline(true);
        setSuccess('✓ Connection restored');
      } else if (event.status === 'offline') {
        setIsOnline(false);
        setError('⚠️ Working offline - returns will sync when connected');
      } else if (event.status === 'syncing') {
        setSyncStatus('syncing');
      } else if (event.status === 'sync_complete') {
        setSyncStatus('synced');
        setSuccess(`✓ Synced: ${event.synced_count} returns`);
      }

      const status = offlineServiceRef.current.getStatus();
      setQueueLength(status.pending_count);
      setFailedQueueLength(status.failed_count);
    };

    offlineServiceRef.current.addSyncListener(handleSyncEvent);

    const initialStatus = offlineServiceRef.current.getStatus();
    setIsOnline(initialStatus.isOnline);
    setQueueLength(initialStatus.pending_count);
    setFailedQueueLength(initialStatus.failed_count);

    return () => {
      offlineServiceRef.current.removeSyncListener(handleSyncEvent);
    };
  }, []);

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

  // Session timeout countdown
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
   * STEP 1: Scan Student QR & Initialize Return Session
   */
  const handleStudentQrScan = async (qrCode) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_URL}/api/return/start-session`,
        {
          qr_code: qrCode,
          librarian_id: 'admin-001'
        },
        { timeout: 5000 }
      );

      if (response.data.success) {
        const session = response.data.session;
        setSessionId(session.session_id);
        setStudentInfo({
          name: session.student_name,
          email: session.student_email,
          issuedBooksCount: session.issued_books_count,
          issuedBooks: session.issued_books
        });
        setSessionExpiry(session.session_expires);
        setScanMode('book');
        setSessionActive(true);
        setScannedBooks([]);
        setSuccess(`✓ Student "${session.student_name}" - ${session.issued_books_count} books to return`);

        setTimeout(() => {
          if (qrInputRef.current) {
            qrInputRef.current.focus();
          }
        }, 100);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to scan student QR';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setManualQrInput('');
    }
  };

  /**
   * STEP 2: Scan Book for Return & Real-Time Validation
   */
  const handleBookQrScan = async (qrCode) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/return/scan-book`,
        {
          session_id: sessionId,
          book_qr_code: qrCode
        },
        { timeout: 3000 }
      );

      if (response.data.validation_status === 'accepted') {
        const newBook = {
          id: response.data.book.id,
          book_id: response.data.book.book_id,
          title: response.data.book.title,
          isbn: response.data.book.isbn,
          issue_date: response.data.book.issue_date,
          due_date: response.data.book.due_date,
          is_overdue: response.data.book.is_overdue,
          days_overdue: response.data.book.days_overdue,
          fine_amount: response.data.book.fine_amount,
          scanned_time: new Date().toLocaleTimeString()
        };

        setScannedBooks([...scannedBooks, newBook]);
        setLastScanTime(Date.now());

        if (newBook.fine_amount > 0) {
          setSuccess(`✓ "${newBook.title}" added (Overdue: ${currencyServiceRef.current.format(newBook.fine_amount)})`);
        } else {
          setSuccess(`✓ "${newBook.title}" added`);
        }

        if (response.data.warning) {
          setError(`⚠️ ${response.data.warning}`);
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
   * Handle QR input
   */
  const handleQrInput = (value) => {
    if (scanMode === 'student') {
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
   * STEP 6: Undo Return
   */
  const handleUndo = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/return/undo`,
        { undo_id: undoId },
        { timeout: 5000 }
      );

      if (response.data.success) {
        setSuccess(`✓ ${response.data.restored_count} books restored to issued status`);
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

  const fetchReturnPageTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/transactions`, { timeout: 7000 });
      const payload = response.data || {};
      const rows = payload.data || payload.transactions || [];
      const list = Array.isArray(rows) ? rows : [];
      const now = new Date();

      const completed = list.filter((tx) => {
        const status = String(tx.status || '').toLowerCase();
        return ['returned', 'completed', 'return'].includes(status) || !!(tx.return_date || tx.returnDate || tx.returned_date);
      });

      const overdue = list.filter((tx) => {
        const status = String(tx.status || '').toLowerCase();
        const isActive = ['active', 'issued', 'pending'].includes(status) && !(tx.return_date || tx.returnDate || tx.returned_date);
        const dueRaw = tx.due_date || tx.dueDate;
        const due = dueRaw ? new Date(dueRaw) : null;
        return isActive && due && due < now;
      });

      setCompletedReturns(completed.slice(0, 20));
      setOverdueIssues(overdue.slice(0, 20));
    } catch (err) {
      setCompletedReturns([]);
      setOverdueIssues([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchReturnPageTransactions();
    const t = setInterval(fetchReturnPageTransactions, 30000);
    return () => clearInterval(t);
  }, [fetchReturnPageTransactions]);

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
                {returnedBooks.length} Books Returned Successfully
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                Returned by <strong>{studentInfo?.name}</strong>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Fine Information */}
            {totalFine > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ color: '#ff9800' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Total Fine Due: {currencyServiceRef.current.format(totalFine)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Overdue charges to be collected from student
                    </Typography>
                  </Box>
                </Box>
              </Alert>
            )}

            {/* Returned Books Table */}
            <TableContainer component={Paper} sx={{ mb: 3, backgroundColor: '#f9f9f9' }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#667eea' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Book Title</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ISBN</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">
                      Overdue
                    </TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 'bold' }} align="center">
                      Fine
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnedBooks.map((book, index) => (
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
                      <TableCell align="center">
                        {book.is_overdue ? (
                          <Chip
                            icon={<TrendingUp />}
                            label={`${book.days_overdue}d`}
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Chip label="On time" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {book.fine_amount > 0 ? (
                          <Typography sx={{ fontWeight: 'bold', color: '#ff6b6b' }}>
                            {currencyServiceRef.current.format(book.fine_amount)}
                          </Typography>
                        ) : (
                          <Typography sx={{ color: '#4CAF50' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Undo Button */}
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
                    Undo Returns
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
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudOff sx={{ color: '#ff9800' }} />
              <Typography variant="body2">
                <strong>Working Offline</strong> - Returns will be synced when connected
              </Typography>
            </Box>
            {queueLength > 0 && (
              <Button
                size="small"
                onClick={() => setShowQueueManager(true)}
                endIcon={<MoreVert />}
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
                {syncStatus === 'syncing' ? `Syncing ${queueLength} return(s)...` : `${queueLength} return(s) pending sync`}
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
                    setSuccess(`✓ Retried ${result.retried} returns, ${result.success} succeeded`);
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

      {/* Online Status */}
      {isOnline && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudDone sx={{ color: '#4CAF50' }} />
            <Typography variant="body2">
              <strong>Online</strong> - All returns will be processed immediately
            </Typography>
          </Box>
        </Alert>
      )}

      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                📚 Admin Book Returns
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {sessionActive
                  ? `Processing returns for ${studentInfo?.name}`
                  : 'Scan student QR to start return session'}
              </Typography>
            </Box>
            {!isOnline && (
              <Tooltip title={`${queueLength} pending return(s)`}>
                <Chip
                  icon={<CloudOff />}
                  label={queueLength > 0 ? `${queueLength} offline` : 'Offline'}
                  color={queueLength > 0 ? 'warning' : 'default'}
                />
              </Tooltip>
            )}
          </Box>

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
                    Books to Return
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {studentInfo.issuedBooksCount}
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
              </Grid>
            </Paper>
          ) : sessionActive ? (
            <SessionInfoSkeleton />
          ) : null}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* QR Input Field */}
          <TextField
            ref={qrInputRef}
            fullWidth
            label={sessionActive ? 'Scan Book QR to Return' : 'Scan Student QR'}
            placeholder={sessionActive ? 'Point scanner to book QR' : 'Point scanner to student QR'}
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
              startAdornment: <QrCode sx={{ mr: 1, color: '#667eea' }} />
            }}
          />

          <Paper sx={{ p: 2, mb: 3, border: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Overdue And Completed
              </Typography>
              <Button size="small" startIcon={<Refresh />} onClick={fetchReturnPageTransactions} disabled={transactionsLoading}>
                Refresh
              </Button>
            </Box>
            {transactionsLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Overdue Issues</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Book</TableCell>
                        <TableCell>Due</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueIssues.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center">No overdue issues</TableCell></TableRow>
                      ) : overdueIssues.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.user_name || tx.user?.name || tx.users?.name || '-'}</TableCell>
                          <TableCell>{tx.book_title || tx.book?.title || tx.books?.title || '-'}</TableCell>
                          <TableCell>{tx.due_date || tx.dueDate ? new Date(tx.due_date || tx.dueDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Completed Returns</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Book</TableCell>
                        <TableCell>Returned</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {completedReturns.length === 0 ? (
                        <TableRow><TableCell colSpan={3} align="center">No completed returns</TableCell></TableRow>
                      ) : completedReturns.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.user_name || tx.user?.name || tx.users?.name || '-'}</TableCell>
                          <TableCell>{tx.book_title || tx.book?.title || tx.books?.title || '-'}</TableCell>
                          <TableCell>{tx.return_date || tx.returnDate || tx.returned_date ? new Date(tx.return_date || tx.returnDate || tx.returned_date).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Paper>

          {/* Scanned Books List */}
          {sessionActive && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                📖 Books to Return ({scannedBooks.length})
              </Typography>
              {loading && scannedBooks.length === 0 ? (
                <ListItemSkeleton rows={3} />
              ) : (
                <List>
                  {scannedBooks.map((book, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        backgroundColor: book.fine_amount > 0 ? '#fff3e0' : '#f9f9f9',
                        mb: 1,
                        borderRadius: 1,
                        border: book.fine_amount > 0 ? '1px solid #ffb74d' : '1px solid #e0e0e0'
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
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {book.title}
                            {book.fine_amount > 0 && (
                              <Chip
                                icon={<AttachMoney />}
                                label={currencyServiceRef.current.format(book.fine_amount)}
                                color="warning"
                                size="small"
                              />
           )}
                          </Box>
                        }
                        secondary={`ISBN: ${book.isbn} | Due: ${new Date(book.due_date).toLocaleDateString()} | Scanned: ${book.scanned_time}`}
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
                        Processing...
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

          {/* Session Timer */}
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
        <DialogTitle>Return Queue Manager</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {offlineServiceRef.current && (
            <Box>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Pending Returns
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {queueLength}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Failed Returns
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: failedQueueLength > 0 ? '#ff6b6b' : '#4CAF50' }}>
                      {failedQueueLength}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {offlineServiceRef.current.getStatus().queue_items.length > 0 ? (
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
                        primary={`Return ${item.id.slice(0, 12)}...`}
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
              ) : (
                <Alert severity="info">No queued returns</Alert>
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
                  setSuccess(`✓ Retried ${result.retried} returns, ${result.success} succeeded`);
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
          <Button onClick={() => setShowQueueManager(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReturnBooks;
