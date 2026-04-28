import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/UI';
import { COLORS } from '../constants';

const ReturnHistoryScreen = () => {
  const [searchText, setSearchText] = useState('');

  const returnHistory = [
    {
      id: '1',
      title: 'The Republic',
      author: 'Plato',
      cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5NJf1iv-Enxs-4Yh7gJPjJBQXXbiXIsMbtiQyq6wwviNec8qZdNVsLrrUmu_gRECxBzppkbsT0LI-EEXmsX3U8CURcjx1mSgXTegLDWzDVD37c3Q0ZUzoH5aGTVxiiAt4nY59IlG47n4e6Cp9_rGmVU1qTje60c9oNN-3PYc8VP1rXiPTMr6q4g0pPczlFJdVASW2XVfWI_u3dyErG7ZeIAhbQ126ml2JnoJNq46bnTuWxQNIKVccBh3asa8mLO41kLJR9_3nU08',
      status: 'onTime',
      statusText: 'Returned On Time',
      condition: 'Good Condition',
      borrowedDate: '01 Oct 2023',
      returnedDate: '15 Oct 2023',
      fee: null
    },
    {
      id: '2',
      title: 'Beyond Good & Evil',
      author: 'Friedrich Nietzsche',
      cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbWFAUGYOLPFNXCT_FQvNFfpF_BQ99BY8-IqwlC5Dt5_Pul6758TrDsQVCc1SFqX864Rt46uPNEEwJEbzV78sFPTtiwZrZd1uH0_2jwz3Y0QjxXeDrXTJ0mDsL0CRKfdVrkKzmMoC__weiUQSNlInaPl3W045enzKBdZEG-sVQWF5RsTUkF2ZSsx9YeaXP309it4sOmOGy_oMBkixvfE-DtbyZmfbD30QfIF-pUmTHc2W1QwKHo1vdHt3h05fY3UGbjwAuZcyY7lQ',
      status: 'late',
      statusText: 'Returned Late',
      condition: 'Minor Damage',
      borrowedDate: '15 Sep 2023',
      returnedDate: '02 Oct 2023',
      fee: '৳80 Paid'
    },
    {
      id: '3',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZAzp3N-fBIeWRIbt8_5wGCz_PneMtsJflWrP0Iy43a7JgNqA_10vhwgfsSkefun3NxY3xlZ2aEd3HUmrrM9PRfafteNrxMZQBVvRVPShzO_6ndZqI4cooRmMGXdDYnuEF0ITbgWXw4qWE9_7E3KBXoJ4eTzLGLlny58U1mzW275RC1xIg7XstNoaeZqGC9kJc42nw2tBSacK3RHH7LPngK1JVfy3GPSR2iYwdXFrXHfuwvSFzuDd3i1T98I3xLEcoadFeoeyrDiM',
      status: 'onTime',
      statusText: 'Returned On Time',
      condition: 'Excellent Condition',
      borrowedDate: '01 Sep 2023',
      returnedDate: '22 Sep 2023',
      fee: null
    }
  ];

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Pressable style={styles.backButton}>
            <MaterialIcons name="arrow_back" size={24} color={COLORS.onSurface} style={styles.backIcon} />
          </Pressable>
          <View>
            <Text style={styles.topBarTitle}>Return History</Text>
            <Text style={styles.topBarSubtitle}>Your past returns and settled fees</Text>
          </View>
        </View>
        <Pressable style={styles.searchButton}>
          <MaterialIcons name="search" size={24} color={COLORS.primary} style={styles.searchIcon} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search & Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} style={styles.searchInputIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books by title or author"
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.onSurfaceVariant}
            />
          </View>
          <View style={styles.filterRow}>
            <Pressable style={styles.filterButton}>
              <MaterialIcons name="calendar_month" size={18} color={COLORS.onSurface} style={styles.filterIcon} />
              <Text style={styles.filterText}>Filter by Date</Text>
              <MaterialIcons name="expand_more" size={18} color={COLORS.onSurface} style={styles.expandIcon} />
            </Pressable>
            <Text style={styles.countText}>Showing 24 Returns</Text>
          </View>
        </View>

        {/* Return History List */}
        <View style={styles.historyList}>
          {returnHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.bookHeader}>
                <Image source={{ uri: item.cover }} style={styles.bookCover} />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{item.title}</Text>
                  <Text style={styles.bookAuthor}>{item.author}</Text>
                  <View style={styles.statusBadges}>
                    <View style={[styles.statusBadge, item.status === 'late' && styles.statusBadgeLate]}>
                      <MaterialIcons
                        name={item.status === 'late' ? 'warning' : 'check_circle'}
                        size={20}
                        color={item.status === 'late' ? COLORS.error : COLORS.success}
                        style={[styles.statusIcon, item.status === 'late' && styles.statusIconLate]}
                      />
                      <Text style={[styles.statusText, item.status === 'late' && styles.statusTextLate]}>
                        {item.statusText}
                      </Text>
                    </View>
                    <View style={styles.conditionBadge}>
                      <Text style={styles.conditionText}>{item.condition}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.bookFooter}>
                <View style={styles.datesSection}>
                  <MaterialIcons name="calendar_today" size={20} color={COLORS.primary} style={styles.calendarIcon} />
                  <View style={styles.dateColumns}>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateLabel}>Borrowed</Text>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{item.borrowedDate}</Text>
                      </View>
                    </View>
                    <View style={styles.dateColumn}>
                      <Text style={styles.dateLabel}>Returned</Text>
                      <View style={[styles.dateBadge, styles.dateBadgeReturn]}>
                        <Text style={styles.dateText}>{item.returnedDate}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.feeSection}>
                  {item.fee ? (
                    <View style={styles.feeBadge}>
                      <MaterialIcons name="receipt_long" size={18} color={COLORS.onSurfaceVariant} style={styles.feeIcon} />
                      <Text style={styles.feeText}>{item.fee}</Text>
                    </View>
                  ) : (
                    <View style={styles.noFeeSection}>
                      <MaterialIcons name="verified" size={18} color={COLORS.success} style={styles.verifiedIcon} />
                      <Text style={styles.noFeeText}>No Fees</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    flex: 1,
  },
  topBar: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  topBarTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    backgroundColor: COLORS.primary,
    backgroundImage: 'linear-gradient(90deg, #2563eb, #a855f7)',
    backgroundClip: 'text',
    color: 'transparent',
  },
  topBarSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 24,
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120,
  },
  searchSection: {
    marginBottom: 32,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  searchInputIcon: {
    fontSize: 20,
    color: COLORS.onSurfaceVariant,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  filterIcon: {
    fontSize: 18,
    color: COLORS.onSurface,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 18,
    color: COLORS.onSurface,
  },
  countText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  historyList: {
    gap: 20,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bookHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  bookCover: {
    width: 80,
    height: 112,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 18,
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 12,
  },
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.tertiaryContainer,
    opacity: 0.1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeLate: {
    backgroundColor: COLORS.errorContainer,
    opacity: 0.1,
  },
  statusIcon: {
    fontSize: 14,
    color: COLORS.tertiary,
  },
  statusIconLate: {
    color: COLORS.error,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontWeight: '700',
  },
  statusTextLate: {
    color: COLORS.error,
  },
  conditionBadge: {
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
  },
  datesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  calendarIcon: {
    fontSize: 18,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  dateColumns: {
    flexDirection: 'row',
    gap: 8,
  },
  dateColumn: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateBadgeReturn: {
    backgroundColor: '#faf5ff',
  },
  dateText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  feeSection: {
    alignItems: 'flex-end',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  feeIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },
  feeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  noFeeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    fontSize: 18,
    color: COLORS.tertiary,
  },
  noFeeText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontWeight: '700',
  },
});

export default ReturnHistoryScreen;
