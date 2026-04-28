/**
 * Backend Integration Setup
 * Connects all frontend screens to Express backend + Supabase
 * Backend running: http://localhost:5000
 */

// ============================================================
// STEP 1: VERIFY ENVIRONMENT VARIABLES
// ============================================================

// In mobile/.env or mobile/app.json, ensure these exist:
// EXPO_PUBLIC_API_URL=http://192.168.1.117:5000/api  (or localhost:5000 for emulator)
// EXPO_PUBLIC_SUPABASE_URL=https://wwlcmewowcwsbeebalxh.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ============================================================
// STEP 2: IMPORT SERVICES IN SCREENS
// ============================================================

// Example in BookSearchScreen.js:
import { booksService } from '../services';

// Example in IssueBooks.js:
import { issuesService } from '../services';

// Example in PaymentFines.js:
import { paymentsService } from '../services';

// Example in ProfileScreen.js:
import { userService } from '../services';

// Example in NotificationsScreen.js:
import { notificationsService } from '../services';

// ============================================================
// STEP 3: USE SERVICES IN COMPONENTS
// ============================================================

// Authentication
const { user, session } = await supabaseAuthService.login(email, password);

// Books
const books = await booksService.searchBooks('fiction');
const bookDetail = await booksService.getBookDetail(bookId);
const featured = await booksService.getFeaturedBooks();

// Issues
const borrowed = await issuesService.getBorrowedBooks();
const issued = await issuesService.issueBook(bookId, copyId);
const history = await issuesService.getBorrowingHistory();

// Returns
const returned = await issuesService.returnBook(issueId);
const overdue = await issuesService.getOverdueBooks();

// Payments
const fines = await paymentsService.getUserFines();
const payment = await paymentsService.initiatePayment(amount);
const receipt = await paymentsService.getReceipt(paymentId);

// User
const profile = await userService.getUserProfile();
const prefs = await userService.getUserPreferences();

// Notifications
const notifs = await notificationsService.getNotifications();
const marked = await notificationsService.markAsRead(notifId);

// ============================================================
// STEP 4: ERROR HANDLING PATTERN
// ============================================================

try {
  const result = await booksService.searchBooks('query');
  // Use result
} catch (error) {
  // Error is automatically handled
  console.error(error.message);
  // Show user-friendly error message
}

// ============================================================
// STEP 5: LOADING STATES
// ============================================================

const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await booksService.searchBooks();
    setBooks(data.books);
  } finally {
    setLoading(false);
  }
};

// ============================================================
// STEP 6: PAGINATION
// ============================================================

const [page, setPage] = useState(1);

const loadMore = async () => {
  const result = await booksService.searchBooks('query', 'category', page + 1);
  if (result.hasMore) {
    setPage(page + 1);
    setBooks([...books, ...result.books]);
  }
};

// ============================================================
// STEP 7: TOKEN MANAGEMENT (AUTOMATIC)
// ============================================================

// No manual token handling needed!
// API client automatically:
// 1. Adds Bearer token to all requests
// 2. Refreshes token on 401 response
// 3. Stores tokens in AsyncStorage
// 4. Clears tokens on logout

// ============================================================
// STEP 8: REAL-TIME UPDATES (OPTIONAL)
// ============================================================

// Subscribe to real-time notifications
import { notificationsService } from '../services';

useEffect(() => {
  notificationsService.subscribeToNotifications((newNotif) => {
    setNotifications(prev => [newNotif, ...prev]);
  });
}, []);

// ============================================================
// TESTING CHECKLIST
// ============================================================

/*
✅ Backend Running
  - Terminal shows: "Smart Library Backend - Running Successfully"
  - Port: 5000
  - Database: Connected to Supabase

✅ API URLs Correct
  - Frontend: http://localhost:5000/api
  - Supabase: https://wwlcmewowcwsbeebalxh.supabase.co

✅ Services Imported
  - [ ] booksService in BookScreens
  - [ ] issuesService in Issue/ReturnScreens
  - [ ] paymentsService in PaymentScreens
  - [ ] userService in ProfileScreens
  - [ ] notificationsService in NotificationScreens

✅ Data Flows
  - [ ] Search books shows results
  - [ ] Issue book works
  - [ ] Return book works
  - [ ] View fines works
  - [ ] Update profile works
  - [ ] View notifications works

✅ Error Handling
  - [ ] Network errors show friendly messages
  - [ ] Invalid credentials show error
  - [ ] Missing fields show validation errors

✅ Loading States
  - [ ] Loading spinner shows while fetching
  - [ ] Spinner disappears when done
  - [ ] UI remains responsive
*/

export default {
  // This file is for documentation only
  // Import services directly in your screens
};
