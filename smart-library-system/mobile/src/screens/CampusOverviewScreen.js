import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../components/UI';
import { COLORS } from '../constants';

const CampusOverviewScreen = () => {
  return (
    <ScreenWrapper>
      <Text style={styles.title}>Lumina Campus</Text>
      <Text style={styles.subtitle}>View campus resources, library hours, and access rules for Lumina campus.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Library hours</Text>
        <Text style={styles.cardDetail}>Mon - Fri: 7 AM - 10 PM</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Study lounges</Text>
        <Text style={styles.cardDetail}>Available now: 8 rooms</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Campus alert</Text>
        <Text style={styles.cardDetail}>Quiet hours start at 9 PM in the main reading hall.</Text>
      </View>
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  cardDetail: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
});

export default CampusOverviewScreen;
