/**
 * Issue Books Screen
 * Librarian interface for issuing books to students
 * Integrates with issuesService for backend
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { issuesService, booksService } from '../services';
import { API_BASE_URL } from '../config/api';

const IssueBooksScreen = ({ route, navigation }) => {
  const [bookId, setBookId] = useState('');
  const [copyId, setCopyId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dueDays, setDueDays] = useState('14');
  const [loading, setLoading] = useState(false);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [bookDetails, setBookDetails] = useState(null);

  // Validate book availability
  const handleSearchBook = async () => {
    if (!bookId.trim()) {
      Alert.alert('Error', 'Please enter book ID');
      return;
    }

    try {
      setLoading(true);
      const book = await booksService.getBookDetail(bookId);
      const available = await booksService.checkBookAvailability(bookId);
      
      if (available.available > 0) {
        setBookDetails(book);
        Alert.alert('Success', `Found: ${book.title}\nAvailable copies: ${available.available}`);
      } else {
        Alert.alert('Not Available', 'No copies available for this book');
        setBookDetails(null);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to search book');
      setBookDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Issue book to student
  const handleIssueBook = async () => {
    if (!bookId.trim()) {
      Alert.alert('Error', 'Please select a book');
      return;
    }
    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter student ID');
      return;
    }

    try {
      setLoading(true);
      const result = await issuesService.issueBook(bookId, copyId || '1');
      
      setIssuedBooks([...issuedBooks, { ...result, studentId }]);
      
      // Reset form
      setBookId('');
      setCopyId('');
      setStudentId('');
      setBookDetails(null);
      
      Alert.alert(
        'Success', 
        `Book issued successfully!\nDue date: ${result.dueDate}`
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkIssue = async () => {
    if (issuedBooks.length === 0) {
      Alert.alert('No Books', 'Please add books to issue');
      return;
    }

    try {
      setLoading(true);
      const bookIds = issuedBooks.map(b => b.id || b.bookId);
      const result = await issuesService.issueBulkBooks(bookIds);
      
      Alert.alert(
        'Success',
        `${result.successful || result.length} books issued successfully!`
      );
      
      setIssuedBooks([]);
      setBookId('');
      setCopyId('');
      setStudentId('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to issue books');
    } finally {
      setLoading(false);
    }
  };

  const handleScanStudent = useCallback(async (userId) => {
    if (!userId || !userId.trim()) {
      Alert.alert('Error', 'Please enter a student ID');
      return;
    }

    try {
      setIsProcessing(true);
      const { activeCount } = await issuesService.getStudentBorrowInfo(parseInt(userId));
      
      // Load student details from route params if provided
      let studentData = route?.params?.student;
      
      if (!studentData) {
        // In real app, fetch from API
        studentData = {
          id: parseInt(userId),
          name: `Student ${userId}`,
          email: `student${userId}@library.edu`,
          borrowCount: activeCount,
        };
      }

      // Start session
      setSessionUser(studentData);
      setSessionActive(true);
      setScannedBooks([]);
      setValidationErrors({});
      sessionTimerRef.current = Date.now();
      lastScanTimeRef.current = Date.now();

      // Vibrate for feedback
      Vibration.vibrate(100);

      Alert.alert('✓ Session Started', `Student: ${studentData.name}\nSession locked for ${SESSION_TIMEOUT / 1000}s`);
    } catch (error) {
      console.error('Error scanning student:', error);
      Alert.alert('Error', error.message || 'Failed to load student');
    } finally {
      setIsProcessing(false);
    }
  }, [studentQRInput, route]);

  /**
   * End current session
   */
  const handleSessionExpire = useCallback(() => {
    setSessionActive(false);
    setSessionUser(null);
    setScannedBooks([]);
    setStudentQRInput('');
    setBookISBNInput('');
    Alert.alert('Session Expired', 'Student session has expired. Scan new QR to continue.');
  }, []);

  // ============================================================
  // BOOK SCANNING & VALIDATION
  // ============================================================

  /**
   * Real-time validation for each book scan
   */
  const validateBook = useCallback(
    async (isbn) => {
      const errors = [];

      // Check 1: Book not empty
      if (!isbn || isbn.trim().length < 3) {
        return { valid: false, error: 'Invalid ISBN' };
      }

      // Check 2: Duplicate scan in current session
      if (scannedBooks.some((b) => b.isbn === isbn)) {
        return { valid: false, error: 'Already scanned in this session' };
      }

      // Check 3: Verify book exists and get availability
      try {
        const response = await booksAPI.searchBooks(isbn, 1, 1);
        const books = response?.data || [];
        
        if (books.length === 0) {
          return { valid: false, error: 'Book not found' };
        }

        const book = books[0];

        // Check 4: Book is available
        if (!book.available || book.available_copies <= 0) {
          return { valid: false, error: 'Not available' };
        }

        // Check 5: Not already issued to this student
        const activeIssues = await transactionsAPI.getActiveIssues();
        if (activeIssues?.data?.some((t) => t.book_id === book.id)) {
          return { valid: false, error: 'Already issued to student' };
        }

        // Check 6: Student not exceeding borrow limit
        const activeCount = activeIssues?.data?.length || 0;
        if (activeCount + scannedBooks.length >= 5) {
          return { valid: false, error: 'Borrow limit reached' };
        }

        return { valid: true, book };
      } catch (error) {
        return { valid: false, error: 'Validation failed' };
      }
    },
    [scannedBooks]
  );

  /**
   * Handle book scan
   */
  const handleBookScan = useCallback(async () => {
    if (!sessionActive) {
      Alert.alert('No Session', 'Scan student QR first');
      return;
    }

    if (!bookISBNInput.trim()) {
      Alert.alert('Error', 'Enter ISBN or book code');
      return;
    }

    try {
      setIsProcessing(true);
      lastScanTimeRef.current = Date.now(); // Reset auto-finalize timer

      const validation = await validateBook(bookISBNInput);

      if (!validation.valid) {
        // Invalid scan - vibrate error pattern
        Vibration.vibrate([100, 50, 100]);
        
        setValidationErrors((prev) => ({
          ...prev,
          [bookISBNInput]: validation.error,
        }));

        setTimeout(() => {
          setValidationErrors((prev) => {
            const { [bookISBNInput]: _, ...rest } = prev;
            return rest;
          });
        }, 3000);

        setBookISBNInput('');
        return;
      }

      // Valid scan - add to list
      Vibration.vibrate(50); // Success vibrate
      
      setScannedBooks((prev) => [
        ...prev,
        {
          isbn: bookISBNInput,
          id: validation.book.id,
          title: validation.book.title,
          author: validation.book.author,
          status: 'pending',
          timestamp: Date.now(),
        },
      ]);

      setBookISBNInput('');
    } catch (error) {
      console.error('Error scanning book:', error);
      Alert.alert('Error', error.message || 'Scan failed');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionActive, bookISBNInput, validateBook]);

  /**
   * Remove scanned book
   */
  const removeBook = useCallback((isbn) => {
    setScannedBooks((prev) => prev.filter((b) => b.isbn !== isbn));
    setValidationErrors((prev) => {
      const { [isbn]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // ============================================================
  // BATCH ISSUANCE
  // ============================================================

  /**
   * Execute atomic batch issuance transaction
   */
  const executeBatchIssue = useCallback(async (booksList) => {
    if (!sessionUser || booksList.length === 0) {
      throw new Error('No student or books to issue');
    }

    try {
      // Prepare transaction payload
      const payload = {
        user_id: sessionUser.id,
        books: booksList.map((b) => ({
          book_id: b.id,
          due_days: dueDays,
        })),
        issued_by: user?.id,
        batch_timestamp: Date.now(),
      };

      // Call backend batch API
      // This should be a single atomic transaction
      const response = await fetch(
        `${API_BASE_URL}/transactions/batch-issue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.id}`, // Would use real token
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Batch issue failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        // ROLLBACK: All or nothing
        throw new Error(result.message || 'Batch transaction failed');
      }

      return result;
    } catch (error) {
      console.error('Batch issuance error:', error);
      throw error;
    }
  }, [sessionUser, dueDays, user]);

  /**
   * Store transaction for offline sync
   */
  const storeOfflineTransaction = useCallback(async (transaction) => {
    try {
      const existing = await AsyncStorage.getItem('offlineTransactions');
      const queue = existing ? JSON.parse(existing) : [];
      queue.push({
        id: `tx_${Date.now()}`,
        ...transaction,
        status: 'pending_sync',
        syncedAt: null,
      });
      await AsyncStorage.setItem('offlineTransactions', JSON.stringify(queue));
      setOfflineQueue(queue);
    } catch (error) {
      console.error('Error storing offline transaction:', error);
    }
  }, []);

  /**
   * Load offline queue
   */
  const loadOfflineQueue = useCallback(async () => {
    try {
      const queue = await AsyncStorage.getItem('offlineTransactions');
      if (queue) {
        setOfflineQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }, []);

  /**
   * Finalize issuance (manual or auto)
   */
  const handleFinalize = useCallback(
    async (isAutomatic = false) => {
      if (!sessionActive || scannedBooks.length === 0) {
        return;
      }

      try {
        setIsProcessing(true);

        // Execute batch transaction
        const result = await executeBatchIssue(scannedBooks);

        // Success
        Vibration.vibrate([100, 100, 100]); // Success pattern

        setLastTransaction({
          id: result.transaction_id,
          studentId: sessionUser.id,
          studentName: sessionUser.name,
          books: scannedBooks,
          count: scannedBooks.length,
          issuedAt: new Date(),
        });

        setShowResults(true);
        setUndoAvailable(true);

        // Undo window expires after 10 seconds
        setTimeout(() => {
          setUndoAvailable(false);
        }, UNDO_WINDOW);

        // Reset for next student
        setTimeout(() => {
          handleSessionExpire();
          setShowResults(false);
        }, 3000);
      } catch (error) {
        console.error('Finalization error:', error);

        // Store for offline sync if API unavailable
        if (!isOnline) {
          await storeOfflineTransaction({
            user_id: sessionUser.id,
            books: scannedBooks,
          });

          Alert.alert(
            'Offline Mode',
            'Transaction stored locally. Will sync when online.',
            [{ text: 'OK', onPress: handleSessionExpire }]
          );
        } else {
          Alert.alert('Error', error.message || 'Failed to issue books');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionActive, scannedBooks, sessionUser, executeBatchIssue, isOnline]
  );

  /**
   * Undo last transaction
   */
  const handleUndo = useCallback(async () => {
    if (!undoAvailable || !lastTransaction) {
      Alert.alert('Undo Expired', 'Undo window has closed');
      return;
    }

    try {
      setIsProcessing(true);

      // Call undo API
      await fetch(
        `${API_BASE_URL}/transactions/${lastTransaction.id}/undo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.id}`,
          },
        }
      );

      Vibration.vibrate(100);
      Alert.alert('✓ Undo Successful', 'Transaction reversed. Books restored to inventory.');

      setShowResults(false);
      setUndoAvailable(false);
      setLastTransaction(null);
      handleSessionExpire();
    } catch (error) {
      console.error('Undo error:', error);
      Alert.alert('Error', 'Failed to undo transaction');
    } finally {
      setIsProcessing(false);
    }
  }, [undoAvailable, lastTransaction, user]);

  // ============================================================
  // RENDERING
  // ============================================================

  /**
   * Render book item
   */
  const renderBookItem = ({ item }) => {
    const error = validationErrors[item.isbn];

    return (
      <View style={[styles.bookItem, error && styles.bookItemError]}>
        <View style={styles.bookItemContent}>
          <View style={styles.bookItemHeader}>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {error && (
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#FF3B30"
              />
            )}
          </View>

          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>

          <View style={styles.bookMeta}>
            <Text style={styles.bookISBN}>{item.isbn}</Text>
            <Text style={styles.bookStatus}>
              {error ? error : '✓ Valid'}
            </Text>
          </View>
        </View>

        {!error && (
          <TouchableOpacity
            onPress={() => removeBook(item.isbn)}
            style={styles.removeButton}
          >
            <MaterialCommunityIcons
              name="delete"
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (showResults && lastTransaction) {
    return (
      <Modal transparent visible={showResults}>
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <MaterialCommunityIcons
              name="check-circle"
              size={60}
              color="#34C759"
              style={styles.resultIcon}
            />

            <Text style={styles.resultTitle}>
              {lastTransaction.count} Books Issued Successfully
            </Text>

            <View style={styles.resultDetails}>
              <Text style={styles.resultLabel}>Student:</Text>
              <Text style={styles.resultValue}>{lastTransaction.studentName}</Text>

              <Text style={[styles.resultLabel, { marginTop: 12 }]}>
                Books:
              </Text>
              {lastTransaction.books.map((b, i) => (
                <Text key={i} style={styles.resultBook}>
                  • {b.title}
                </Text>
              ))}

              <Text style={[styles.resultLabel, { marginTop: 12 }]}>
                Due Date:
              </Text>
              <Text style={styles.resultValue}>
                {new Date(
                  Date.now() + dueDays * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.undoButton}
                onPress={handleUndo}
                disabled={!undoAvailable || isProcessing}
              >
                <MaterialCommunityIcons
                  name="undo"
                  size={18}
                  color={undoAvailable ? '#FF9500' : '#CCC'}
                />
                <Text
                  style={[
                    styles.undoButtonText,
                    !undoAvailable && styles.undoButtonDisabled,
                  ]}
                >
                  Undo {undoAvailable ? '✓' : '(expired)'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.undoTimer}>
                {undoAvailable
                  ? `${Math.ceil(UNDO_WINDOW / 1000)}s window`
                  : 'Undo expired'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Issue Books</Text>
          <Text style={styles.headerSubtitle}>Batch scanning mode</Text>
        </View>

        {/* Session Status */}
        {sessionActive && sessionUser && (
          <View style={styles.sessionBanner}>
            <View style={styles.sessionInfo}>
              <MaterialCommunityIcons
                name="account-check"
                size={20}
                color="#34C759"
              />
              <View style={styles.sessionText}>
                <Text style={styles.sessionStudent}>{sessionUser.name}</Text>
                <Text style={styles.sessionTime}>
                  {Math.ceil(sessionTimeRemaining / 1000)}s remaining
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleSessionExpire}>
              <MaterialCommunityIcons
                name="close"
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        )}

        {!sessionActive ? (
          // STEP 1: Student QR Scan
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Step 1: Scan Student QR</Text>
            
            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={24}
                color="#007AFF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Scan student QR or enter ID..."
                placeholderTextColor="#999"
                value={studentQRInput}
                onChangeText={setStudentQRInput}
                onSubmitEditing={handleStudentQRScan}
                editable={!isProcessing}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
              onPress={handleStudentQRScan}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.primaryButtonText}>Load Student</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // STEP 2-3: Book Scanning & List
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📖 Step 2: Scan Books ({scannedBooks.length})
            </Text>

            <View style={styles.inputGroup}>
              <MaterialCommunityIcons
                name="barcode-scan"
                size={24}
                color="#007AFF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Scan book ISBN..."
                placeholderTextColor="#999"
                value={bookISBNInput}
                onChangeText={setBookISBNInput}
                onSubmitEditing={handleBookScan}
                editable={!isProcessing}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, isProcessing && styles.buttonDisabled]}
              onPress={handleBookScan}
              disabled={isProcessing}
            >
              <MaterialCommunityIcons
                name="plus"
                size={18}
                color="#007AFF"
              />
              <Text style={styles.secondaryButtonText}>Add Book</Text>
            </TouchableOpacity>

            {/* Due Date Selector */}
            <View style={styles.dueDateSelector}>
              <Text style={styles.dueDateLabel}>Due in:</Text>
              <View style={styles.dueDateOptions}>
                {[7, 14, 21, 30].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dueDateButton,
                      dueDays === days && styles.dueDateButtonActive,
                    ]}
                    onPress={() => setDueDays(days)}
                  >
                    <Text
                      style={[
                        styles.dueDateButtonText,
                        dueDays === days && styles.dueDateButtonTextActive,
                      ]}
                    >
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Scanned Books List */}
            <Text style={styles.listTitle}>
              Scanned Books ({scannedBooks.length})
            </Text>

            {scannedBooks.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={40}
                  color="#CCC"
                />
                <Text style={styles.emptyText}>Scan books to add them</Text>
              </View>
            ) : (
              <FlatList
                data={scannedBooks}
                renderItem={renderBookItem}
                keyExtractor={(item, i) => `${item.isbn}-${i}`}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                style={styles.bookList}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={handleSessionExpire}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color="#FF3B30"
                />
                <Text style={[styles.secondaryButtonText, { color: '#FF3B30' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    flex: 1,
                    marginLeft: 8,
                    opacity: scannedBooks.length === 0 ? 0.5 : 1,
                  },
                ]}
                onPress={() => handleFinalize(false)}
                disabled={scannedBooks.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check-all"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.primaryButtonText}>Done</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={16}
              color="#FF9500"
            />
            <Text style={styles.offlineText}>
              Offline mode - transactions will sync when online
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sessionBanner: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  sessionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionText: {
    flex: 1,
  },
  sessionStudent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dueDateSelector: {
    marginTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dueDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  dueDateOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  dueDateButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  dueDateButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dueDateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  dueDateButtonTextActive: {
    color: '#fff',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  bookList: {
    maxHeight: 250,
    marginBottom: 12,
  },
  bookItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookItemError: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF3B30',
  },
  bookItemContent: {
    flex: 1,
  },
  bookItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookISBN: {
    fontSize: 11,
    color: '#999',
  },
  bookStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34C759',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultDetails: {
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  resultBook: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  resultActions: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
    gap: 8,
  },
  undoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  undoButtonDisabled: {
    color: '#CCC',
  },
  undoTimer: {
    fontSize: 12,
    color: '#999',
  },
  offlineBanner: {
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#FF9500',
    flex: 1,
  },
});

export default IssueBooksScreen;
