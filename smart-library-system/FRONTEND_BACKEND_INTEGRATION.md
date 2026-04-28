# Frontend-Backend Integration Guide

Complete guide for integrating the frontend components with Supabase backend APIs.

## Overview

The frontend is now fully connected to the Supabase backend through:
1. **API Service Layer** (`supabaseApi.js`) - All HTTP calls to backend
2. **Admin Context** (`AdminContextSupabase.js`) - State management with API integration
3. **Frontend Components** - 32 pre-built pages ready to use

## Quick Setup

### Step 1: Install Dependencies

```bash
cd admin
npm install axios
```

### Step 2: Configure Environment

Create `.env` file in `admin/` folder:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Update App.js

Replace the old AdminContext with the new Supabase version:

```javascript
// OLD
import { AdminProvider } from './context/AdminContext';

// NEW
import { AdminProvider } from './context/AdminContextSupabase';
```

### Step 4: Wrap App with Provider

```javascript
import AdminProvider from './context/AdminContextSupabase';

function App() {
  return (
    <AdminProvider>
      {/* Your routes here */}
    </AdminProvider>
  );
}
```

### Step 5: Start Backend

```bash
cd backend
npm start
# Should show: Server running on port 5000
```

## API Service Layer

### Location
`admin/src/services/supabaseApi.js`

### Structure

The service layer is organized by feature:

```javascript
// Dashboard
dashboardAPI.getStats()
dashboardAPI.getLiveFeed(limit)
dashboardAPI.getAnalytics(startDate, endDate)

// Users
usersAPI.getUsers(page, limit, filters)
usersAPI.getUser(userId)
usersAPI.createUser(userData)
usersAPI.updateUser(userId, userData)
usersAPI.deleteUser(userId)
usersAPI.bulkImportUsers(users)

// Books
booksAPI.getBooks(page, limit, filters)
booksAPI.getBook(bookId)
booksAPI.createBook(bookData)
booksAPI.updateBook(bookId, bookData)
booksAPI.deleteBook(bookId)
booksAPI.searchBooks(query, limit)
booksAPI.addBookCopies(bookId, count, shelfLocation)

// Transactions
transactionsAPI.getTransactions(page, limit, filters)
transactionsAPI.getTransaction(transactionId)
transactionsAPI.issueBook(userId, bookId, copyId, dueDate)
transactionsAPI.returnBook(transactionId, condition, remarks)

// Fines
finesAPI.getFines(page, limit, filters)
finesAPI.payFine(fineId, paymentMethod)
finesAPI.getUserFines(userId)

// Print Jobs
printJobsAPI.getPrintJobs(page, limit, filters)
printJobsAPI.getPrintJob(jobId)
printJobsAPI.approvePrintJob(jobId)
printJobsAPI.rejectPrintJob(jobId, reason)
printJobsAPI.markPrinting(jobId)
printJobsAPI.markReady(jobId)
printJobsAPI.markCollected(jobId)
printJobsAPI.getPrintStats()

// Support Tickets
supportAPI.getTickets(page, limit, filters)
supportAPI.getTicket(ticketId)
supportAPI.assignTicket(ticketId, assignedTo)
supportAPI.resolveTicket(ticketId, resolutionNotes)
supportAPI.closeTicket(ticketId)
supportAPI.reopenTicket(ticketId)
supportAPI.updatePriority(ticketId, priority)
supportAPI.getSupportStats()

// Settings
settingsAPI.getAllSettings()
settingsAPI.getSetting(key)
settingsAPI.updateSetting(key, value)
settingsAPI.updateBatchSettings(settings)
settingsAPI.getFineRules()
settingsAPI.updateFineRules(rules)
settingsAPI.getLibraryInfo()

// Reports
reportsAPI.getBooksIssuedReport(startDate, endDate)
reportsAPI.getAttendanceReport(startDate, endDate)
reportsAPI.getFinesReport(startDate, endDate)
reportsAPI.getPrintJobsReport(startDate, endDate)
reportsAPI.getUsersReport()
reportsAPI.getCustomReport(type, filters)
```

### Error Handling

```javascript
import { apiUtils } from './services/supabaseApi';

// Get user-friendly error message
try {
  await usersAPI.createUser(data);
} catch (error) {
  const message = apiUtils.getErrorMessage(error);
  console.error(message); // "User already exists" or generic error
}
```

