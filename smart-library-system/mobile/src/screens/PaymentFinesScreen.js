import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper, PrimaryButton } from '../components/UI';
import { COLORS } from '../constants';
import { paymentsService } from '../services';

const PaymentFinesScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [fines, setFines] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with Card',
      logo: 'ðŸ’³',
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'Pay with Digital Wallet',
      logo: 'ðŸ“±',
    },
  ];

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await paymentsService.getUserFines();
      setFines(result?.fines || []);
      setTotalAmount(result?.totalAmount || 0);
    } catch (err) {
      console.error('Error loading fines:', err);
      setError(err.message || 'Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFines();
    setRefreshing(false);
  };

  const handlePayNow = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (totalAmount === 0) {
      Alert.alert('Info', 'No pending fines to pay');
      return;
    }

    try {
      setPaying(true);
      const result = await paymentsService.initiatePayment(totalAmount, `Library Fines Payment`);
      
      if (result?.paymentId) {
        // In a real app, this would redirect to payment gateway
        Alert.alert('Payment Initiated', 'Processing your payment...');
        
        // Simulate payment completion
        setTimeout(async () => {
          try {
            const verified = await paymentsService.verifyPayment(result.paymentId);
            if (verified?.success) {
              Alert.alert('Success', 'Payment completed successfully!');
              loadFines(); // Reload fines
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to verify payment');
          }
        }, 2000);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper style={[styles.screen, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper style={[styles.screen, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <PrimaryButton label="Retry" onPress={loadFines} style={{ marginTop: 16 }} />
      </ScreenWrapper>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <ScreenWrapper style={styles.screen}>
      <View style={styles.heroSection}>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceBadgeText}>Outstanding Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          <Text style={styles.currency}>$</Text>{totalAmount.toFixed(2)}
        </Text>
        {fines.length === 0 ? (
          <Text style={styles.dueDate}>âœ… No pending fines</Text>
        ) : (
          <Text style={styles.dueDate}>{fines.length} fine{fines.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {fines.length > 0 && (
        <View style={styles.finesGrid}>
          {fines.map((fine) => (
            <View key={fine.id} style={styles.fineCard}>
              <View style={styles.fineHeader}>
                <View style={[styles.fineIcon, { backgroundColor: COLORS.primary }]}>
                  <MaterialIcons name="receipt" size={20} color="#fff" />
                </View>
                <Text style={styles.fineAmount}>${fine.amount?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.fineContent}>
                <Text style={styles.fineTitle}>{fine.type || 'Fine'}</Text>
                <Text style={styles.fineDetail}>{fine.description || 'Library fine'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.paymentMethods}>
        {paymentMethods.map((method) => (
          <Pressable
            key={method.id}
            style={[styles.paymentCard, selectedMethod === method.id && styles.paymentCardSelected]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.paymentRow}>
              <View style={styles.paymentLogo}>
                <Text style={styles.paymentLogoText}>{method.logo}</Text>
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{method.name}</Text>
                <Text style={styles.paymentDescription}>{method.description}</Text>
              </View>
            </View>
            <View style={[styles.radioButton, selectedMethod === method.id && styles.radioButtonSelected]} />
          </Pressable>
        ))}
      </View>

      <View style={styles.paySection}>
        <PrimaryButton 
          label={paying ? 'Processing...' : 'Pay Now'} 
          onPress={handlePayNow} 
          style={styles.payButton}
          disabled={paying || totalAmount === 0}
        />
        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={16} color={COLORS.onSurfaceVariant} style={styles.securityIcon} />
          <Text style={styles.securityText}>Secure 256-bit encrypted transaction</Text>
        </View>
      </View>
    </ScreenWrapper>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  balanceBadge: {
    backgroundColor: COLORS.secondaryFixed || COLORS.secondaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  balanceBadgeText: {
    color: COLORS.onSecondary || COLORS.onSecondaryContainer,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  currency: {
    color: COLORS.primary,
  },
  dueDate: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  finesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  fineCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
  },
  fineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fineIconText: {
    fontSize: 20,
  },
  fineAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  fineContent: {
    flex: 1,
  },
  fineTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  fineDetail: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 16,
  },
  paymentMethods: {
    gap: 12,
    marginBottom: 32,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
  },
  paymentCardSelected: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentLogo: {
    width: 48,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant || COLORS.surfaceContainerLow,
  },
  paymentLogoText: {
    fontSize: 18,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  paymentDescription: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant || COLORS.surfaceContainerLow,
  },
  radioButtonSelected: {
    borderColor: COLORS.primaryContainer,
  },
  paySection: {
    alignItems: 'center',
  },
  payButton: {
    width: '100%',
    marginBottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default PaymentFinesScreen;
