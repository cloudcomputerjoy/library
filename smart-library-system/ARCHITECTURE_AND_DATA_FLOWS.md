# Architecture & Data Flow Diagrams

---

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (React Native)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      UI SCREENS                              │  │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │  │
│  │ │ SignUp       │ │ BookSearch   │ │ Return       │ ...     │  │
│  │ │ Screen       │ │ Screen       │ │ Books        │         │  │
│  │ └──────────────┘ └──────────────┘ └──────────────┘         │  │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │  │
│  │ │ BookDetail   │ │ PaymentFines │ │ Profile      │ ...     │  │
│  │ │ Screen       │ │ Screen       │ │ Screen       │         │  │
│  │ └──────────────┘ └──────────────┘ └──────────────┘         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                       │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SERVICES LAYER                            │  │
│  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │  │
│  │ │ booksService │ │issuesService │ │paymentsServ. │         │  │
│  │ └──────────────┘ └──────────────┘ └──────────────┘         │  │
│  │ ┌──────────────┐ ┌──────────────┐                          │  │
│  │ │ userService  │ │notifService  │ ...                      │  │
│  │ └──────────────┘ └──────────────┘                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                       │
│                              │                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         HTTP CLIENT (api.js - Axios)                        │  │
│  │  • Base URL: http://192.168.1.117:5000/api                  │  │
│  │  • Auth Interceptor: Adds Bearer token                      │  │
│  │  • Error Interceptor: Handles 401 refresh                   │  │
│  │  • Headers: Content-Type, X-Client-Info                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ▲                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                   ┌───────────┴──────────────┐
                   ▼                          ▼
         ┌──────────────────────┐  ┌──────────────────────┐
         │   BACKEND SERVER     │  │ SUPABASE DATABASE    │
         │  (Node.js/Express)   │  │  (PostgreSQL)        │
         ├──────────────────────┤  ├──────────────────────┤
         │ Routes:              │  │ Tables:              │
         │ • /auth              │  │ • users              │
         │ • /books             │  │ • books              │
         │ • /issues            │  │ • book_copies        │
         │ • /payments          │  │ • issues             │
         │ • /users             │  │ • returns            │
         │ • /notifications     │  │ • payments           │
         │                      │  │ • fines              │
         │ Controllers:         │  │ • reviews            │
         │ • Auth Logic         │  │ • transactions       │
         │ • Business Logic     │  │                      │
         │ • Validation         │  │ Supabase Auth:       │
         │ • Error Handling     │  │ • JWT tokens         │
         └──────────────────────┘  │ • User sessions      │
                                   └──────────────────────┘
```

---

## 2. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SIGN UP & LOGIN FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

SIGN UP:
┌──────────────┐      ┌────────────────┐      ┌──────────────┐
│ SignupScreen │─────>│ useRegister()  │─────>│ Backend      │
│              │      │ hook           │      │ /auth/reg    │
└──────────────┘      └────────────────┘      └──────────────┘
      ▲                                               │
      │                                               │
      │                            ┌──────────────────┘
      │                            ▼
      │                    ┌──────────────────┐
      │                    │ Supabase         │
      │                    │ Create User      │
      │                    └──────────────────┘
      │                            │
      │      ┌─────────────────────┘
      │      ▼
      │ ┌────────────────────────┐
      │ │ Return:                │
      │ │ • user                 │
      │ │ • token (JWT)          │
      │ │ • refreshToken         │
      └─┤                        │
        └────────────────────────┘
                │
                ▼
        ┌──────────────────────┐
        │ Store in AsyncStorage│
        │ • userToken          │
        │ • refreshToken       │
        └──────────────────────┘
                │
                ▼
        ┌──────────────────────┐
        │ Navigate to HomeScreen
        └──────────────────────┘


LOGIN:
┌──────────────┐      ┌────────────┐      ┌──────────────┐
│ LoginScreen  │─────>│ useLogin() │─────>│ Backend      │
│              │      │ hook       │      │ /auth/login  │
└──────────────┘      └────────────┘      └──────────────┘
      ▲                                           │
      │                                           ▼
      │                          ┌────────────────────────┐
      │                          │ Verify Credentials     │
      │                          │ & Return Token         │
      │                          └────────────────────────┘
      │                                           │
      │      ┌────────────────────────────────────┘
      └──────┤ Store tokens & Navigate to Home


PROTECTED API CALLS:
┌─────────────────────────────────────────────────────────────┐
│ Any Service Function (e.g., booksService.searchBooks())    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ apiClient.get('/books')           │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ Request Interceptor               │
        │ 1. Get token from AsyncStorage    │
        │ 2. Add: Authorization: Bearer X   │
        │ 3. Send request                   │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │ Backend Verifies Token            │
        │ & Authenticates User              │
        └───────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    ▼                ▼
            ┌─────────────┐  ┌───────────────┐
            │ 200 OK      │  │ 401 Expired   │
            │ Return data │  │ Token         │
            └─────────────┘  └───────────────┘
                │                    │
                │            ┌───────┴────────┐
                │            ▼                │
                │     Response Interceptor:  │
                │     1. Get refreshToken    │
                │     2. POST /auth/refresh  │
                │     3. Save new token      │
                │     4. Retry original call │
                │ (or redirect to login)     │
                │            │               │
                └────────────┼───────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Return to caller │
                    └──────────────────┘
```

