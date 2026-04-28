import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScreenWrapper, PrimaryButton, SectionCard } from '../components/UI';
import { COLORS, SCREEN_NAMES } from '../constants';

const FileSharingScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <Text style={styles.title}>File Sharing</Text>
      <Text style={styles.subtitle}>Upload documents, share assignments, and send research files to campus services.</Text>

      <SectionCard title="Upload files" description="Choose from your device or cloud storage." />
      <PrimaryButton label="Upload PDF" onPress={() => {}} />
      <PrimaryButton label="Upload Image" style={styles.uploadButton} onPress={() => {}} />

      <SectionCard title="Print services" description="Send documents to the print portal for pickup or delivery." />
      <Pressable style={styles.printLink} onPress={() => navigation.navigate(SCREEN_NAMES.Print)}>
        <Text style={styles.printLinkText}>Open print portal</Text>
      </Pressable>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 24,
  },
  uploadButton: {
    marginTop: 12,
  },
  printLink: {
    marginTop: 14,
  },
  printLinkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default FileSharingScreen;
