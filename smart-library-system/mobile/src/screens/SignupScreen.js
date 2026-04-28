/**
 * Signup Screen
 * User registration with email, password, and profile data
 * Integrated with Supabase authentication
 * Phone: 11-digit validation (Bangladesh format)
 * Email: Institution domain validation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';


const SignupScreen = ({ navigation }) => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    studentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Allowed institution domains (customizable from admin)
  const [allowedDomains, setAllowedDomains] = useState(['@aaub.edu.bd', '@aiub.edu.bd']);

  // Load allowed domains on component mount
  useEffect(() => {
    const loadAllowedDomains = async () => {
      try {
        // In production, fetch from backend: GET /api/admin/settings/domains
        // For now, using default domains or environment variable
        const domains = process.env.EXPO_PUBLIC_ALLOWED_DOMAINS 
          ? process.env.EXPO_PUBLIC_ALLOWED_DOMAINS.split(',')
          : ['@aaub.edu.bd', '@aiub.edu.bd'];
        setAllowedDomains(domains);
      } catch (err) {
        console.warn('Failed to load allowed domains, using defaults');
      }
    };
    loadAllowedDomains();
  }, []);

  /**
   * Check if email domain is allowed
   */
  const isEmailDomainAllowed = (email) => {
    const domain = email.substring(email.indexOf('@'));
    return allowedDomains.some(d => d.toLowerCase() === domain.toLowerCase());
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    } else if (!isEmailDomainAllowed(formData.email)) {
      newErrors.email = `Email must be from: ${allowedDomains.join(', ')}`;
    }

    // Password validation (minimum 8 characters)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Phone validation (11-digit Bangladesh format)
    if (formData.phone && !/^\d{11}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 11-digit phone number (e.g., 01712345678)';
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle signup with real backend API
   */
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post('/auth/register', {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        studentId: formData.studentId.trim(),
      });

      // Save token if returned
      if (response.data?.token) {
        await AsyncStorage.setItem('accessToken', response.data.token);
      }

      Alert.alert(
        'Success',
        'Account created successfully! Please log in with your credentials.',
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
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create account';
      setError(errorMessage);
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update form field
   */
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Input field component
   */
  const renderInput = (field, label, placeholder, icon, options = {}) => (
    <View key={field} style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          errors[field] ? styles.inputError : null,
        ]}
      >
        {icon && <MaterialCommunityIcons name={icon} size={20} color="#666" />}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          {...options}
        />
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Welcome message */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Join the Library</Text>
        <Text style={styles.welcomeSubtitle}>
          Create an account to access our book collection and manage your borrowing
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.label}>First Name</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.firstName ? styles.inputError : null,
              ]}
            >
              <MaterialCommunityIcons name="account" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#999"
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
              />
            </View>
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          <View style={styles.nameField}>
            <Text style={styles.label}>Last Name</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.lastName ? styles.inputError : null,
              ]}
            >
              <MaterialCommunityIcons name="account" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#999"
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
              />
            </View>
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>
        </View>

        {/* Email */}
        {renderInput(
          'email',
          'Institutional Email',
          `student@${allowedDomains[0]?.replace('@', '') || 'aaub.edu.bd'}`,
          'email',
          {
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            editable: !loading,
          }
        )}
        <Text style={styles.helperText}>
          Use institutional email: {allowedDomains.join(', ')}
        </Text>

        {/* Phone */}
        {renderInput(
          'phone',
          'Phone Number (11 digits)',
          '01712345678',
          'phone',
          {
            keyboardType: 'phone-pad',
            editable: !loading,
            maxLength: 11,
          }
        )}

        {/* Student ID */}
        {renderInput(
          'studentId',
          'Student ID (Optional)',
          'SID1234567',
          'card-account-details',
          { editable: !loading }
        )}

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
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
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
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

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.confirmPassword ? styles.inputError : null,
            ]}
          >
            <MaterialCommunityIcons name="lock-check" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => {
              setAgreeToTerms(!agreeToTerms);
              if (errors.terms) {
                setErrors(prev => ({ ...prev, terms: '' }));
              }
            }}
            disabled={loading}
          >
            <View
              style={[
                styles.checkboxBox,
                agreeToTerms && styles.checkboxChecked,
              ]}
            >
              {agreeToTerms && (
                <MaterialCommunityIcons name="check" size={16} color="#007AFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms and Conditions
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}
        </View>

        {/* Auth Error Display */}
        {error && (
          <View style={styles.authErrorBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.authErrorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* Signup Button */}
      <TouchableOpacity
        style={[styles.signupButton, loading && styles.signupButtonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.signupButtonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <View style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already have an account?</Text>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          disabled={loading}
        >
          <Text style={styles.loginLinkButton}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
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
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  authErrorBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF0F0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  authErrorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#FF3B30',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  signupButton: {
    marginHorizontal: 20,
    backgroundColor: '#007AFF',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkButton: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 4,
  },
});

export default SignupScreen;