---

## 3. Book Search & Issue Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOOK SEARCH FLOW                              │
└─────────────────────────────────────────────────────────────────┘

USER INTERACTION:
┌──────────────────┐
│ User enters      │
│ search term      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ BookSearchScreen.useState()              │
│ setSearchQuery(term)                     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ useEffect() triggered by searchQuery     │
│ change (debounced to 300ms)              │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ booksService.searchBooks(query, cat, pg) │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ GET /api/books?                          │
│   search=harry+potter                    │
│   category=fiction                       │
│   page=1&limit=10                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend Controller:                      │
│ 1. Validate params                       │
│ 2. Query Supabase                        │
│ 3. Count total matches                   │
│ 4. Calculate pagination                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Return:                                  │
│ {                                        │
│   books: [{id, title, author, ...}],    │
│   totalCount: 42,                        │
│   page: 1,                               │
│   hasMore: true                          │
│ }                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ setBooks(result.books)                   │
│ setHasMore(result.hasMore)               │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Render FlatList with books               │
└──────────────────────────────────────────┘


BOOK DETAIL & ISSUE:
┌───────────────────────────┐
│ User taps book in list    │
└────────┬──────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Navigate to BookDetailScreen(bookId)   │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ useEffect() on component mount           │
│ booksService.getBookDetail(bookId)       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ GET /api/books/:id                       │
│ Returns: {book, copies[], availability}  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Render book details with               │
│ "Borrow" button                         │
└────────┬─────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ User taps "Borrow" button              │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ issuesService.issueBook(bookId, copyId)  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/issues/issue-book              │
│ Body: {bookId, copyId}                   │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend:                                 │
│ 1. Verify user authenticated             │
│ 2. Check book available                  │
│ 3. Create issue record                   │
│ 4. Update copy status: issued            │
│ 5. Calculate due date (14 days)          │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Return: {issue, dueDate, finePerDay}     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Show success confirmation:               │
│ "Book issued! Due: MM/DD/YYYY"           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Navigate to IssuedBooksScreen            │
│ or refresh borrowed books list           │
└──────────────────────────────────────────┘
```

---

## 4. Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  PAYMENT FLOW                                │
└──────────────────────────────────────────────────────────────┘

LOAD FINES:
┌──────────────────┐
│ PaymentFines     │
│ Screen mounted   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ paymentsService.getUserFines()           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ GET /api/payments/fines                  │
│ (Auth required: Bearer token)            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend calculates fines:                │
│ For each overdue issue:                  │
│   daysOverdue = today - dueDate          │
│   fine = daysOverdue * finePerDay        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Return: {                                │
│   fines:[{id, amount, book}],            │
│   totalAmount: $XX,                      │
│   breakdown: {byIssue}                   │
│ }                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Display fines list:                      │
│ ✓ Book name & issue date                 │
│ ✓ Fine amount                            │
│ ✓ Checkbox to select                     │
│ ✓ Total amount sum                       │
└────────┬─────────────────────────────────┘


SELECT & PAY:
┌──────────────────────────┐
│ User selects fines       │
│ & chooses payment method │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User taps "Pay Now" button               │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ paymentsService.initiatePayment(         │
│   fineIds: [1,2,3],                      │
│   method: 'bKash'                        │
│ )                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/payments/initiate              │
│ Body: {fineIds, method}                  │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend:                                 │
│ 1. Calculate total amount                │
│ 2. Create transaction record             │
│ 3. Generate payment link/session         │
│ 4. Return transactionId & URL            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Return: {                                │
│   transactionId: 'TXN123',               │
│   amount: $42.50,                        │
│   checkoutUrl: 'https://...'             │
│ }                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Open payment URL in WebView/Browser      │
│ (bKash/Nagad/Stripe checkout)            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ User completes payment on provider       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Payment provider returns to app with:    │
│ • Provider transaction ID                │
│ • Status: success/failed                 │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ paymentsService.verifyPayment(           │
│   transactionId: 'TXN123',               │
│   provider: 'bKash',                     │
│   providerTransactionId: 'BKX789'        │
│ )                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/payments/verify                │
│ Body: {transactionId, provider, provTxn}│
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Backend:                                 │
│ 1. Verify with provider API              │
│ 2. Mark transaction as paid              │
│ 3. Clear fines from system               │
│ 4. Send receipt to user email            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Return: {                                │
│   payment: {...},                        │
│   receipt: {...},                        │
│   finesCleared: true                     │
│ }                                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Show success screen:                     │
│ ✓ Payment confirmed                      │
│ ✓ Receipt download button                │
│ ✓ Total amount paid badge                │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Refresh user profile:                    │
│ • Reset fine amount to $0                │
│ • Update transaction history             │
└──────────────────────────────────────────┘
```

