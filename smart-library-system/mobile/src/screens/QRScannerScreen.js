import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { ScreenWrapper, SecondaryButton } from '../components/UI';
import { COLORS } from '../constants';
import { booksService } from '../services';

const QRScannerScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestScannerPermission();
  }, []);

  const requestScannerPermission = async () => {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      setHasPermission(false);
      Alert.alert('Permission Error', 'Unable to access camera permission');
    }
  };

  const handleQRScanned = async (qrCode) => {
    if (!qrCode || loading) {
      return;
    }

    try {
      setLoading(true);
      const bookDetails = await booksService.getBookByQRCode(qrCode);

      if (bookDetails) {
        navigation.navigate('BiometricVerification', {
          qrCode,
          bookDetails,
        });
        return;
      }

      Alert.alert('Error', 'Book not found for this QR code');
      setScanned(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to scan QR code');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const onBarCodeScanned = ({ data }) => {
    if (scanned || loading) {
      return;
    }

    setScanned(true);
    handleQRScanned(data);
  };

  return (
    <ScreenWrapper style={styles.screen} contentStyle={styles.content}>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : null}

      {hasPermission === null ? (
        <Text style={styles.instructions}>Requesting camera permission...</Text>
      ) : null}

      {hasPermission === false ? (
        <View style={styles.permissionBox}>
          <Text style={styles.instructions}>Camera access is required to scan QR codes.</Text>
          <SecondaryButton
            label="Grant Permission"
            style={styles.switchButton}
            onPress={requestScannerPermission}
          />
        </View>
      ) : null}

      {hasPermission === true ? (
        <>
          <View style={styles.cameraBox}>
            <BarCodeScanner onBarCodeScanned={onBarCodeScanned} style={StyleSheet.absoluteFillObject} />
            <View style={styles.scanFrame} />
          </View>

          <Text style={styles.instructions}>
            Align the QR code inside the frame. Scanning will continue automatically after each attempt.
          </Text>

          {scanned && !loading ? (
            <SecondaryButton
              label="Scan Again"
              style={styles.switchButton}
              onPress={() => setScanned(false)}
            />
          ) : null}
        </>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 24,
    alignItems: 'center',
  },
  permissionBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 24,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 100,
  },
  cameraBox: {
    width: '100%',
    height: 330,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  scanFrame: {
    width: '68%',
    height: '54%',
    borderWidth: 2,
    borderColor: COLORS.white,
    borderRadius: 20,
  },
  instructions: {
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  switchButton: {
    width: '100%',
    marginBottom: 12,
  },
});

export default QRScannerScreen;