## Admin Context with API Integration

### Location
`admin/src/context/AdminContextSupabase.js`

### Usage in Components

```javascript
import { useContext } from 'react';
import AdminContext from '../context/AdminContextSupabase';

function MyComponent() {
  const {
    users,
    loading,
    error,
    message,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
  } = useContext(AdminContext);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Add new user
  const handleAddUser = async (userData) => {
    try {
      await addUser(userData);
      // User added successfully, message will auto-display
    } catch (err) {
      // Error already set in context
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      {loading && <div>Loading...</div>}
      
      {/* Display users */}
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Available Context Methods

#### Dashboard
- `fetchDashboardStats()` - Get dashboard statistics
- `fetchLiveFeed(limit)` - Get recent activity

#### Users
- `fetchUsers(page, filters)` - List users with pagination
- `fetchUser(userId)` - Get single user details
- `addUser(userData)` - Create new user
- `updateUser(userId, userData)` - Update user
- `deleteUser(userId)` - Delete user
- `bulkImportUsers(usersData)` - Import multiple users

#### Books
- `fetchBooks(page, filters)` - List books with pagination
- `fetchBook(bookId)` - Get book with copies
- `searchBooks(query, limit)` - Search books
- `addBook(bookData)` - Create book
- `updateBook(bookId, bookData)` - Update book
- `deleteBook(bookId)` - Delete book
- `addBookCopies(bookId, count, shelfLocation)` - Add copies

#### Transactions
- `fetchTransactions(page, filters)` - List transactions
- `issueBook(userId, bookId, copyId, dueDate)` - Issue book to user
- `returnBook(transactionId, condition, remarks)` - Return book

#### Fines
- `fetchFines(page, filters)` - List fines with filtering
- `payFine(fineId, paymentMethod)` - Mark fine as paid

#### Print Jobs
- `fetchPrintJobs(page, filters)` - List print jobs
- `approvePrintJob(jobId)` - Approve print job
- `rejectPrintJob(jobId, reason)` - Reject print job

#### Support
- `fetchSupportTickets(page, filters)` - List tickets
- `assignTicket(ticketId, assignedTo)` - Assign ticket
- `resolveTicket(ticketId, notes)` - Resolve ticket

#### Settings
- `fetchSettings()` - Get all settings
- `updateSetting(key, value)` - Update single setting

### State Variables

```javascript
{
  // Data Arrays
  users,              // Array of users
  books,              // Array of books
  transactions,       // Array of transactions
  fines,              // Array of fines
  printJobs,          // Array of print jobs
  supportTickets,     // Array of support tickets
  
  // Single Items
  dashboardStats,     // Dashboard statistics object
  liveFeed,           // Recent activity array
  settings,           // Settings key-value object
  selectedUser,       // Currently selected user
  selectedBook,       // Currently selected book
  
  // Metadata
  loading,            // Boolean - API call in progress
  error,              // String - Error message (auto-clears after 5s)
  message,            // String - Success message (auto-clears after 3s)
  page,               // Current page number
  totalRecords,       // Total records available
}
```

## Component Integration Examples

### Example 1: User Management Page

```javascript
import React, { useContext, useEffect } from 'react';
import AdminContext from '../context/AdminContextSupabase';