---

## 5. Service Call Dependencies

```
Screen Components
    ├─ SignupScreen
    │  └─ useRegister()
    │      └─ supabaseAuthService.register()
    │
    ├─ BookSearchScreen
    │  └─ booksService.searchBooks()
    │      └─ GET /api/books
    │
    ├─ BookDetailScreen
    │  ├─ booksService.getBookDetail()
    │  │  └─ GET /api/books/:id
    │  ├─ booksService.bookmarkBook()
    │  │  └─ POST /api/users/bookmarks
    │  └─ issuesService.issueBook()
    │     └─ POST /api/issues/issue-book
    │
    ├─ ReturnBooksScreen
    │  ├─ issuesService.getBorrowedBooks()
    │  │  └─ GET /api/issues/active
    │  └─ issuesService.returnBook()
    │     └─ POST /api/issues/return-book
    │
    ├─ PaymentFinesScreen
    │  ├─ paymentsService.getUserFines()
    │  │  └─ GET /api/payments/fines
    │  ├─ paymentsService.initiatePayment()
    │  │  └─ POST /api/payments/initiate
    │  └─ paymentsService.verifyPayment()
    │     └─ POST /api/payments/verify
    │
    ├─ ProfileScreen
    │  ├─ userService.getUserProfile()
    │  │  └─ GET /api/users/profile
    │  └─ userService.updateUserProfile()
    │     └─ PUT /api/users/profile
    │
    └─ NotificationsScreen
       ├─ notificationsService.getNotifications()
       │  └─ GET /api/notifications
       ├─ notificationsService.markAsRead()
       │  └─ PUT /api/notifications/:id/read
       └─ notificationsService.deleteNotification()
          └─ DELETE /api/notifications/:id
```

---

## 6. Data Flow: Complete Transaction

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPLETE USER FLOW: Sign Up → Search → Borrow → Return → Pay   │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ 1. SIGN UP      │
│ New user        │
│ registers       │
└────────┬────────┘
         │
    POST /auth/register
    (email, password, name, phone)
         │
         ▼
    ┌──────────────────┐
    │ Supabase creates │
    │ user account     │
    └────────┬─────────┘
             │
          Returns
       (user, tokens)
             │
         ┌───▼────────────────────┐
         │ Store in AsyncStorage  │
         │ • userToken            │
         │ • refreshToken         │
         └────────┬───────────────┘
                  │
         ┌────────▼──────────────┐
         │ Auth headers set up   │
         │ for all API calls     │
         └────────┬──────────────┘
         
         
┌─────────────────┐       2. SEARCH BOOKS
│ Go to Search    │
│ Enter: "Harry"  │
└────────┬────────┘
         │
    GET /api/books?search=harry&page=1&limit=10
         │
         ▼
    Backend queries:
    WHERE title LIKE '%harry%'
    OR author LIKE '%harry%'
         │
         ▼
    Returns: [
       {id:1, title:"Harry Potter", copies: 3},
       {id:2, title:"Harry...", copies: 1}
    ]
         │
         ▼
    Display results
    [user sees books]


