/**
 * QR Code Utilities
 * Handles QR code generation, display, and refresh
 */

import { useState, useEffect } from 'react';

/**
 * QR Refresh Hook - Updates QR code every 10 seconds
 * Matches backend's 15-second expiry with 10-second refresh
 */
export const useQRRefresh = (generateQRFunction, enabled = true) => {
  const [qrCode, setQRCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    if (!enabled) return;

    // Generate QR immediately
    const generateQR = async () => {
      try {
        setIsLoading(true);
        const result = await generateQRFunction();
        setQRCode(result);
        setLastRefresh(Date.now());
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to generate QR code');
        console.error('QR generation error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();

    // Refresh every 10 seconds
    const interval = setInterval(generateQR, 10000);

    return () => clearInterval(interval);
  }, [enabled, generateQRFunction]);

  return { qrCode, isLoading, error, lastRefresh };
};

/**
 * QR Code decoder - Parse QR data
 */
export const decodeQRCode = (qrData) => {
  try {
    const decoded = JSON.parse(atob(qrData));
    return {
      valid: true,
      data: decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid QR code format',
    };
  }
};

/**
 * Time remaining until QR expiry
 */
export const getQRTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
  
  return remaining;
};

/**
 * Format QR expiry countdown
 */
export const formatQRCountdown = (seconds) => {
  if (seconds <= 0) return 'Expired';
  if (seconds <= 5) return `${seconds}s (Refreshing...)`;
  return `${seconds}s`;
};

export default {
  useQRRefresh,
  decodeQRCode,
  getQRTimeRemaining,
  formatQRCountdown,
};
