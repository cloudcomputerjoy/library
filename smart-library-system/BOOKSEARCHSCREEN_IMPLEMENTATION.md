# BookSearchScreen Implementation - Complete Reference

**Status**: ✅ COMPLETE  
**Lines**: 800+ lines  
**Location**: `mobile/src/screens/BookSearchScreen.js`  
**Integration**: Supabase via booksAPI + categoriesAPI

---

## Overview

The BookSearchScreen provides users with a powerful search and discovery interface for library books. It integrates directly with the Supabase backend through API endpoints and includes advanced features like category filtering, pagination, availability status, and navigation to book issuance.

---

## Features

### 1. Search Functionality
- **Real-time search** by title, author, or ISBN
- **Search API integration**: `booksAPI.searchBooks(query, page, limit, sortBy)`
- **Submit triggers** via keyboard or manual button (optional)
- **Clear search** with X button to reset state

### 2. Category Filtering
- **Dynamic category loading** on screen mount via `categoriesAPI.getAll()`
- **Horizontal scrollable** category list
- **"All" category** button for full catalog view
- **Active state** highlighting for selected category
- **Category-based query**: `booksAPI.getByCategory(categoryId, page, limit)`

### 3. Book Display
- **Horizontal scrollable list** with book cards
- **Book information displayed**:
  - Title (2 lines max with ellipsis)
  - Author name
  - Category tag
  - Total copies available
  - Rating (if available from backend)
- **Availability badges**: ✅ Available (green) | ❌ Unavailable (red)
- **Book cover images** with placeholder icon fallback
- **Right arrow** icon for navigation

### 4. Pagination
- **Lazy loading** via `onEndReached` threshold (30% from bottom)
- **Intelligent page tracking** with `hasMorePages` flag
- **Smart loading meter** to prevent duplicate requests
- **Loading footer** indicator during pagination
- **First load** shows full loading spinner

### 5. Pull-to-Refresh
- **Refresh entire list** with pull gesture
- **Resets pagination** to page 1
- **Visual feedback** with refresh indicator
- **Triggered via**: `handleRefresh()`

### 6. Error Handling
- **Error banner** at top with retry option
- **Dismissible error** with close button
- **User-friendly messages** for all error scenarios:
  - Failed to load categories
  - Failed to load books
  - Network timeouts
  - Server errors (with original message)

### 7. Empty States
- **No search results**: "No books found" with helpful text
- **No initial books**: "Start searching" with instructions
- **Empty message icon** (book-search icon)
- **Subtitle** providing next steps

### 8. Navigation
- **Tap book card** → Navigate to IssueBooksDetail with:
  - Complete book object
  - Available copies information
- **Back button** → Return to Books tab
- **Profile/Settings links** → From other screens

---

## API Integration

### Endpoints Used

#### 1. Get All Categories
```javascript
GET /api/categories
Response: { success: true, data: [ { id, name }, ... ] }
Hook: categoriesAPI.getAll()
Usage: Load category dropdown on mount
```

#### 2. Search Books
```javascript
GET /api/books/search?q=query&page=1&limit=20&sortBy=relevance
Response: {
  success: true,
  data: [ { id, title, author, category, available, rating }, ... ],
  pagination: { page, limit, total, pages }
}
Hook: booksAPI.searchBooks(query, page, limit, sortBy)
Usage: When user enters search term
```

#### 3. Get Books by Category
```javascript
GET /api/books/category/:id?page=1&limit=20
Response: {
  success: true,
  data: [ { id, title, author, ... }, ... ],
  pagination: { page, limit, total, pages }
}
Hook: booksAPI.getByCategory(categoryId, page, limit)
Usage: When user selects category filter
```

#### 4. Get All Books (Default)
```javascript
GET /api/books?page=1&limit=20
Response: {
  success: true,
  data: [ { id, title, author, ... }, ... ],
  pagination: { page, limit, total, pages }
}
Hook: booksAPI.listBooks({}, page, limit)
Usage: Load default book list on mount
```

#### 5. Check Book Availability
```javascript
GET /api/books/:id/copies
Response: {
  success: true,
  data: { id, title, available_copies, total_copies, isAvailable }
}
Hook: booksAPI.getAvailableCopies(bookId)
Usage: Before navigating to issue screen
```