export default function UserManagementPage() {
  const {
    users,
    loading,
    error,
    message,
    page,
    totalRecords,
    fetchUsers,
    addUser,
    deleteUser,
  } = useContext(AdminContext);

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      roll_number: formData.get('roll_number'),
      user_type: 'student',
    };
    
    try {
      await addUser(userData);
      e.target.reset();
    } catch (err) {
      // Error already displayed
    }
  };

  return (
    <div className="container">
      {message && (
        <div className="alert alert-success">{message}</div>
      )}
      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <form onSubmit={handleAddUser}>
        <input name="name" placeholder="Full Name" required />
        <input name="email" placeholder="Email" required />
        <input name="roll_number" placeholder="Roll Number" />
        <button type="submit" disabled={loading}>Add User</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Example 2: Dashboard Page

```javascript
import React, { useContext, useEffect } from 'react';
import AdminContext from '../context/AdminContextSupabase';

export default function DashboardPage() {
  const {
    dashboardStats,
    liveFeed,
    loading,
    fetchDashboardStats,
    fetchLiveFeed,
  } = useContext(AdminContext);

  useEffect(() => {
    fetchDashboardStats();
    fetchLiveFeed(20);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{dashboardStats?.total_users || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Books</h3>
          <p>{dashboardStats?.total_books || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Books Issued</h3>
          <p>{dashboardStats?.books_issued || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Fines</h3>
          <p>${dashboardStats?.pending_fines || 0}</p>
        </div>
      </div>

      <div className="live-feed">
        <h3>Recent Activity</h3>
        {liveFeed.map(item => (
          <div key={item.id} className="feed-item">
            {item.description}
            <small>{new Date(item.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Issue Book Page

```javascript
import React, { useContext, useState, useEffect } from 'react';
import AdminContext from '../context/AdminContextSupabase';

export default function IssueBookPage() {
  const {
    users,
    books,
    loading,
    error,
    message,
    fetchUsers,
    fetchBooks,
    issueBook,
  } = useContext(AdminContext);

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedCopy, setSelectedCopy] = useState('');

  useEffect(() => {
    fetchUsers(1);
    fetchBooks(1);
  }, []);

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      await issueBook(selectedUser, selectedBook, selectedCopy);
      // Reset form
      setSelectedUser('');
      setSelectedBook('');
      setSelectedCopy('');
    } catch (err) {
      // Error already displayed
    }
  };

  const bookCopies = books.find(b => b.id === selectedBook)?.copies || [];

  return (
    <form onSubmit={handleIssueBook}>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        required
      >
        <option value="">Select User</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>

      <select
        value={selectedBook}
        onChange={(e) => setSelectedBook(e.target.value)}
        required
      >
        <option value="">Select Book</option>
        {books.map(b => (
          <option key={b.id} value={b.id}>{b.title}</option>
        ))}
      </select>

      <select
        value={selectedCopy}
        onChange={(e) => setSelectedCopy(e.target.value)}
        required
        disabled={!selectedBook}
      >
        <option value="">Select Copy</option>
        {bookCopies.map(c => (
          <option key={c.id} value={c.id}>
            Copy {c.serial_number} - {c.shelf_location}
          </option>
        ))}
      </select>

      <button type="submit" disabled={loading}>Issue Book</button>
    </form>
  );
}
```

## Common Patterns

### Pattern 1: Fetch Data on Component Mount

```javascript
useEffect(() => {
  fetchUsers(1); // page 1, default 20 items per page
}, [fetchUsers]); // Add function as dependency
```

### Pattern 2: Handle Pagination

```javascript
const handleNextPage = () => {
  fetchUsers(page + 1);
};

const handlePreviousPage = () => {
  if (page > 1) {
    fetchUsers(page - 1);
  }
};
```

### Pattern 3: Apply Filters

```javascript
const handleFilter = (filters) => {
  fetchUsers(1, filters); // Reset to page 1 when filtering
};

// Example filters:
handleFilter({
  user_type: 'student',
  department: 'CSE',
  status: 'active'
});
```

### Pattern 4: Show/Hide Loading State

```javascript
{loading && (
  <div className="spinner">Loading...</div>
)}
{!loading && (
  <YourContent />
)}
```

### Pattern 5: Display Messages

```javascript
{error && (
  <div className="alert alert-danger" role="alert">
    {error}
    <button onClick={() => setError(null)}>Dismiss</button>
  </div>
)}

