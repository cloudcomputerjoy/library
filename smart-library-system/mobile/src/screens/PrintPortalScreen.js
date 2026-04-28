import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenWrapper, PrimaryButton } from '../components/UI';
import { COLORS } from '../constants';

const PrintPortalScreen = () => {
  const [colorMode, setColorMode] = useState('color');
  const [copies, setCopies] = useState(1);
  const [pageRange, setPageRange] = useState('all');
  const [duplex, setDuplex] = useState(true);

  return (
    <ScreenWrapper>
      <Text style={styles.title}>Print Services</Text>
      <Text style={styles.subtitle}>Upload your documents to the campus network and configure your output.</Text>

      <View style={styles.uploadArea}>
        <View style={styles.uploadIcon}>
          <MaterialIcons name="cloud-upload" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.uploadTitle}>Drag and drop your file</Text>
        <Text style={styles.uploadSubtitle}>PDF, DOCX, or JPG (Max 50MB)</Text>
        <PrimaryButton label="Browse Files" onPress={() => {}} style={styles.browseButton} />
      </View>

      <Text style={styles.sectionTitle}>Print Configurations</Text>

      <View style={styles.configGrid}>
        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Color Selection</Text>
          <View style={styles.colorRow}>
            <Pressable
              style={[styles.colorOption, colorMode === 'color' && styles.colorOptionActive]}
              onPress={() => setColorMode('color')}
            >
              <MaterialIcons name="palette" size={20} color={colorMode === 'color' ? COLORS.primary : COLORS.onSurfaceVariant} style={styles.colorIcon} />
              <Text style={[styles.colorText, colorMode === 'color' && styles.colorTextActive]}>Full Color</Text>
            </Pressable>
            <Pressable
              style={[styles.colorOption, colorMode === 'bw' && styles.colorOptionActive]}
              onPress={() => setColorMode('bw')}
            >
              <MaterialIcons name="contrast" size={20} color={colorMode === 'bw' ? COLORS.primary : COLORS.onSurfaceVariant} style={styles.colorIcon} />
              <Text style={[styles.colorText, colorMode === 'bw' && styles.colorTextActive]}>B&W</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Number of Copies</Text>
          <View style={styles.copiesRow}>
            <Pressable style={styles.copiesButton} onPress={() => setCopies(Math.max(1, copies - 1))}>
              <Text style={styles.copiesButtonText}>-</Text>
            </Pressable>
            <Text style={styles.copiesValue}>{copies.toString().padStart(2, '0')}</Text>
            <Pressable style={styles.copiesButton} onPress={() => setCopies(copies + 1)}>
              <Text style={styles.copiesButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Page Range</Text>
          <View style={styles.pageRangeRow}>
            <Pressable
              style={[styles.pageOption, pageRange === 'all' && styles.pageOptionActive]}
              onPress={() => setPageRange('all')}
            >
              <Text style={[styles.pageText, pageRange === 'all' && styles.pageTextActive]}>All Pages</Text>
            </Pressable>
            <Pressable
              style={[styles.pageOption, pageRange === 'custom' && styles.pageOptionActive]}
              onPress={() => setPageRange('custom')}
            >
              <Text style={[styles.pageText, pageRange === 'custom' && styles.pageTextActive]}>Custom</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.configCard}>
          <Text style={styles.configLabel}>Duplex Printing</Text>
          <View style={styles.duplexRow}>
            <View style={styles.duplexInfo}>
              <Text style={styles.duplexTitle}>Two-Sided</Text>
              <Text style={styles.duplexSubtitle}>Save paper, print on both sides</Text>
            </View>
            <Pressable style={styles.toggle} onPress={() => setDuplex(!duplex)}>
              <View style={[styles.toggleTrack, duplex && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, duplex && styles.toggleThumbActive]} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  uploadArea: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginBottom: 28,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 36,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  uploadSubtitle: {
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
  },
  browseButton: {
    width: 'auto',
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  configGrid: {
    gap: 12,
  },
  configCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
  },
  configLabel: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    gap: 8,
  },
  colorOptionActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  colorIcon: {
    marginRight: 8,
  },
  colorText: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
  colorTextActive: {
    color: COLORS.primary,
  },
  copiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  copiesButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiesButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  copiesValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  pageRangeRow: {
    gap: 12,
  },
  pageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
  },
  pageOptionActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
  },
  pageText: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
  pageTextActive: {
    color: COLORS.primary,
  },
  duplexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duplexInfo: {
    flex: 1,
  },
  duplexTitle: {
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  duplexSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  toggle: {
    padding: 4,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHighest,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    marginLeft: 2,
  },
  toggleThumbActive: {
    backgroundColor: COLORS.white,
    marginLeft: 22,
  },
});

export default PrintPortalScreen;

