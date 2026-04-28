import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { issuesService, booksService } from '../services';

const IssueBooksScreen = ({ route, navigation }) => {
  const [bookId, setBookId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [dueDays, setDueDays] = useState('14');
  const [loading, setLoading] = useState(false);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [bookDetails, setBookDetails] = useState(null);

  // Search for book
  const handleSearchBook = async () => {
    if (!bookId.trim()) {
      Alert.alert('Error', 'Please enter book ID');
      return;
    }

    try {
      setLoading(true);
      const book = await booksService.getBookDetail(bookId);
      const available = await booksService.checkBookAvailability(bookId);
      
      if (available?.available > 0) {
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
      const result = await issuesService.issueBook(bookId);
      
      setIssuedBooks([...issuedBooks, { ...result, studentId, dueDate: new Date(Date.now() + parseInt(dueDays) * 24 * 60 * 60 * 1000) }]);
      
      setBookId('');
      setStudentId('');
      setBookDetails(null);
      
      Alert.alert('Success', `Book issued successfully!\nDue: ${result.dueDate || 'TBD'}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to issue book');
    } finally {
      setLoading(false);
    }
  };

  // Bulk issue
  const handleBulkIssue = async () => {
    if (issuedBooks.length === 0) {
      Alert.alert('No Books', 'Please add books to issue');
      return;
    }

    try {
      setLoading(true);
      const bookIds = issuedBooks.map(b => b.id || b.bookId);
      const result = await issuesService.issueBulkBooks(bookIds);
      
      Alert.alert('Success', `${result.successful || issuedBooks.length} books issued successfully!`);
      setIssuedBooks([]);
      setBookId('');
      setStudentId('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to issue books');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="book-plus" size={32} color="#007AFF" />
        <Text style={styles.title}>Issue Books</Text>
      </View>

      {/* Student ID Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Student ID"
          value={studentId}
          onChangeText={setStudentId}
          editable={!loading}
        />
      </View>

      {/* Book Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Book</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="Enter Book ID"
            value={bookId}
            onChangeText={setBookId}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchBook}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Book Details */}
      {bookDetails && (
        <View style={styles.bookCard}>
          <Text style={styles.bookTitle}>{bookDetails.title}</Text>
          <Text style={styles.bookAuthor}>{bookDetails.author}</Text>
          <View style={styles.bookMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>ISBN</Text>
              <Text style={styles.metaValue}>{bookDetails.isbn || 'N/A'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>{bookDetails.category || 'N/A'}</Text>
            </View>
          </View>

          {/* Due Days */}
          <View style={styles.dueSection}>
            <Text style={styles.label}>Due in Days:</Text>
            <TextInput
              style={styles.dueDaysInput}
              placeholder="14"
              value={dueDays}
              onChangeText={setDueDays}
              keyboardType="number-pad"
            />
          </View>

          {/* Issue Button */}
          <TouchableOpacity
            style={styles.issueButton}
            onPress={handleIssueBook}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.issueButtonText}>Issue Book</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Issued Books List */}
      {issuedBooks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Books to Issue ({issuedBooks.length})</Text>
          <FlatList
            data={issuedBooks}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.issuedItem}>
                <View style={styles.issuedItemContent}>
                  <Text style={styles.issuedTitle}>{item.title || 'Unknown'}</Text>
                  <Text style={styles.issuedDetail}>Student: {item.studentId}</Text>
                  <Text style={styles.issuedDetail}>Due: {item.dueDate?.toLocaleDateString() || 'TBD'}</Text>
                </View>
                <TouchableOpacity onPress={() => setIssuedBooks(issuedBooks.filter((_, i) => _ !== item))}>
                  <MaterialCommunityIcons name="close" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(_, i) => `${i}`}
          />

          {/* Bulk Issue Button */}
          <TouchableOpacity
            style={styles.bulkButton}
            onPress={handleBulkIssue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                <Text style={styles.bulkButtonText}>Issue All Books</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bookMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dueSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  dueDaysInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  issueButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  issueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  issuedItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issuedItemContent: {
    flex: 1,
  },
  issuedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  issuedDetail: {
    fontSize: 12,
    color: '#666',
  },
  bulkButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IssueBooksScreen;
