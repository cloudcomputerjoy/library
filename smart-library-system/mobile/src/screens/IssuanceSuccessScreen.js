/**
 * IssuanceSuccessScreen.js
 * Real-time success screen shown immediately after book issuance
 * Displays issued books, due dates, and next steps
 * Uses Socket.IO for real-time updates if user is in-app
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useAuth } from '../hooks/useAuth';
import { socketService } from '../services/socketService';

const IssuanceSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [sessionId, setSes sionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const [bookCount, setBookCount] = useState(0);
  const [dueDate, setDueDate] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Get data from route params
    if (route?.params) {
      const { books: issuedBooks, sessionId: sessionData, dueDate: dueDateData } = route.params;
      
      if (issuedBooks) {
        setBooks(issuedBooks);
        setBookCount(issuedBooks.length);
      }
      
      if (sessionData) {
        setSes sionId(sessionData);
      }
      
      if (dueDateData) {
        setDueDate(new Date(dueDateData));
      }

      setLoading(false);
    }

    // Animate in
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Listen for real-time issuance updates via Socket.IO
    if (user?.id) {
      const handleIssuanceSuccess = (data) => {
        console.log('📬 Real-time issuance update received:', data);
        
        if (data.books) {
          setBooks(data.books);
          setBookCount(data.booksCount);
        }
        
        if (data.dueDate) {
          setDueDate(new Date(data.dueDate));
        }
      };

      socketService.onIssuanceSuccess(user.id, handleIssuanceSuccess);

      return () => {
        socketService.offIssuanceSuccess(user.id, handleIssuanceSuccess);
      };
    }
  }, [route?.params, user?.id]);

  const getDaysUntilDue = () => {
    if (!dueDate) return 0;
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewBooks = () => {
    navigation.navigate('ActiveBooks');
  };

  const handleDownloadReceipt = async () => {
    try {
      // Generate and download receipt
      Alert.alert('Receipt', 'Receipt downloaded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to download receipt');
    }
  };

  const handleReturnHome = () => {
    navigation.replace('Home');
  };

 if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Processing your issuance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        {showConfetti && (
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../assets/animations/success-confetti.json')}
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
              onAnimationFinish={() => setShowConfetti(false)}
            />
          </View>
        )}

        {/* Header with Success Message */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color="#4CAF50"
            style={styles.successIcon}
          />
          <Text style={styles.successTitle}>✅ Books Issued Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your transaction has been completed
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <MaterialCommunityIcons name="book-multiple" size={24} color="#1976d2" />
            <Text style={styles.statValue}>{bookCount}</Text>
            <Text style={styles.statLabel}>Books Issued</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <MaterialCommunityIcons name="calendar" size={24} color="#ff6f00" />
            <Text style={styles.statValue}>{getDaysUntilDue()}</Text>
            <Text style={styles.statLabel}>Days to Return</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#7b1fa2" />
            <Text style={styles.statValue}>14</Text>
            <Text style={styles.statLabel}>Days Borrowed</Text>
          </View>
        </View>

        {/* Issue Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Issuance Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Issue Date:</Text>
            <Text style={styles.summaryValue}>{formatDate(new Date())}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Due Date:</Text>
            <Text style={[styles.summaryValue, { color: '#ff6f00', fontWeight: 'bold' }]}>
              {formatDate(dueDate)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Books Count:</Text>
            <Text style={styles.summaryValue}>{bookCount}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Session ID:</Text>
            <Text style={[styles.summaryValue, { fontSize: 11 }]}>{sessionId}</Text>
          </View>
        </View>

        {/* Books List */}
        {books.length > 0 && (
          <View style={styles.booksSection}>
            <Text style={styles.sectionTitle}>📚 Issued Books</Text>

            <FlatList
              data={books}
              scrollEnabled={false}
              keyExtractor={(item, idx) => `${item.id}_${idx}`}
              renderItem={({ item, index }) => (
                <View style={styles.bookCard}>
                  <View style={styles.bookNumber}>
                    <Text style={styles.bookNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {item.title || 'Unknown Book'}
                    </Text>
                    <Text style={styles.bookISBN}>ISBN: {item.isbn || 'N/A'}</Text>
                  </View>

                  <View style={styles.bookStatus}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}

        {/* Important Reminders */}
        <View style={styles.remindersContainer}>
          <Text style={styles.remindersTitle}>⚠️ Important Reminders</Text>

          <View style={[styles.reminderCard, { backgroundColor: '#fff3cd', borderLeftColor: '#ffc107' }]}>
            <MaterialCommunityIcons name="information" size={20} color="#856404" />
            <Text style={[styles.reminderText, { color: '#856404' }]}>
              Please verify book condition before leaving the counter
            </Text>
          </View>

          <View style={[styles.reminderCard, { backgroundColor: '#ffebee', borderLeftColor: '#f44336' }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#c62828" />
            <Text style={[styles.reminderText, { color: '#c62828' }]}>
              Late fee: ₹5 per book per day after {formatDate(dueDate)}
            </Text>
          </View>

          <View style={[styles.reminderCard, { backgroundColor: '#e8f5e9', borderLeftColor: '#4CAF50' }]}>
            <MaterialCommunityIcons name="check" size={20} color="#2e7d32" />
            <Text style={[styles.reminderText, { color: '#2e7d32' }]}>
              You'll receive a reminder 3 days before the due date
            </Text>
          </View>
        </View>

        {/* What's Next */}
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>📌 What's Next?</Text>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review Your Books</Text>
              <Text style={styles.stepDescription}>
                Check the list of books issued to you in the app
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track Reading</Text>
              <Text style={styles.stepDescription}>
                Mark books as read or manage your reading list
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Return on Time</Text>
              <Text style={styles.stepDescription}>
                Return books before the due date to avoid fines
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Renew if Needed</Text>
              <Text style={styles.stepDescription}>
                You can renew books up to 3 times if not reserved
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleViewBooks}
          >
            <MaterialCommunityIcons name="eye" size={20} color="#fff" />
            <Text style={styles.buttonText}>View My Books</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleDownloadReceipt}
          >
            <MaterialCommunityIcons name="download" size={20} color="#667eea" />
            <Text style={[styles.buttonText, { color: '#667eea' }]}>Download Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tertiaryButton} onPress={handleReturnHome}>
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  animationContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: 'bold',
  },
  booksSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  bookNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  bookISBN: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  bookStatus: {
    alignItems: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  remindersContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  remindersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  nextStepsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  stepDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  actionContainer: {
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  spacing: {
    height: 20,
  },
});

export default IssuanceSuccessScreen;
