import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/UI';
import { COLORS } from '../constants';

const EditPersonalDetailsScreen = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    fullName: 'Julian Thorne',
    academicEmail: 'j.thorne@campus.edu',
    contactNumber: '+1 (555) 012-3456',
    studentId: 'ST-2024-883',
    department: 'Cognitive Science',
    batch: '2024',
    semester: '4th',
    session: '2023-2024',
    membershipStatus: 'Senior Research Fellow',
  });

  const [filters, setFilters] = useState({
    departmentFilter: '',
    sessionFilter: '',
    batchFilter: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    // Apply filters to form if needed
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      departmentFilter: '',
      sessionFilter: '',
      batchFilter: '',
    });
  };

  return (
    <ScreenWrapper style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh1XoaYHC_9B5IDibuVeSvBlSGjdk10JVPKa9eJS31br7SX0cDF1X9eLvSSyBz-ZmGY-AFQdMee3AgYPc5aog_jQkV5YEKFyBibbr7--GgBqWhWo8DhQ1_p4PvjNmfWSfEUZBY2qq1tvalXf-_-ZyHH8yvvP0kXa_UBvJ05MBJushyjoCNqqkTaUGS457jDV170d0aOKfY5oJ811o4A-A2kRGKRwm1CgzbxBzg24s692OsA1VtR1OieKBbbd1TG748UyFjZfj2qNQ' }}
              style={styles.profileImage}
            />
            <Pressable style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color={COLORS.onPrimary} />
            </Pressable>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Julian Thorne</Text>
            <Text style={styles.profileId}>Research ID: TH-9921-X</Text>
          </View>
        </View>

        {/* Tab Switching System */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabButton, activeTab === 'personal' && styles.tabButtonActive]}
            onPress={() => setActiveTab('personal')}
          >
            <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
              PERSONAL
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'academic' && styles.tabButtonActive]}
            onPress={() => setActiveTab('academic')}
          >
            <Text style={[styles.tabText, activeTab === 'academic' && styles.tabTextActive]}>
              ACADEMIC
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'filters' && styles.tabButtonActive]}
            onPress={() => setActiveTab('filters')}
          >
            <Text style={[styles.tabText, activeTab === 'filters' && styles.tabTextActive]}>
              FILTERS
            </Text>
          </Pressable>
        </View>

        {/* Form Section */}
        {activeTab === 'personal' && (
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.inputField}
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Academic Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Academic Email</Text>
              <TextInput
                style={styles.inputField}
                value={formData.academicEmail}
                onChangeText={(value) => updateFormData('academicEmail', value)}
                placeholder="your.email@campus.edu"
                keyboardType="email-address"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.inputField}
                value={formData.contactNumber}
                onChangeText={(value) => updateFormData('contactNumber', value)}
                placeholder="+1 (555) 000-0000"
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>
          </View>
        )}

        {activeTab === 'academic' && (
          <View style={styles.formSection}>
            {/* Student ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student ID</Text>
              <TextInput
                style={styles.inputField}
                value={formData.studentId}
                onChangeText={(value) => updateFormData('studentId', value)}
                placeholder="Enter Student ID"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Department */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.inputField}
                value={formData.department}
                onChangeText={(value) => updateFormData('department', value)}
                placeholder="e.g. Cognitive Science"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Batch */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Batch</Text>
              <TextInput
                style={styles.inputField}
                value={formData.batch}
                onChangeText={(value) => updateFormData('batch', value)}
                placeholder="e.g. 2024"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Semester */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Semester</Text>
              <TextInput
                style={styles.inputField}
                value={formData.semester}
                onChangeText={(value) => updateFormData('semester', value)}
                placeholder="e.g. 4th"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Session */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Session</Text>
              <TextInput
                style={styles.inputField}
                value={formData.session}
                onChangeText={(value) => updateFormData('session', value)}
                placeholder="e.g. 2023-2024"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
            </View>

            {/* Membership Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Membership Status</Text>
              <View style={styles.selectContainer}>
                <TextInput
                  style={styles.inputField}
                  value={formData.membershipStatus}
                  onChangeText={(value) => updateFormData('membershipStatus', value)}
                  placeholder="Select membership status"
                  placeholderTextColor={COLORS.onSurfaceVariant}
                />
                <View style={styles.selectIcon}>
                  <MaterialIcons name="unfold_more" size={24} color={COLORS.onSurfaceVariant} />
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'filters' && (
          <View style={styles.formSection}>
            <Text style={styles.filterDescription}>
              Filter resources by department, session, and batch to find relevant content quickly.
            </Text>

            {/* Department Filter */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Filter by Department</Text>
              <TextInput
                style={styles.inputField}
                value={filters.departmentFilter}
                onChangeText={(value) => updateFilter('departmentFilter', value)}
                placeholder="e.g. Cognitive Science, Computer Science"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
              <Text style={styles.filterHelper}>Separate multiple departments with commas</Text>
            </View>

            {/* Session Filter */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Filter by Session</Text>
              <TextInput
                style={styles.inputField}
                value={filters.sessionFilter}
                onChangeText={(value) => updateFilter('sessionFilter', value)}
                placeholder="e.g. 2023-2024, 2024-2025"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
              <Text style={styles.filterHelper}>Separate multiple sessions with commas</Text>
            </View>

            {/* Batch Filter */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Filter by Batch</Text>
              <TextInput
                style={styles.inputField}
                value={filters.batchFilter}
                onChangeText={(value) => updateFilter('batchFilter', value)}
                placeholder="e.g. 2023, 2024"
                placeholderTextColor={COLORS.onSurfaceVariant}
              />
              <Text style={styles.filterHelper}>Separate multiple batches with commas</Text>
            </View>

            {/* Filter Action Buttons */}
            <View style={styles.filterButtonsContainer}>
              <Pressable 
                style={[styles.filterButton, styles.applyButton]}
                onPress={applyFilters}
              >
                <MaterialIcons name="check" size={20} color={COLORS.onPrimary} />
                <Text style={styles.filterButtonText}>Apply Filters</Text>
              </Pressable>
              <Pressable 
                style={[styles.filterButton, styles.resetButton]}
                onPress={resetFilters}
              >
                <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
                <Text style={[styles.filterButtonText, { color: COLORS.primary }]}>Reset</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionSection}>
          <Pressable style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
        </View>
      </ScrollView>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.onSurface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: COLORS.surfaceContainerLow,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.surface,
  },
  editIcon: {
    fontSize: 20,
    color: COLORS.onPrimary,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.onSurfaceVariant,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  formSection: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  inputField: {
    height: 56,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.onSurface,
  },
  selectContainer: {
    position: 'relative',
  },
  selectIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  selectIconText: {
    fontSize: 24,
    color: COLORS.onSurfaceVariant,
  },
  filterDescription: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
    lineHeight: 20,
  },
  filterHelper: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    fontStyle: 'italic',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
  resetButton: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onPrimary,
  },
  actionSection: {
    marginTop: 40,
    paddingBottom: 80,
  },
  saveButton: {
    height: 56,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.onPrimary,
  },
});

export default EditPersonalDetailsScreen;
