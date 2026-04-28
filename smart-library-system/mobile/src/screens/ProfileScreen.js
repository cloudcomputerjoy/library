/**
 * Profile Screen
 * User profile, settings, and account management
 * Integrated with Supabase authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, useLogout, useChangePassword } from '../hooks/useAuth';

const ProfileScreen = ({ navigation }) => {
  const { user, session } = useAuth();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const { changePassword, isLoading: isChangingPassword, error: passwordError } = useChangePassword();

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await logout();
              // Navigation handled by RootNavigator watching auth state
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to sign out');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  /**
   * Validate password change form
   */
  const validatePasswordForm = () => {
    const errors = {};

    if (!currentPassword) {
      errors.current = 'Current password is required';
    }

    if (!newPassword) {
      errors.new = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.new = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errors.confirm = 'Please confirm new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle password change
   */
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result?.success) {
        Alert.alert(
          'Success',
          'Your password has been changed successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordErrors({});
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', passwordError || 'Failed to change password');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to change password');
    }
  };

  /**
   * Password input field component
   */
  const PasswordInput = ({ label, value, onChange, error, show, setShow, loading }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <MaterialCommunityIcons name="lock" size={20} color="#666" />
        <TextInput
          style={styles.input}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#999"
          value={value}
          onChangeText={(text) => {
            onChange(text);
            if (error) {
              setPasswordErrors(prev => ({ ...prev, [label.toLowerCase()]: '' }));
            }
          }}
          secureTextEntry={!show}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setShow(!show)}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name={show ? 'eye-off' : 'eye'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  // Extract user data
  const userEmail = user?.email || 'loading...';
  const userName = user?.user_metadata?.firstName && user?.user_metadata?.lastName
    ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
    : userEmail?.split('@')[0] || 'User';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : 'Recently';

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account-circle" size={80} color="#007AFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <View style={styles.memberBadge}>
                <MaterialCommunityIcons name="calendar" size={12} color="#4CAF50" />
                <Text style={styles.memberText}>Member since {memberSince}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Active Books</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>â‚¹0</Text>
            <Text style={styles.statLabel}>Pending Fines</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Tier 1</Text>
            <Text style={styles.statLabel}>Access Level</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <MaterialCommunityIcons name="cog" size={22} color="#007AFF" />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSubtitle}>App preferences and account info</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <MaterialCommunityIcons name="lock-reset" size={22} color="#FF9800" />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSubtitle}>Update your account password</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell" size={22} color="#4CAF50" />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>Manage your notifications</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* More Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PaymentFines')}
          >
            <MaterialCommunityIcons name="cash" size={22} color="#E91E63" />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Pay Fines</Text>
              <Text style={styles.menuSubtitle}>View and pay outstanding fines</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('FileSharing')}
          >
            <MaterialCommunityIcons name="share-variant" size={22} color="#2196F3" />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Shared Files</Text>
              <Text style={styles.menuSubtitle}>Access shared documents</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PrintPortal')}
          >
            <MaterialCommunityIcons name="printer" size={22} color="#9C27B0" />
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Print Portal</Text>
              <Text style={styles.menuSubtitle}>Manage print jobs</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, isLoggingOut && styles.signOutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={20} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Password</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalSubtitle}>
                Enter your current password and choose a new one.
              </Text>

              {/* Current Password */}
              <PasswordInput
                label="current"
                value={currentPassword}
                onChange={setCurrentPassword}
                error={passwordErrors.current}
                show={showCurrentPassword}
                setShow={setShowCurrentPassword}
                loading={isChangingPassword}
              />

              {/* New Password */}
              <PasswordInput
                label="new"
                value={newPassword}
                onChange={setNewPassword}
                error={passwordErrors.new}
                show={showNewPassword}
                setShow={setShowNewPassword}
                loading={isChangingPassword}
              />

              {/* Confirm Password */}
              <PasswordInput
                label="confirm"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={passwordErrors.confirm}
                show={false}
                setShow={() => {}}
                loading={isChangingPassword}
              />

              {/* Error message from API */}
              {passwordError && (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
                  <Text style={styles.errorBoxText}>{passwordError}</Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton, isChangingPassword && styles.updateButtonDisabled]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  memberText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
  statsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  signOutButton: {
    marginHorizontal: 16,
    backgroundColor: '#FF3B30',
    height: 52,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalClose: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textTransform: 'capitalize',
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
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF0F0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorBoxText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#FF3B30',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ProfileScreen;
