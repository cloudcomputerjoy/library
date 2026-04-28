# Mobile Screen Mapping - AllUI to Mobile App

## Design System: "The Atheneum"
- **Branding**: The Atheneum - Smart Library System
- **Design Language**: Soft Minimalism with Glassmorphism
- **Color System**: Material Design 3 with custom palette
- **Typography**: Manrope (headlines), Inter (body)
- **Effects**: Glassmorphism (70% opacity + 12px backdrop blur), Cloud shadows
- **Border Radius**: 24px (xl), 20px, 16px, 12px

---

## Screen Mapping: AllUI → Mobile

| # | UI Design Folder | Mobile Screen | React Native File | Status | Notes |
|---|------------------|---------------|------------------|--------|-------|
| 1 | `login_authentication_3` | Login | `LoginScreen.js` | ✅ | Uses Material Design form with glass card |
| 2 | `otp_verification` | OTP | `OTPScreen.js` | ✅ | OTP input fields |
| 3 | `contact_support_streamlined_2` | Contact Support | `ContactSupportScreen.js` | ✅ | Support form with ticket system |
| 4 | `edit_personal_details` | Edit Profile | `EditPersonalDetailsScreen.js` | ✅ | User profile form |
| 5 | `premium_dashboard_live_status` | Premium Dashboard | `PremiumDashboardScreen.js` | ✅ | Main home dashboard |
| 6 | `issue_books` | Issue Books | `IssueBooksScreen.js` | ✅ | Batch issue books screen |
| 7 | `return_books_fixed_nav` | Return Books | `ReturnBooksScreen.js` | ✅ | Return books management |
| 8 | `return_history_updated_nav` | Return History | `ReturnHistoryScreen.js` | ✅ | History of returns |
| 9 | `book_search_grid_with_bookmarks` | Book Search | `BookSearchScreen.js` | ✅ | Search & browse books |
| 10 | `book_details_fixed_nav` | Book Details | `BookDetailScreen.js` | ✅ | Individual book view |
| 11 | `payment_fines_with_brand_logos` | Payment & Fines | `PaymentFinesScreen.js` | ✅ | Fine management |
| 12 | `notifications_3` | Notifications | `NotificationsScreen.js` | ✅ | Notification center |
| 13 | `profile_with_contact_option` | Profile | `ProfileScreen.js` | ✅ | User profile main |
| 14 | `qr_scanner` | QR Scanner | `QRScannerScreen.js` | ✅ | QR code scanner |
| 15 | `live_dynamic_qr_1` | QR Result | `SuccessConfirmationScreen.js` | ✅ | Success after QR scan |
| 16 | `print_services_redesign` | Print Services | `PrintPortalScreen.js` | ✅ | Print management |
| 17 | `attendance_dashboard_updated_nav` | Attendance | `AttendanceDashboardScreen.js` | ✅ | Attendance tracking |
| 18 | `biometric_verification_2` | Biometric | `BiometricVerificationScreen.js` | ✅ | Biometric auth |
| 19 | `lumina_campus` | Campus Overview | `CampusOverviewScreen.js` | ⚠️ | Campus info (not in AppStack) |
| 20 | - | Settings | `SettingsScreen.js` | ✅ | App settings |
| - | - | Transaction History | `TransactionHistoryScreen.js` | ✅ | Transaction logs |
| - | - | File Sharing | `FileSharingScreen.js` | ✅ | File sharing |

---

## Design System Implementation Checklist

### Colors (from login_authentication_3)
```
Primary: #004ac6 (primary)
Primary Container: #2563eb (primary-container)
Secondary: #712ae2 (secondary)
Secondary Container: #8a4cfc (secondary-container)
Tertiary: #006229 (tertiary)
Surface: #f8f9fa (surface)
Background: #f8f9fa (background)
On Surface: #191c1d (on-surface)
On Surface Variant: #434655 (on-surface-variant)
Outline: #737686 (outline)
```

### Typography
- **Headlines**: Manrope (600, 700, 800)
- **Body**: Inter (400, 500, 600)
- **Label**: Inter

### Spacing & Sizing
- Border Radius: 24px (xxl), 16px (xl), 12px (lg)
- Padding: 8px, 12px, 16px, 24px increments
- Gap: 8px, 12px, 16px increments

### Visual Effects
- Glassmorphism: rgba(255, 255, 255, 0.7) + backdrop-filter: blur(12px)
- Shadow: 0 20px 40px rgba(0,0,0,0.04)
- Ring: 1px ring-white/50

### Component Patterns
- Glass cards for main containers
- Gradient buttons (from-primary-container to-secondary-container)
- Material Icons for UI
- Smooth transitions (150ms-300ms)

---

## Current Mobile App Status

### ✅ Complete Screens (18 total)
All screens listed above are implemented in mobile/src/screens/

### Navigation Structure
```
RootNavigator
├── AuthStack (not authenticated)
│   ├── LoginScreen
│   ├── SignupScreen
│   ├── ForgotPasswordScreen
│   └── OTPScreen
│
└── AppStack (authenticated)
    ├── HomeStack
    │   ├── PremiumDashboardScreen
    │   ├── IssueBooksScreen
    │   ├── ReturnBooksScreen
    │   └── TransactionHistoryScreen
    │
    ├── QRStack
    │   ├── QRScannerScreen
    │   └── SuccessConfirmationScreen
    │
    ├── BooksStack
    │   ├── BookSearchScreen
    │   ├── BookDetailScreen
    │   └── ReturnHistoryScreen
    │
    └── ProfileStack
        ├── ProfileScreen
        ├── SettingsScreen
        ├── NotificationsScreen
        ├── PaymentFinesScreen
        ├── FileSharingScreen
        └── PrintPortalScreen
```

### Global Components
- GlobalHeader (appears on all app screens)
- CustomBottomTab (bottom navigation with glassmorphism)

---

## Next Steps

1. ✅ All screens exist
2. ⏳ Verify each screen matches the design system from allui
3. ⏳ Ensure colors, typography, spacing follow design guidelines
4. ⏳ Apply glassmorphism effects consistently
5. ⏳ Test navigation flow
6. ⏳ Performance optimization
