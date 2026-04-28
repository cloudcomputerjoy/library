import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenWrapper, SecondaryButton, PrimaryButton } from '../components/UI';
import { COLORS } from '../constants';
import { issuesService } from '../services';

const BiometricVerificationScreen = ({ route, navigation }) => {
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [requestType, setRequestType] = useState('issue');
  const [transactionId, setTransactionId] = useState(null);

  useEffect(() => {
    if (route.params) {
      setQrCode(route.params.qrCode);
      setBookDetails(route.params.bookDetails);
      setRequestType(route.params.requestType || 'issue');
      setTransactionId(route.params.transactionId || null);
    }
  }, [route.params]);

  const handleBiometricVerification = async () => {
    try {
      setLoading(true);
      // Simulate biometric verification
      // In production, use expo-local-authentication or react-native-biometric
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setVerified(true);

      // Create issuance request after verification
      if (qrCode && bookDetails) {
        await createIssuanceRequest();
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric verification failed');
    } finally {
      setLoading(false);
    }
  };

  const createIssuanceRequest = async () => {
    try {
      setLoading(true);
      const result = await issuesService.createIssuanceRequest(
        bookDetails.id,
        qrCode,
        bookDetails,
        { requestType, transactionId }
      );

      if (result.success) {
        Alert.alert('Success', `${requestType} request created. Admin will scan the book to confirm.`);
        setTimeout(() => {
          navigation.navigate('QRMain');
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create issuance request');
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeVerification = () => {
    Alert.prompt('Enter Passcode', 'Enter 4-digit passcode', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Verify',
        onPress: (code) => {
          if (code && code.length === 4 && /^\d+$/.test(code)) {
            setVerified(true);
            if (qrCode && bookDetails) {
              createIssuanceRequest();
            }
          } else {
            Alert.alert('Error', 'Invalid passcode');
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper style={styles.screen} contentStyle={styles.content}>
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}

      <View style={styles.backgroundPulse} />
      <Text style={styles.title}>Verify Your Identity</Text>
      <Text style={styles.subtitle}>
        {bookDetails?.title ? `Confirm to ${requestType}: "${bookDetails.title}"` : 'Scan your fingerprint to request book'}
      </Text>

      <View style={styles.scannerOuter}>
        <View style={styles.scannerInner}>
          <MaterialIcons
            name={verified ? 'check-circle' : 'fingerprint'}
            size={72}
            color={verified ? COLORS.primary : COLORS.onSurfaceVariant}
          />
        </View>
      </View>

      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: verified ? COLORS.primary : COLORS.secondary }]} />
        <Text style={[styles.statusText, { color: verified ? COLORS.primary : COLORS.secondary }]}>
          {verified ? 'VERIFIED' : 'WAITING FOR INPUT'}
        </Text>
      </View>

      {!verified && (
        <>
          <PrimaryButton label="Scan Fingerprint" onPress={handleBiometricVerification} style={styles.primaryButton} />
          <SecondaryButton label="Use Passcode Instead" onPress={handlePasscodeVerification} style={styles.secondaryButton} />
        </>
      )}

      {verified && (
        <Text style={styles.successText}>âœ“ Identity verified. Creating request...</Text>
      )}

      <View style={styles.helpAction}>
        <Pressable style={styles.helpButton} onPress={handleCancel}>
          <Text style={styles.helpText}>{verified ? 'Done' : 'Cancel'}</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 28,
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    zIndex: 100,
  },
  backgroundPulse: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    top: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
    fontSize: 14,
  },
  scannerOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  scannerInner: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(234, 221, 255, 0.3)',
    marginBottom: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  successText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    marginBottom: 14,
  },
  secondaryButton: {
    width: '100%',
  },
  helpAction: {
    marginTop: 16,
  },
  helpButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  helpText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default BiometricVerificationScreen;
