# Mobile App Navigation Structure Analysis

## 1. NAVIGATION-RELATED FILES

Located in: `mobile/src/navigation/`

| File | Purpose |
|------|---------|
| **RootNavigator.js** | Root conditional navigator that routes between AuthStack (login/signup) and AppStack (main app) based on authentication state |
| **AuthStack.js** | Authentication flow navigator with Login, Signup, ForgotPassword, and OTP screens |
| **AppStack.js** | Main application navigator with BottomTabs and modal screens |

---

## 2. ALL SCREENS DEFINED IN THE APP

### Authentication Screens (AuthStack)
- LoginScreen
- SignupScreen
- ForgotPasswordScreen
- OTPScreen

### Main App Screens (organized by tabs/stacks)

#### Home Stack (TABS.HOME)
- HomeScreen → Main entry point with quick actions

#### QR Stack (TABS.QR)
- QRScreen → Display entry/exit QR code
- QRScannerScreen → Scan QR codes

#### Books Stack (TABS.BOOKS)
- BookSearchScreen → Search and browse library books
- BookDetailScreen → View detailed book information

#### Files Stack (TABS.FILES)
- FileSharingScreen → Upload and share documents
- PrintPortalScreen → Print services portal

#### Profile Stack (TABS.ProfileNav)
- ProfileScreen → User profile
- TransactionHistoryScreen → View transaction history
- SettingsScreen → App settings

#### Modal/Overlay Screens (registered in AppStack)
- AttendanceDashboardScreen
- BiometricVerificationScreen
- ContactSupportScreen
- EditPersonalDetailsScreen
- IssueBooksScreen
- NotificationsScreen
- PaymentFinesScreen
- PremiumDashboardScreen
- ReturnBooksScreen
- ReturnHistoryScreen
- SuccessConfirmationScreen
- CampusOverviewScreen

**Total: 26 unique screens**

---

## 3. "PRINT" AND "BOOKSEARCH" NAVIGATION ACTIONS

### Print Navigation (SCREEN_NAMES.Print)