---

## State Management

### Local State Variables
```javascript
const [searchQuery, setSearchQuery] = useState('');           // Search terms
const [selectedCategory, setSelectedCategory] = useState('all'); // Filter
const [books, setBooks] = useState([]);                       // Book list
const [categories, setCategories] = useState([]);             // Category list
const [loading, setLoading] = useState(false);                // First load
const [refreshing, setRefreshing] = useState(false);          // Pull-to-refresh
const [error, setError] = useState(null);                     // Error message
const [page, setPage] = useState(1);                          // Current page
const [hasMorePages, setHasMorePages] = useState(true);       // Pagination flag
const [searchActive, setSearchActive] = useState(false);      // UI state
```

---

## Key Functions

### loadCategories()
Loads all categories on component mount
```javascript
const loadCategories = useCallback(async () => {
  try {
    const response = await categoriesAPI.getAll();
    const categoryList = response?.data || response || [];
    setCategories(categoryList);
  } catch (err) {
    setError('Failed to load categories');
  }
}, []);
```

### loadBooks(pageNum = 1, isSearch = false)
Smart book loading with search/filter logic
```javascript
- If searchQuery exists: Use searchBooks()
- Else if category selected: Use getByCategory()
- Else: Use listBooks()
- Handles pagination and error states
```

### handleSearch()
Submits search query and resets pagination
```javascript
- Clears previous results
- Sets page to 1
- Calls loadBooks(1, true)
- Dismisses search keyboard
```

### handleBoo​kPress(book)
Navigates to issue screen with availability check
```javascript
- Fetches available copies via API
- Validates availability
- Shows alert if unavailable
- Navigates with book + copy data
```

### handleRefresh()
Implements pull-to-refresh
```javascript
- Resets pagination
- Clears search (optional)
- Reloads first page
- Provides visual feedback
```

### loadMoreBooks()
Pagination handler for FlatList
```javascript
- Checks if more pages exist
- Checks if not already loading
- Loads next page incrementally
- Appends results to existing list
```

---

## UI Components

### Header
```
┌─────────────────────────┐
│ Search Books            │
└─────────────────────────┘
```
- Title with bold, large font
- White background with bottom border

### Error Banner (if error)
```
┌─────────────────────────┐
│ ⚠  Error message... ✕   │
└─────────────────────────┘
```
- Red background with white text
- Dismissible with X button
- Auto-hides on new search

### Search Bar
```
┌─────────────────────────┐
│ 🔍 Search title/author │ ✕ │
└─────────────────────────┘
```
- Magnifying glass icon
- Placeholder text
- Clear button (X) when text entered
- Keyboard with search button

### Category Filter
```
[ 📚 All ] [ Category1 ] [ Category2 ] ...
```
- Horizontal scrollable
- Pills/chips style
- Blue background = active
- Gray background = inactive

### Book Card
```
┌──────────────────────────────┐
│ 📖  │ Title Line 1             │ ➜
│     │ Title Line 2...          │
│ 70  │ Author Name              │
│ x   │ 📌 Category • 5 copies   │
│ 100 │ ⭐ 4.5 (234 reviews)     │
│     │                          │  ✓ Available
└──────────────────────────────┘
```
- Book cover/icon on left (70x100)
- Title, author, metadata on right
- Availability badge (bottom right)
- Chevron right icon on far right

### Empty State
```
         🔍
    No books found
    
Try different keywords or 
    browse by category
```
- Centered with icon
- Title and subtitle
- Only shown when results = empty

### Loading Footer
```
        ⟳ Loading...
```
- Appears during pagination
- Activity spinner
- Centered at bottom

---

## Styling

### Colors Used
- **Primary**: #007AFF (iOS blue)
- **Background**: #F5F5F5 (light gray)
- **Card**: #fff (white)
- **Success**: #34C759 (available - green)
- **Error**: #FF3B30 (unavailable - red)
- **Text Primary**: #000 (black)
- **Text Secondary**: #666 (gray)
- **Border**: #E5E5EA (light border)

### Typography
- **Header**: 24px, bold
- **Card Title**: 14px, bold
- **Card Author**: 12px, gray
- **Meta Text**: 11px, light gray
- **Category**: 13px, bold

