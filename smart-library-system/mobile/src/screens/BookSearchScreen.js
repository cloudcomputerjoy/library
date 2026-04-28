/**
 * Book Search Screen
 * Enables users to search and browse library books with filters
 * Integrates with booksService from backend
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { Text } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { booksService } from '../services';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BookSearchScreen = ({ navigation }) => {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('title');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Animation Values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    loadBooks();
  }, []);

  /**
   * Load all available categories
   */
  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      const categories = await booksService.getCategories();
      setCategories(categories);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    }
  }, []);

  /**
   * Load books with optional search and category filter
   */
  const loadBooks = useCallback(
    async (pageNum = 1, isSearch = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        }
        setError(null);

        let result;

        // Perform search if query exists
        if (searchQuery.trim()) {
          result = await booksService.searchBooks(searchQuery, selectedCategory !== 'all' ? selectedCategory : '', pageNum, 20);
        } else if (selectedCategory !== 'all') {
          // Filter by category if selected
          result = await booksService.getBooksByCategory(selectedCategory, pageNum, 20);
        } else {
          // Load featured books
          result = await booksService.getFeaturedBooks(20);
        }

        const newBooks = result?.books || result || [];
        const hasMore = result?.hasMore !== false;

        if (pageNum === 1) {
          setBooks(newBooks);
        } else {
          setBooks((prev) => [...prev, ...newBooks]);
        }

        setPage(pageNum);
        setHasMorePages(hasMore);
      } catch (err) {
        console.error('Error loading books:', err);
        setError(err.message || 'Failed to load books');
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory, sortBy, availableOnly]
  );

  const handleSearch = useCallback(() => {
    setPage(1);
    setHasMorePages(true);
    loadBooks(1);
  }, [loadBooks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks(1);
    setRefreshing(false);
  }, [loadBooks]);

  const applyFilters = () => {
    setShowFilters(false);
    handleSearch();
  };

  const loadMoreBooks = useCallback(() => {
    if (hasMorePages && !loading) {
      loadBooks(page + 1);
    }
  }, [page, hasMorePages, loading, loadBooks]);

  const renderBookItem = ({ item, index }) => {
    const isAvailable = item.available !== false && (item.available_copies > 0 || item.available_copies === undefined);
    
    return (
      <Animated.View style={styles.bookCardContainer}>
        <TouchableOpacity
          style={styles.bookCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BookDetail', { bookId: item.id, book: item })}
        >
          <View style={styles.bookCoverWrapper}>
            {item.coverImage || item.cover_image_url ? (
              <Image
                source={{ uri: item.coverImage || item.cover_image_url }}
                style={styles.bookCover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bookCoverPlaceholder}>
                <MaterialCommunityIcons name="book-open-variant" size={32} color={COLORS.primary || '#2563EB'} />
              </View>
            )}
            <View style={[styles.availabilityBadge, isAvailable ? styles.badgeAvailable : styles.badgeUnavailable]}>
              <Text style={styles.badgeText}>{isAvailable ? 'Available' : 'Issued'}</Text>
            </View>
          </View>

          <View style={styles.bookInfo}>
            <View style={styles.bookHeaderRow}>
              <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            
            <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
            
            <View style={styles.bookMetaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{item.category || item.categories?.name || 'General'}</Text>
              </View>
              {item.rating && (
                <View style={styles.ratingBox}>
                  <MaterialIcons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.bookFooter}>
              <Text style={styles.copiesText}>
                {item.available_copies ?? 1} of {item.total_copies ?? 1} copies left
              </Text>
              <View style={styles.actionBtn}>
                <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary || '#2563EB'} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background || '#F8F9FA'} />
      
      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }] }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity style={styles.profileBtn}>
            <MaterialIcons name="bookmarks" size={24} color={COLORS.onSurface || '#191C1D'} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={24} color={COLORS.onSurfaceVariant || '#434655'} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books, authors, ISBN..."
              placeholderTextColor={COLORS.outline || '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant || '#434655'} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
            <MaterialIcons name="tune" size={24} color={COLORS.onPrimary || '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Books' }, ...categories]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === item.id && styles.categoryPillActive,
              ]}
              onPress={() => {
                setSelectedCategory(item.id);
                setPage(1);
                loadBooks(1);
              }}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === item.id && styles.categoryPillTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={20} color={COLORS.error || '#FF3B30'} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Books List */}
      <Animated.FlatList
        data={books}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderBookItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onEndReached={loadMoreBooks}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary || '#2563EB'} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="book-search-outline" size={48} color={COLORS.primary || '#2563EB'} />
              </View>
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or filters to find what you're looking for.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loaderFooter}>
              <ActivityIndicator size="large" color={COLORS.primary || '#2563EB'} />
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.onSurface || '#191C1D'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptionsRow}>
              {['title', 'newest', 'popular'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterOptionBtn, sortBy === opt && styles.filterOptionBtnActive]}
                  onPress={() => setSortBy(opt)}
                >
                  <Text style={[styles.filterOptionText, sortBy === opt && styles.filterOptionTextActive]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Availability</Text>
            <View style={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[styles.filterOptionBtn, !availableOnly && styles.filterOptionBtnActive]}
                onPress={() => setAvailableOnly(false)}
              >
                <Text style={[styles.filterOptionText, !availableOnly && styles.filterOptionTextActive]}>All Books</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOptionBtn, availableOnly && styles.filterOptionBtnActive]}
                onPress={() => setAvailableOnly(true)}
              >
                <Text style={[styles.filterOptionText, availableOnly && styles.filterOptionTextActive]}>Available Only</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.resetBtn} 
                onPress={() => { setSortBy('title'); setAvailableOnly(false); }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: COLORS.background || '#F8F9FA',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface || '#191C1D',
    letterSpacing: -0.5,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerHighest || '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface || '#FFFFFF',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: COLORS.onSurface || '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.onSurface || '#191C1D',
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary || '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  categoriesWrapper: {
    paddingVertical: 12,
    backgroundColor: COLORS.background || '#F8F9FA',
    zIndex: 5,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant || '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: COLORS.onSurface || '#191C1D',
    borderColor: COLORS.onSurface || '#191C1D',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant || '#434655',
  },
  categoryPillTextActive: {
    color: COLORS.surface || '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  bookCardContainer: {
    marginBottom: 20,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: COLORS.onSurface || '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  bookCoverWrapper: {
    position: 'relative',
  },
  bookCover: {
    width: 90,
    height: 130,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHighest || '#E2E8F0',
  },
  bookCoverPlaceholder: {
    width: 90,
    height: 130,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer || '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.surface || '#FFFFFF',
  },
  badgeAvailable: {
    backgroundColor: COLORS.success || '#10B981',
  },
  badgeUnavailable: {
    backgroundColor: COLORS.error || '#EF4444',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'space-between',
  },
  bookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface || '#191C1D',
    lineHeight: 24,
    flex: 1,
  },
  bookAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant || '#434655',
    marginTop: 4,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  metaChip: {
    backgroundColor: COLORS.surfaceContainerLow || '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant || '#434655',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface || '#191C1D',
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  copiesText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary || '#2563EB',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer || '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderFooter: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryContainer || '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface || '#191C1D',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant || '#434655',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorContainer || '#FEE2E2',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  errorText: {
    color: COLORS.error || '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface || '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onSurface || '#191C1D',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface || '#191C1D',
    marginBottom: 12,
    marginTop: 10,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  filterOptionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow || '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterOptionBtnActive: {
    backgroundColor: COLORS.primaryContainer || '#DBEAFE',
    borderColor: COLORS.primary || '#2563EB',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant || '#434655',
  },
  filterOptionTextActive: {
    color: COLORS.primary || '#2563EB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  resetBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLow || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface || '#191C1D',
  },
  applyBtn: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BookSearchScreen;