**Defined In:**
- [AppStack.js](mobile/src/navigation/AppStack.js#L144) - Registered in FilesStack

**Triggered From:**

1. **HomeScreen.js** ([Line 16](mobile/src/screens/HomeScreen.js#L16))
   - Quick action button: "Upload Print"
   - Navigates via: `navigation.navigate(SCREEN_NAMES.Print)`

2. **FileSharingScreen.js** ([Line 17](mobile/src/screens/FileSharingScreen.js#L17))
   - "Open print portal" link
   - Navigates via: `navigation.navigate(SCREEN_NAMES.Print)`

### BookSearch Navigation (SCREEN_NAMES.BookSearch)

**Defined In:**
- [AppStack.js](mobile/src/navigation/AppStack.js#L104) - Registered in BooksStack

**Triggered From:**

1. **HomeScreen.js** ([Line 15](mobile/src/screens/HomeScreen.js#L15))
   - Quick action button: "Search Books"
   - Navigates via: `navigation.navigate(SCREEN_NAMES.BookSearch)`

2. **Bottom Tab Navigation** - Direct tab access
   - BookSearch is the main screen in the "Books" tab
   - Accessible via: Tab.Screen component with TABS.BOOKS

---

## 4. CURRENT ROUTE STRUCTURE & SCREEN MAPPING

### Route Hierarchy

```
RootNavigator
├── AuthStack (if not authenticated)
│   ├── Login
│   ├── Signup
│   ├── ForgotPassword
│   └── OTP
│
└── AppStack (if authenticated)
    ├── MainApp (BottomTabs)
    │   ├── Home Tab
    │   │   └── HomeStack
    │   │       └── HomeScreen
    │   │
    │   ├── QR Tab
    │   │   └── QRStack
    │   │       ├── QRScreen
    │   │       └── QRScannerScreen
    │   │
    │   ├── Books Tab
    │   │   └── BooksStack
    │   │       ├── BookSearchScreen ← BOOKSEARCH ENTRY
    │   │       └── BookDetailScreen
    │   │
    │   ├── Files Tab
    │   │   └── FilesStack
    │   │       ├── FileSharingScreen
    │   │       └── PrintPortalScreen ← PRINT ENTRY
    │   │
    │   └── Profile Tab
    │       └── ProfileStack
    │           ├── ProfileScreen
    │           ├── TransactionHistoryScreen
    │           └── SettingsScreen
    │
    ├── AttendanceDashboard (modal)
    ├── BiometricVerification (modal)
    ├── ContactSupport (modal)
    ├── EditPersonalDetails (modal)
    ├── IssueBooks (modal)
    ├── Notifications (modal)
    ├── PaymentFines (modal)
    ├── PremiumDashboard (modal)
    ├── ReturnBooks (modal)
    ├── ReturnHistory (modal)
    ├── SuccessConfirmation (modal)
    └── CampusOverview (modal)
```

### Screen Access Map

| Screen | Navigation Mode | Access Points |
|--------|-----------------|----------------|
| **BookSearchScreen** | Tab Navigator | Books tab (TABS.BOOKS) or HomeScreen action button |
| **PrintPortalScreen** | Stack Navigator (FilesStack) | Files tab → FileSharingScreen → "Open print portal" link OR HomeScreen action button |
| **HomeScreen** | Tab Navigator | Home tab (TABS.HOME) |
| **QRScreen** | Tab Navigator | QR tab (TABS.QR) |
| **FileSharingScreen** | Tab Navigator | Files tab (TABS.FILES) |
| **ProfileScreen** | Tab Navigator | Profile tab (ProfileNav) |
| Modal Screens | Modal/Stack | HomeScreen action buttons or internal navigation |

---

## 5. SCREEN NAME CONSTANTS

All screens are defined in `mobile/src/constants/index.js`:

```javascript
export const SCREEN_NAMES = {
  // Auth
  Login: 'Login',
  Signup: 'Signup',
  ForgotPassword: 'ForgotPassword',
  OTP: 'OTP',
  
  // Main tabs
  HomeMain: 'HomeMain',
  QRMain: 'QRMain',
  BookSearch: 'BookSearch',      ← BOOKSEARCH
  BookDetail: 'BookDetail',
  FileSharing: 'FileSharing',
  Print: 'Print',                ← PRINT
  Profile: 'Profile',
  TransactionHistory: 'TransactionHistory',
  Settings: 'Settings',
  QRScanner: 'QRScanner',
  
  // Modal screens
  AttendanceDashboard: 'AttendanceDashboard',
  BiometricVerification: 'BiometricVerification',
  ContactSupport: 'ContactSupport',
  EditPersonalDetails: 'EditPersonalDetails',
  IssueBooks: 'IssueBooks',
  Notifications: 'Notifications',
  PaymentFines: 'PaymentFines',
  PremiumDashboard: 'PremiumDashboard',
  ReturnBooks: 'ReturnBooks',
  ReturnHistory: 'ReturnHistory',
  SuccessConfirmation: 'SuccessConfirmation',
  CampusOverview: 'CampusOverview',
};

export const TABS = {
  HOME: 'Home',
  QR: 'QR',
  BOOKS: 'Books',
  FILES: 'Files',
};
```

---

## 6. KEY FINDINGS

✅ **Print Screen Status:** Properly integrated and accessible
- Nested in FilesStack under Files tab
- Triggered from 2 locations (HomeScreen + FileSharingScreen)

✅ **BookSearch Screen Status:** Properly integrated and accessible
- Nested in BooksStack under Books tab
- Triggered from HomeScreen quick action + direct tab access

✅ **Screens in Configuration:** 26 screens are registered in navigation
- All modal screens are properly registered in AppStack
- Quick actions in HomeScreen link to appropriate screens

📋 **Navigation Layer:**
- RootNavigator handles auth state switching
- AppStack uses BottomTabNavigator for main navigation
- Each tab has its own Stack with related screens
- Modal screens are overlaid on top of tabs

---

## Navigation Constants Reference

**Tab Names:** `HOME`, `QR`, `BOOKS`, `FILES` (ProfileNav uses hardcoded string)
**Screen Names:** 26 total defined in SCREEN_NAMES constant
**Navigation Type:** React Navigation with bottom tabs + nested stacks