### Dimensions
- **Header padding**: 16px horizontal, 12-16px vertical
- **Search bar**: 44px height, 8px border radius
- **Category pill**: 70px min width, 20px border radius
- **Book card**: Full width - 24px margins (12px per side)
- **Book cover**: 70x100 dp with 6px radius
- **Badge**: 6-12px padding, 4px radius

---

## Error Scenarios & Handling

| Error Scenario | Status Code | User Message | Recovery |
|---|---|---|---|
| Network timeout | - | Failed to load categories | Try again |
| API error | 400-500 | [API error message] | Dismiss banner |
| No results | 200 | No books found | Try different search |
| Category load fails | - | Failed to load categories | Page still usable (all books) |
| Book availability check fails | - | Failed to check availability | Retry or dismiss |
| Unknown error | - | [error.message] | Dismiss, try again |

---

## Navigation Flow

```
HomeStack
  ↓
BooksStack
  ├── BooksMain (BookSearchScreen)
  │   ├── [User Searches/Filters]
  │   ├── [Taps Book Card]
  │   └── Navigate to IssueBooksDetail ✓
  │
  └── IssueBooksDetail
      ├── Display book copies
      ├── Select copy & due date
      └── Issue book → Success Screen
```

---

## Performance Optimizations

1. **Pagination**: 20 items per page max
2. **Lazy Loading**: Load more at 30% threshold
3. **Image Lazy Loading**: Images only load on display
4. **Memoized Callbacks**: All callbacks use `useCallback`
5. **FlatList Optimization**: `keyExtractor`, `onEndReachedThreshold`
6. **Infinite Scroll**: Prevents duplicate requests with `hasMorePages` + `loading` check

---

## Testing Checklist

- [ ] Search loads with example query "history"
- [ ] Category filter loads from API
- [ ] Category selection filters results
- [ ] Pagination loads more books on scroll
- [ ] Pull-to-refresh resets and reloads
- [ ] Error banner displays and dismisses
- [ ] Empty state shown when no results
- [ ] Book availability checked before navigation
- [ ] Loading states prevent multiple requests
- [ ] Search clears category filter
- [ ] Category select clears search query

---

## Troubleshooting

### Books not loading
**Check**: 
- API endpoint `/api/books` is working
- Supabase connection is active
- Token is valid in auth store

**Fix**: Check network tab in DevTools, verify backend logs

### Categories empty
**Check**:
- API endpoint `/api/categories` is working
- Categories table exists in Supabase
- RLS policy allows read access

**Fix**: Verify categories exist in database

### Search not working
**Check**:
- Search query is not empty
- API accepts `q` parameter
- Backend search index is built

**Fix**: Test API directly: `GET /api/books/search?q=test`

### Pagination stuck
**Check**:
- `hasMorePages` state updates correctly
- Page number increments
- `loading` flag not stuck

**Fix**: Check console for API errors

---

## Future Enhancements

1. **Advanced Filters**: Author, publisher, language, year
2. **Sorting Options**: Relevance, newest, popular, rating
3. **Wishlist**: Save books for later
4. **Recently Viewed**: Track user history
5. **Reviews Display**: Show book ratings inline
6. **Book Details Modal**: Preview without navigation
7. **QR Code Search**: Scan to find books
8. **Online/Offline**: Sync when connection returns

---

## Files & Dependencies

**File**: `mobile/src/screens/BookSearchScreen.js`  
**Size**: 800+ lines  
**Imports**:
- React Native: View, ScrollView, TextInput, FlatList, Image, etc.
- Icon Library: MaterialCommunityIcons
- API: booksAPI, categoriesAPI from services/api.js
- Hooks: useState, useEffect, useCallback (all React)

**No External Packages Required** (All built-in with Expo)

---

**Example Usage in AppStack Navigation**:
```javascript
const BooksStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BooksMain" component={BookSearchScreen} />
    <Stack.Screen name="BookDetail" component={BookSearchScreen} />
    <Stack.Screen name="ReturnHistory" component={ReturnHistoryScreen} />
  </Stack.Navigator>
);
```

---

**Version**: 1.0  
**Created**: April 14, 2026  
**Last Updated**: April 14, 2026
