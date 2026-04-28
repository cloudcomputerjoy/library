/**
 * OTP Screen
 * OTP verification for password reset
 * Integrated with Supabase authentication
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePasswordReset } from '../hooks/useAuth';

const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
  const { email, mode } = route?.params || {};
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const[errors, setErrors] = useState({});
  const [step, setStep] = useState('otp'); // 'otp' or 'password'
  const [resetToken, setResetToken] = useState(null);

  const inputs = useRef([]);
  const { verifyPasswordResetOTP, resetPasswordWithToken, isLoading } = usePasswordReset();

  // Auto-focus first OTP input
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  /**
   * Update OTP digit
   */
  const updateOtp = (text, index) => {
    const nextOtp = [...otp];
    nextOtp[index] = text.slice(-1);
    setOtp(nextOtp);

    // Auto-focus next input
    if (text && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (nextOtp.every((digit) => digit !== '')) {
      handleVerifyOTP(nextOtp);
    }
  };

  /**
   * Handle backspace
   */
  const handleBackspace = (index) => {
    if (index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  /**
   * Get full OTP
   */
  const getFullOTP = (otpArray = otp) => {
    return otpArray.join('');
  };

  /**
   * Verify OTP
   */
  const handleVerifyOTP = async (otpArray = otp) => {
    const fullOtp = getFullOTP(otpArray);

    if (fullOtp.length !== OTP_LENGTH) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    try {
      const result = await verifyPasswordResetOTP(email, fullOtp);

      if (result?.success) {
        setResetToken(result.resetToken);
        setStep('password');
        Alert.alert('OTP Verified', 'Great! Now set your new password.');
      } else {
        Alert.alert('Invalid OTP', result?.error || 'The OTP you entered is invalid or expired.');
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to verify OTP');
    }
  };

  /**
   * Validate password form
   */
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.password = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirm = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle password reset
   */
  const handleResetPassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      const result = await resetPasswordWithToken(resetToken, newPassword);

      if (result?.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. Please log in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            },
          ]
        );
      } else {
        Alert.alert('Error', result?.error || 'Failed to reset password');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'password') {
              setStep('otp');
              setNewPassword('');
              setConfirmPassword('');
              setErrors({});
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'otp' ? 'Enter Code' : 'New Password'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'otp' ? (
          <>
            {/* OTP form */}
            <View style={styles.section}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to {email}. Enter it below.
              </Text>
            </View>

            {/* OTP inputs */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => updateOtp(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(index);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!isLoading}
                  selectionColor="#007AFF"
                  caretHidden={false}
                />
              ))}
            </View>

            {/* Manual verify button (if not auto-verified) */}
            {!otp.every((digit) => digit !== '') && (
              <TouchableOpacity
                style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
                onPress={() => handleVerifyOTP()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify Code</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Resend link */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.resendLink}>Request again</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Password reset form */}
            <View style={styles.section}>
              <Text style={styles.title}>Choose New Password</Text>
              <Text style={styles.subtitle}>
                Create a strong password to secure your account.
              </Text>
            </View>

            {/* New password input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password ? styles.inputError : null,
                ]}
              >
                <MaterialCommunityIcons name="lock" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm password input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  errors.confirm ? styles.inputError : null,
                ]}
              >
                <MaterialCommunityIcons name="lock-check" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (errors.confirm) {
                      setErrors(prev => ({ ...prev, confirm: '' }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirm && (
                <Text style={styles.errorText}>{errors.confirm}</Text>
              )}
            </View>

            {/* Reset button */}
            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // OTP styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 28,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 4,
  },
  // Password reset styles
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FEF0F0',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    color: '#000',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: '#4CAF50',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default OTPScreen;