┌─────────────────┐       3. TAP BOOK DETAIL
│ User taps book  │
│ "Harry Potter"  │
└────────┬────────┘
         │
    GET /api/books/1
         │
         ▼
    Backend returns:
    {
      book: {...full details},
      copies: [...available copies],
      availability: {available: 3, issued: 2}
    }
         │
         ▼
    Display with info:
    • Cover image
    • Description
    • Rating
    • Available copies
    • "Borrow" button


┌─────────────────┐       4. ISSUE BOOK
│ User taps       │
│ "Borrow"        │
└────────┬────────┘
         │
    POST /api/issues/issue-book
    {bookId: 1, copyId: 5}
         │
         ▼
    Backend:
    1. Check copy available
    2. Create issue record
    3. Update copy: issued
    4. Set due_date = today + 14
    5. Return data
         │
         ▼
    {issue:{id:100}, dueDate:"2026-05-01"}
         │
         ▼
    Show confirmation:
    "Book issued! Due: May 1, 2026"
    Redirect to IssuedBooks


┌─────────────────┐       5. CHECK BORROWED BOOKS
│ User goes to    │
│ IssuedBooks     │
│ Screen          │
└────────┬────────┘
         │
    GET /api/issues/active
         │
         ▼
    Backend returns:
    Active issues for user:
    [{book, copy, dueDate, status}]
         │
         ▼
    Display list:
    • Book title & cover
    • Due date
    • Days remaining
    • Fine amount (if overdue)
    • Return button


┌─────────────────┐       6. RETURN BOOK
│ User taps       │
│ "Return" button │
└────────┬────────┘
         │
    POST /api/issues/return-book
    {issueId: 100, condition: "good"}
         │
         ▼
    Backend:
    1. Check if overdue
    2. Calculate fine (if any)
    3. Update copy: available
    4. Close issue record
         │
         ▼
    {return:{...}, fineAmount: 0}
         │
         ▼
    Show "Book returned successfully"


┌─────────────────┐       7. OVERDUE SCENARIO
│ Time passes...  │
│ Book overdue    │
│ User re-opens   │
│ app             │
└────────┬────────┘
         │
    GET /api/issues/active
    (or Notification arrives)
         │
         ▼
    Issue marked: overdue
    Fine calculated: $5/day × 3 days = $15
         │
         ▼
    Display in app:
    !!! OVERDUE
    " Return immediately!"
    "Fine: $15"
    "Return" button


┌─────────────────┐       8. FINALLY RETURN
│ User taps       │
│ "Return" button │
└────────┬────────┘
         │
    POST /api/issues/return-book
    {issueId: 100, condition: "good"}
         │
         ▼
    Backend:
    1. Issue overdue: true
    2. Fine record created: $15
    3. Issue closed
         │
         ▼
    {return:{...}, fineAmount: 15}
         │
         ▼
    Alert: "Book returned"
    "Fine: $15 (overdue fees)"


┌─────────────────┐       9. PAY FINE
│ User goes to    │
│ Payments screen │
└────────┬────────┘
         │
    GET /api/payments/fines
         │
         ▼
    Returns: {
      fines: [{amount: 15, ...}],
      totalAmount: 15
    }
         │
         ▼
    Display fine details
    User selects & taps "Pay Now"
         │
         │
    POST /api/payments/initiate
    {fineIds: [1], method: "bKash"}
         │
         ▼
    {transactionId:"TXN1", checkoutUrl:"..."}
         │
         ▼
    Open bKash payment page
    User enters PIN, confirms
    Payment succeeds
         │
         ▼
    POST /api/payments/verify
    {transactionId:"TXN1", provider:"bKash", provId:"BK123"}
         │
         ▼
    Backend:
    1. Verify with bKash
    2. Mark payment: success
    3. Clear fines
    4. Send receipt email
         │
         ▼
    {payment:{...}, finesCleared: true}
         │
         ▼
    Alert: "Payment successful!"
    GET /api/users/profile
    (refresh: fines now $0)
    
✅ COMPLETE TRANSACTION CYCLE DONE
```

---

## Notes

- All flows show the happy path; error handling should redirect appropriately
- Timestamps are automatically managed by Supabase
- JWT tokens expire and are refreshed transparently
- Real-time updates would use WebSocket (socket.io) for push notifications
- Offline scenarios might use local storage queue for later sync