{message && (
  <div className="alert alert-success" role="alert">
    {message}
  </div>
)}
```

## API Response Format

All API responses follow this format:

```javascript
{
  "success": true,
  "data": [...], // or single object for detail endpoints
  "total": 100, // for list endpoints
  "message": "Operation successful"
}
```

## Error Handling

The API automatically handles errors:

1. **401 Unauthorized** - Redirects to login (token invalid)
2. **403 Forbidden** - Shows "You do not have permission"
3. **404 Not Found** - Shows "Resource not found"
4. **500 Server Error** - Shows "Server error. Please try again"
5. **Network Error** - Shows connection error message

All error messages are automatically cleared after 5 seconds.

## Filters Available

### User Filters
```javascript
{
  user_type: 'student', // or 'faculty', 'librarian', 'admin'
  status: 'active', // or 'inactive', 'suspended'
  department: 'CSE'
}
```

### Book Filters
```javascript
{
  status: 'available', // or 'issued', 'lost', 'damaged'
  category: 'Fiction',
  department: 'CSE'
}
```

### Transaction Filters
```javascript
{
  status: 'issued', // or 'returned', 'overdue'
  user_id: 'uuid...',
  book_id: 'uuid...'
}
```

### Fine Filters
```javascript
{
  status: 'pending', // or 'paid', 'waived'
  min_amount: 100,
  max_amount: 1000
}
```

### Print Job Filters
```javascript
{
  status: 'pending', // or 'approved', 'printing', 'ready', 'collected'
  user_id: 'uuid...'
}
```

### Support Ticket Filters
```javascript
{
  status: 'open', // or 'in_progress', 'resolved', 'closed'
  priority: 'high', // or 'medium', 'low'
  assigned_to: 'admin_id'
}
```

## Authentication

Token is automatically managed:

```javascript
// Login (in your login component)
const token = response.data.token;
apiUtils.setAuthToken(token);

// Token automatically added to all requests
// Token removed on 401 response

// Manual token management
const token = apiUtils.getAuthToken();
const isAuth = apiUtils.isAuthenticated();
apiUtils.clearAuthToken();
```

## Troubleshooting

### Issue: "Cannot find module 'axios'"
**Solution**: Run `npm install axios` in admin folder

### Issue: "Failed to fetch" errors
**Solution**: Ensure backend is running (`npm start` in backend folder)

### Issue: API returns 401 Unauthorized
**Solution**: User session expired, need to login again

### Issue: CORS errors
**Solution**: Backend already configured with CORS, check API_BASE_URL in .env

### Issue: Data not updating after mutation
**Solution**: Context functions automatically refetch data, just wait for loading to complete

## Next Steps

1. **Update all existing pages** to use the new API service
2. **Replace hardcoded data** with API calls from context
3. **Test all endpoints** using Postman or similar tool
4. **Add loading spinners** while data is being fetched
5. **Add error boundaries** for better error handling
6. **Implement authentication** flow with login page

## File Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Sidebar.js
│   │   └── ...
│   ├── context/
│   │   ├── AdminContext.js (OLD - keep for reference)
│   │   └── AdminContextSupabase.js (NEW - use this)
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── UserManagement.js
│   │   └── ...
│   ├── services/
│   │   └── supabaseApi.js (NEW - all API calls)
│   ├── App.js (UPDATE - use new context)
│   └── index.js
├── .env (CREATE - add REACT_APP_API_URL)
└── package.json
```

## Debugging

Enable debug logging:

```javascript
// In supabaseApi.js, add before requests:
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', config.method.toUpperCase(), config.url);
  return config;
});

apiClient.interceptors.response.use((response) => {
  console.log('API Response:', response.status, response.data);
  return response;
});
```

## Performance Tips

1. **Pagination**: Always use pagination for large lists
2. **Filters**: Apply filters instead of fetching all data
3. **Caching**: Use context state to avoid refetching same data
4. **Lazy Loading**: Load data only when needed
5. **Batch Operations**: Use bulk import for multiple users

## Security Notes

- Never store passwords in frontend
- Token stored in localStorage (secure in production with httpOnly cookies)
- All mutations require proper authentication
- Backend validates all operations server-side
- Audit logging on all changes

---

## Complete Integration Checklist

- [ ] Install axios: `npm install axios`
- [ ] Create `.env` file with REACT_APP_API_URL
- [ ] Update App.js to use AdminContextSupabase
- [ ] Ensure backend is running on port 5000
- [ ] Test GET endpoint: http://localhost:5000/api/admin/dashboard/stats
- [ ] Update first page to use new API service
- [ ] Verify data loads and displays correctly
- [ ] Test CRUD operations (Create, Read, Update, Delete)
- [ ] Add error handling to all pages
- [ ] Test pagination on list pages
- [ ] Add loading states to all async operations
- [ ] Test all 13 admin pages with backend
- [ ] Set up authentication flow
- [ ] Deploy frontend and backend

---

**Support**: Check backend logs for detailed error information if API calls fail.
