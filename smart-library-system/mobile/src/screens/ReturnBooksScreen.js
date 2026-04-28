/**
 * Return Books Screen
 * Mobile interface for returning borrowed books with:
 * - Real-time book scanning
 * - Overdue detection & fine calculation
 * - Batch return processing
 * - Firebase push notifications
 * - Email confirmation
 * - Real-time success screen
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from 'react-native';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { API_BASE_URL } from '../config/api';

// Constants
const SESSION_TIMEOUT = 45000; // 45 seconds
const AUTO_FINALIZE_DELAY = 3000; // 3 seconds
const UNDO_WINDOW = 10000; // 10 seconds

export default function ReturnBooksScreen({ navigation }) {
  const { user } = useAuth();

  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const [studentQRInput, setStudentQRInput] = useState('');
  const [sessionStudent, setSessionStudent] = useState(null);

  // Scanning state
  const [bookISBNInput, setBookISBNInput] = useState('');
  const [scannedBooks, setScannedBooks] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [bookCondition, setBookCondition] = useState('good');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalFine, setTotalFine] = useState(0);

  // Results state
  const [lastReturnResult, setLastReturnResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [resultCountdown, setResultCountdown] = useState(0);

  // Notification state
  const [notificationStatus, setNotificationStatus] = useState('pending');

  // Network state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Timers
  const sessionTimerRef = useRef(null);
  const finalizeTimerRef = useRef(null);
  const resultTimerRef = useRef(null);

  // ============================================================
  // LIFECYCLE HOOKS
  // ============================================================

  useEffect(() => {
    loadOfflineQueue();
  }, []);

  // Session countdown effect
  useEffect(() => {
    if (!sessionActive) return;

    sessionTimerRef.current = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        const remaining = prev - 1000;
        if (remaining <= 0) {
          handleSessionExpire();
          return 0;
        }
        return remaining;
      });
    }, 1000);

    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [sessionActive]);

  // Auto-finalize timer
  useEffect(() => {
    if (!sessionActive || scannedBooks.length === 0) return;

    if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);

    finalizeTimerRef.current = setTimeout(() => {
      handleFinalize(true);
    }, AUTO_FINALIZE_DELAY);

    return () => {
      if (finalizeTimerRef.current) clearTimeout(finalizeTimerRef.current);
    };
  }, [scannedBooks, sessionActive]);

  // Undo countdown effect
  useEffect(() => {
    if (!undoAvailable || resultCountdown <= 0) return;

    resultTimerRef.current = setInterval(() => {
      setResultCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          setUndoAvailable(false);
          return 0;
        }
        return newCount;
      });
    }, 1000);

    return () => {
      if (resultTimerRef.current) clearInterval(resultTimerRef.current);
    };
  }, [undoAvailable, resultCountdown]);

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  const handleLoadStudent = useCallback(async () => {
    if (!studentQRInput.trim()) {
      Alert.alert('Error', 'Please enter or scan student QR code');
      return;
    }

    try {
      setIsProcessing(true);

      const { data: student, error } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${studentQRInput},email.eq.${studentQRInput}`)
        .single();

      if (error || !student) {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert('Student Not Found', 'Please check the QR code and try again');
        return;
      }

      const { data: activeIssues } = await supabase
        .from('transactions')
        .select('*,books(*)')
        .eq('user_id', student.id)
        .eq('status', 'issued')
        .is('return_date', null);

      if (!activeIssues || activeIssues.length === 0) {
        Alert.alert('No Active Issues', 'This student has no borrowed books');
        return;
      }

      setSessionStudent(student);
      setSessionActive(true);
      setSessionTimeRemaining(SESSION_TIMEOUT);
      setStudentQRInput('');
      setScannedBooks([]);
      Vibration.vibrate(50);
      setValidationErrors({});
    } catch (error) {
      console.error('Load student error:', error);
      Alert.alert('Error', error.message || 'Failed to load student');
    } finally {
      setIsProcessing(false);
    }
  }, [studentQRInput]);

  const handleSessionExpire = useCallback(() => {
    setSessionActive(false);
    setSessionStudent(null);
    setScannedBooks([]);
    setTotalFine(0);
    Alert.alert('Session Expired', 'Return session has ended.');
  }, []);

  // ============================================================
  // BOOK VALIDATION & SCANNING
  // ============================================================

  const validateBook = useCallback(
    async (isbn) => {
      if (!isbn || isbn.trim().length < 3) {
        return { valid: false, error: 'Invalid ISBN' };
      }

      if (scannedBooks.some((b) => b.isbn === isbn)) {
        return { valid: false, error: 'Already scanned for return' };
      }

      try {
        const { data: issue } = await supabase
          .from('transactions')
          .select('*,books(*)')
          .eq('user_id', sessionStudent.id)
          .eq('status', 'issued')
          .is('return_date', null)
          .filter('books.isbn', 'eq', isbn)
          .single();

        if (!issue) {
          return { valid: false, error: 'Book not found in active issues' };
        }

        const dueDate = new Date(issue.due_date);
        const today = new Date();
        let fine = 0;
        let daysOverdue = 0;

        if (today > dueDate) {
          daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          fine = daysOverdue * 10;
        }

        return {
          valid: true,
          book: {
            ...issue,
            daysOverdue,
            fine,
          },
        };
      } catch (error) {
        return { valid: false, error: 'Validation failed' };
      }
    },
    [sessionStudent, scannedBooks]
  );

  const handleBookScan = useCallback(
    async () => {
      if (!bookISBNInput.trim()) return;

      try {
        setIsProcessing(true);
        const validation = await validateBook(bookISBNInput);

        if (!validation.valid) {
          setValidationErrors({
            ...validationErrors,
            [bookISBNInput]: validation.error,
          });
          Vibration.vibrate([100, 50, 100]);
          Alert.alert('Invalid Book', validation.error);
          setBookISBNInput('');
          return;
        }

        const bookWithCondition = {
          ...validation.book,
          condition: bookCondition,
        };

        setScannedBooks([...scannedBooks, bookWithCondition]);
        setTotalFine(totalFine + (validation.book.fine || 0));
        setBookISBNInput('');
        Vibration.vibrate(50);
      } catch (error) {
        Alert.alert('Error', 'Failed to scan book');
      } finally {
        setIsProcessing(false);
      }
    },
    [bookISBNInput, bookCondition, scannedBooks, validationErrors, totalFine, validateBook]
  );

  const removeBook = useCallback((index) => {
    const book = scannedBooks[index];
    setScannedBooks(scannedBooks.filter((_, i) => i !== index));
    setTotalFine(Math.max(0, totalFine - (book.fine || 0)));
  }, [scannedBooks, totalFine]);

  // ============================================================
  // RETURN PROCESSING
  // ============================================================

  const executeReturn = useCallback(async (booksList) => {
    if (!booksList || booksList.length === 0) {
      throw new Error('No books to return');
    }

    const response = await fetch(
      `${API_BASE_URL}/return/finalize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          books: booksList.map((b) => ({
            transaction_id: b.id,
            condition: b.condition,
          })),
          student_id: sessionStudent.id,
        }),
      }
    );

    if (!response.ok) throw new Error('Return submission failed');
    return response.json();
  }, [sessionStudent]);

  const storeOfflineReturn = useCallback(
    async (returnData) => {
      const existing = await AsyncStorage.getItem('offlineReturns');
      const queue = existing ? JSON.parse(existing) : [];

      queue.push({
        id: `return_${Date.now()}`,
        ...returnData,
        status: 'pending_sync',
      });

      await AsyncStorage.setItem('offlineReturns', JSON.stringify(queue));
      setOfflineQueue(queue);
    },
    []
  );

  const loadOfflineQueue = useCallback(async () => {
    const queue = await AsyncStorage.getItem('offlineReturns');
    if (queue) setOfflineQueue(JSON.parse(queue));
  }, []);

  const sendNotifications = useCallback(
    async (returnData) => {
      try {
        setNotificationStatus('pending');

        // Firebase notification
        try {
          await fetch(`${API_BASE_URL}/fcm/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              user_id: sessionStudent.id,
              title: '📚 Books Returned Successfully',
              body: `${returnData.booksCount} book(s) returned`,
              data: {
                type: 'book_returned',
                booksCount: returnData.booksCount,
                totalFine: returnData.totalFine,
              },
            }),
          });
        } catch (fcmError) {
          console.error('Firebase error:', fcmError);
        }

        // Email notification
        try {
          await fetch(`${API_BASE_URL}/notifications/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
              user_id: sessionStudent.id,
              email: sessionStudent.email,
              type: 'book_returned',
              data: {
                booksCount: returnData.booksCount,
                totalFine: returnData.totalFine,
                books: returnData.books,
              },
            }),
          });
        } catch (emailError) {
          console.error('Email error:', emailError);
        }

        setNotificationStatus('sent');
      } catch (error) {
        setNotificationStatus('failed');
      }
    },
    [sessionStudent]
  );

  const handleFinalize = useCallback(
    async (autoFinalize = false) => {
      if (scannedBooks.length === 0) {
        Alert.alert('No Books', 'Scan at least one book');
        return;
      }

      try {
        setIsProcessing(true);
        Vibration.vibrate([100, 100, 100]);

        const returnData = {
          booksCount: scannedBooks.length,
          totalFine,
          books: scannedBooks,
          returnedAt: new Date().toISOString(),
        };

        try {
          const result = await executeReturn(scannedBooks);

          setLastReturnResult({
            ...returnData,
            undoId: result.undo_id,
            success: true,
          });

          await sendNotifications(returnData);

          setUndoAvailable(true);
          setResultCountdown(10);
          setShowResults(true);

          setTimeout(() => {
            if (showResults) handleSessionExpire();
          }, 5000);
        } catch (error) {
          if (!isOnline) {
            await storeOfflineReturn({
              ...returnData,
              student_id: sessionStudent.id,
            });

            setLastReturnResult({
              ...returnData,
              success: false,
              offline: true,
            });

            setShowResults(true);
            setNotificationStatus('sent');

            Alert.alert('Offline', 'Stored locally. Will sync when online.');
          } else {
            throw error;
          }
        }
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to process');
        Vibration.vibrate([100, 50, 100]);
      } finally {
        setIsProcessing(false);
      }
    },
    [scannedBooks, totalFine, sessionStudent, isOnline, executeReturn, sendNotifications, storeOfflineReturn, showResults]
  );

  const handleUndo = useCallback(async () => {
    if (!lastReturnResult?.undoId || resultCountdown <= 0) {
      Alert.alert('Undo Expired', 'Window has expired');
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(
        `${API_BASE_URL}/return/undo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await AsyncStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            undo_id: lastReturnResult.undoId,
          }),
        }
      );

      if (!response.ok) throw new Error('Undo failed');

      Alert.alert('Undo Successful', 'Books restored to issued status');

      setShowResults(false);
      setUndoAvailable(false);
      handleSessionExpire();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to undo');
    } finally {
      setIsProcessing(false);
    }
  }, [lastReturnResult, resultCountdown]);

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderBookItem = ({ item, index }) => {
    const isOverdue = item.daysOverdue && item.daysOverdue > 0;

    return (
      <View style={styles.bookItem}>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.books?.title}</Text>
          <Text style={styles.bookAuthor}>{item.books?.author}</Text>

          {isOverdue && (
            <View style={styles.overdueTag}>
              <MaterialCommunityIcons name="alert" size={12} color="#FF3B30" />
              <Text style={styles.overdueText}>{item.daysOverdue}d overdue</Text>
            </View>
          )}

          <View style={styles.bookMeta}>
            <Text style={styles.isbn}>ISBN: {item.isbn}</Text>
            {item.fine > 0 && (
              <Text style={styles.fineText}>₹{item.fine}</Text>
            )}
          </View>

          <View style={styles.conditionSelector}>
            <Text style={styles.conditionLabel}>Condition:</Text>
            {['good', 'fair', 'damaged'].map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.conditionOption,
                  item.condition === cond && styles.conditionSelected,
                ]}
                onPress={() => {
                  const updated = [...scannedBooks];
                  updated[index].condition = cond;
                  setScannedBooks(updated);
                }}
              >
                <Text style={[
                  styles.conditionText,
                  item.condition === cond && styles.conditionTextSelected,
                ]}>
                  {cond[0].toUpperCase() + cond.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeBook(index)}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  // Pre-Session UI
  if (!sessionActive) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="book-return" size={40} color="#007AFF" />
            <Text style={styles.title}>Return Books</Text>
            <Text style={styles.subtitle}>Scan student QR to start</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 1: Load Student</Text>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Scan student QR"
                value={studentQRInput}
                onChangeText={setStudentQRInput}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleLoadStudent}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Load Student</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {offlineQueue.length > 0 && (
            <View style={[styles.section, styles.offlineBanner]}>
              <MaterialCommunityIcons name="wifi-off" size={20} color="#FF9500" />
              <View style={styles.offlineText}>
                <Text style={styles.offlineTitle}>Returns Queued</Text>
                <Text style={styles.offlineCaption}>{offlineQueue.length} return(s) pending</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Results Screen
  if (showResults && lastReturnResult) {
    return (
      <Modal visible={showResults} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={[styles.resultHeader, lastReturnResult.success ? styles.successHeader : styles.offlineHeader]}>
              <MaterialCommunityIcons
                name={lastReturnResult.success ? 'check-circle' : 'cloud-sync'}
                size={60}
                color={lastReturnResult.success ? '#34C759' : '#FF9500'}
              />
              <Text style={styles.resultTitle}>
                {lastReturnResult.success ? 'Return Successful!' : 'Offline Mode'}
              </Text>
            </View>

            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Books Returned:</Text>
                <Text style={styles.receiptValue}>{lastReturnResult.booksCount}</Text>
              </View>

              {lastReturnResult.totalFine > 0 && (
                <>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Total Fine:</Text>
                    <Text style={[styles.receiptValue, styles.fineAmount]}>₹{lastReturnResult.totalFine}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.notificationStatus}>
              <MaterialCommunityIcons
                name={notificationStatus === 'sent' ? 'check-circle' : 'clock-outline'}
                size={20}
                color={notificationStatus === 'sent' ? '#34C759' : '#FF9500'}
              />
              <Text style={styles.notificationText}>
                {notificationStatus === 'sent' ? '✓ Firebase & Email sent' : '⏱ Sending...'}
              </Text>
            </View>

            <View style={styles.booksList}>
              <Text style={styles.booksListTitle}>Returned Books:</Text>
              {lastReturnResult.books.map((book, idx) => (
                <View key={idx} style={styles.returnedBookItem}>
                  <View>
                    <Text style={styles.returnedBookTitle}>{book.books?.title}</Text>
                    <Text style={styles.returnedBookCondition}>Condition: {book.condition}</Text>
                  </View>
                  <MaterialCommunityIcons name="check" size={20} color="#34C759" />
                </View>
              ))}
            </View>

            <View style={styles.actionsContainer}>
              {lastReturnResult.success && undoAvailable && (
                <TouchableOpacity
                  style={[styles.button, styles.undoButton]}
                  onPress={handleUndo}
                  disabled={resultCountdown <= 0}
                >
                  <MaterialCommunityIcons name="undo" size={20} color="#007AFF" />
                  <Text style={styles.undoButtonText}>Undo ({resultCountdown}s)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => {
                  setShowResults(false);
                  handleSessionExpire();
                }}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Session Active
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.sessionBanner}>
          <View style={styles.sessionInfo}>
            <MaterialCommunityIcons name="account" size={24} color="#007AFF" />
            <View style={styles.sessionDetails}>
              <Text style={styles.sessionName}>{sessionStudent?.name || sessionStudent?.email}</Text>
              <Text style={styles.sessionCountdown}>{Math.floor(sessionTimeRemaining / 1000)}s</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSessionExpire}>
            <MaterialCommunityIcons name="close" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Scan Books</Text>

          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="barcode" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Scan book ISBN"
              value={bookISBNInput}
              onChangeText={setBookISBNInput}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.conditionSelector}>
            <Text style={styles.conditionLabel}>Condition:</Text>
            {['good', 'fair', 'damaged'].map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[styles.conditionOption, bookCondition === cond && styles.conditionSelected]}
                onPress={() => setBookCondition(cond)}
              >
                <Text style={[styles.conditionText, bookCondition === cond && styles.conditionTextSelected]}>
                  {cond[0].toUpperCase() + cond.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleBookScan}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Add Book</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {scannedBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Books ({scannedBooks.length})</Text>
            <FlatList
              data={scannedBooks}
              renderItem={renderBookItem}
              keyExtractor={(_, index) => index.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {scannedBooks.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No books scanned</Text>
          </View>
        )}

        {totalFine > 0 && (
          <View style={[styles.section, styles.fineSummary]}>
            <Text style={styles.fineSummaryLabel}>Total Fine:</Text>
            <Text style={styles.fineSummaryAmount}>₹{totalFine}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSessionExpire}
          >
            <MaterialCommunityIcons name="close" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, scannedBooks.length === 0 && styles.buttonDisabled]}
            onPress={() => handleFinalize(false)}
            disabled={scannedBooks.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                <Text style={styles.buttonText}>Done Returning</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { paddingHorizontal: 16, paddingVertical: 12 },
  header: { alignItems: 'center', marginVertical: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  sessionBanner: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sessionDetails: { marginLeft: 12 },
  sessionName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sessionCountdown: { fontSize: 12, color: '#fff', opacity: 0.9, marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth:1, borderColor: '#E5E5E5' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5E5' },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, fontSize: 14, color: '#1a1a1a' },
  conditionSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  conditionLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginRight: 8 },
  conditionOption: { paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E5E5E5' },
  conditionSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  conditionText: { fontSize: 12, fontWeight: '500', color: '#666' },
  conditionTextSelected: { color: '#fff' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginBottom: 12 },
  primaryButton: { backgroundColor: '#007AFF' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF', flex: 1, marginRight: 8 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  secondaryButtonText: { color: '#007AFF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  buttonDisabled: { opacity: 0.5 },
  bookItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  bookAuthor: { fontSize: 12, color: '#666', marginTop: 2 },
  bookMeta: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  isbn: { fontSize: 11, color: '#999' },
  fineText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  overdueTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FFE5E5', borderRadius: 4, alignSelf: 'flex-start' },
  overdueText: { fontSize: 11, color: '#FF3B30', marginLeft: 4, fontWeight: '500' },
  deleteButton: { marginLeft: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: '#999', marginTop: 8 },
  fineSummary: { backgroundColor: '#FFF3E0', borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  fineSummaryLabel: { fontSize: 13, color: '#666' },
  fineSummaryAmount: { fontSize: 20, fontWeight: '700', color: '#FF9500', marginTop: 4 },
  resultHeader: { alignItems: 'center', paddingVertical: 40, marginBottom: 20 },
  successHeader: { backgroundColor: '#E7F5E7' },
  offlineHeader: { backgroundColor: '#FFF3E0' },
  resultTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  receiptCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  receiptLabel: { fontSize: 13, color: '#666' },
  receiptValue: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  receiptDivider: { height: 1, backgroundColor: '#E5E5E5', marginVertical: 8 },
  fineAmount: { color: '#FF9500', fontSize: 16 },
  notificationStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E7F5E7', borderRadius: 8, padding: 12, marginBottom: 16 },
  notificationText: { fontSize: 13, color: '#34C759', marginLeft: 8 },
  booksList: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  booksListTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  returnedBookItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  returnedBookTitle: { fontSize: 13, fontWeight: '500', color: '#1a1a1a' },
  returnedBookCondition: { fontSize: 11, color: '#666', marginTop: 2 },
  offlineBanner: { backgroundColor: '#FFF3E0', flexDirection: 'row', alignItems: 'center' },
  offlineText: { marginLeft: 12, flex: 1 },
  offlineTitle: { fontSize: 13, fontWeight: '600', color: '#FF9500' },
  offlineCaption: { fontSize: 11, color: '#FF9500', marginTop: 2, opacity: 0.8 },
  actionsContainer: { flexDirection: 'row', marginBottom: 20 },
  undoButton: { flex: 1, marginRight: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF' },
  undoButtonText: { color: '#007AFF', fontSize: 14, fontWeight: '600', marginLeft: 8 },
});
