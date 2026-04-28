import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenWrapper, PrimaryButton, SecondaryButton } from '../components/UI';
import { COLORS } from '../constants';

const BookDetailScreen = ({ route }) => {
  const book = route?.params?.book ?? {
    title: 'Meditations for the Digital Age',
    author: 'Marcus Aurelius',
    description:
      'A modern reinterpretation of classical philosophy with practical exercises and reflection prompts. Designed for academic readers balancing campus life and scholarly pursuits.',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAxIbwJJ3-LdIOTfemKTiEC7u71nXkfoCUojytTRRk_fsr1kfX1p5BZG3y1CI-24PTXLBdjIfaWoyD6uLfFSeLTqOKaDVcppsdrI6LrssVhoNA7Soq-uXCldclmJa9LD0maFoG7hwWsBYLpb-Oy6n-13kYQQOa4sONRTOFc3unbTqUAgCJp9zrthAeV09QNgi1rj_5aYgtjDLMlJrw58SwBwODeCy6OTUJnUA3uO6v-LyvBQ0v-iCwDzjAG-wjONfNZZQJzI9SHwIM',
    rating: '4.8',
    pages: '324',
    copies: '3',
  };

  return (
    <ScreenWrapper>
      <View style={styles.coverCard}>
        <Image source={{ uri: book.cover }} style={styles.coverImage} />
        <View style={styles.badgeRow}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>AI Curated</Text>
          </View>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={18} color="#fbbf24" />
            <Text style={styles.ratingText}>{book.rating}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>

      <View style={styles.actionRow}>
        <PrimaryButton label="Borrow" onPress={() => {}} style={styles.primaryButton} />
        <SecondaryButton label="Bookmark" onPress={() => {}} style={styles.secondaryButton} />
      </View>

      <Text style={styles.sectionHeading}>About this book</Text>
      <Text style={styles.description}>{book.description}</Text>

      <View style={styles.statsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pages</Text>
          <Text style={styles.metricValue}>{book.pages}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Copies</Text>
          <Text style={styles.metricValue}>{book.copies}</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  coverCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
  },
  coverImage: {
    width: '100%',
    height: 280,
  },
  badgeRow: {
    position: 'absolute',
    left: 18,
    top: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeContainer: {
    backgroundColor: 'rgba(138, 76, 252, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ratingText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  author: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 10,
  },
  description: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
  },
});

export default BookDetailScreen;
