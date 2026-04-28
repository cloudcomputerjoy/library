# Smart Library Mobile App

React Native mobile application for the Smart Library system with QR scanning, book management, file sharing, and print portal features.

## 📋 Features

- ✅ **Authentication** - Login/Signup with JWT token management
- ✅ **QR Code Entry/Exit** - Dynamic QR with 10-second auto-refresh
- ✅ **QR Scanner** - Barcode scanning for library entry/exit
- ✅ **Book Management** - Search, filter, and manage library books
- ✅ **File Sharing** - Upload PDFs with 30-minute auto-deletion
- ✅ **Print Portal** - Request and track print jobs
- ✅ **Real-time Updates** - Socket.IO for live event notifications
- ✅ **Offline Support** - AsyncStorage for offline data persistence
- ✅ **Dark Mode** - Support for light and dark themes

## 🔧 Tech Stack

- **Framework**: React Native with Expo (managed workflow)
- **Navigation**: React Navigation 6+ (native stack, bottom tabs, drawer)
- **State Management**: Zustand with AsyncStorage persistence
- **API Communication**: Axios with JWT token refresh
- **Real-time**: Socket.IO Client
- **UI Framework**: React Native Paper (Material Design)
- **Local Storage**: AsyncStorage
- **QR Scanning**: expo-barcode-scanner
- **Camera**: @react-native-camera/camera
- **File Handling**: react-native-document-picker
- **Notifications**: @react-native-firebase/messaging

## 📦 Installation

### Prerequisites

- Node.js >= 16
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Setup Steps

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Expo development server**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/emulator**
   - **iOS**: Press `i` in terminal (requires Mac with Xcode)
   - **Android**: Press `a` in terminal (requires Android Studio/Emulator)
   - **Expo Go**: Scan QR code with Expo Go app

## 📁 Project Structure

```
mobile/
├── src/
│   ├── navigation/           # React Navigation stacks and screens
│   │   ├── RootNavigator.js  # Root conditional navigation
│   │   ├── AuthStack.js      # Auth screens (Login, Signup)
│   │   └── AppStack.js       # Main app screens (Home, QR, Books, etc.)
│   │
│   ├── screens/              # Screen components
│   │   ├── Auth/             # Authentication screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   └── OTPScreen.js
│   │   ├── Main/             # Main app screens
│   │   │   ├── HomeScreen.js
│   │   │   ├── QRScreen.js
│   │   │   ├── QRScannerScreen.js
│   │   │   ├── BookSearchScreen.js
│   │   │   ├── BookDetailScreen.js
│   │   │   ├── FileSharingScreen.js
│   │   │   └── PrintPortalScreen.js
│   │   └── Profile/          # Profile screens
│   │       ├── ProfileScreen.js
│   │       ├── TransactionHistoryScreen.js
│   │       └── SettingsScreen.js
│   │
│   ├── components/           # Reusable UI components
│   │   ├── Common/           # Common components (Button, Input, etc.)
│   │   ├── Book/             # Book-related components
│   │   ├── File/             # File sharing components
│   │   ├── Print/            # Print portal components
│   │   └── Modals/           # Modal dialogs
│   │
│   ├── services/             # API and Socket.IO services
│   │   ├── api.js            # Axios HTTP client
│   │   └── socket.js         # Socket.IO client
│   │
│   ├── store/                # Zustand state management
│   │   └── index.js          # Auth, user, books, files, print stores
│   │
│   ├── utils/                # Utility functions
│   │   ├── qr.js             # QR code utilities
│   │   ├── date.js           # Date/time formatting
│   │   ├── file.js           # File handling utilities
│   │   ├── validation.js     # Input validation
│   │   ├── logger.js         # Logging utility
│   │   └── error.js          # Error handling
│   │
│   ├── constants/            # App constants
│   │   └── index.js          # Colors, strings, typography
│   │
│   ├── config/               # Configuration files
│   │   └── env.js            # Environment configuration
│   │
│   └── hooks/                # Custom React hooks
│       ├── useAuth.js        # Authentication hook
│       ├── useQR.js          # QR code management
│       └── useFetch.js       # Data fetching hook
│
├── app.json                  # Expo app configuration
├── App.js                    # Root app component
├── index.js                  # Entry point
├── package.json              # Dependencies
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

## 🔑 API Configuration

The app connects to the backend API. Configure these in `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

For production:
```env
EXPO_PUBLIC_API_URL=https://api.smartlibrary.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.smartlibrary.com
```

## 🎯 Key Features Implementation

### 1. Authentication Flow

- Email/password login with JWT tokens
- Automatic token refresh 5 minutes before expiry
- OTP-based authentication option
- Token stored in AsyncStorage
- Auto-logout on token expiration

### 2. QR Code Management

- Dynamic QR code generated every 10 seconds
- 15-second expiry per QR token
- Manual refresh option
- Countdown timer display
- Copy QR ID for manual entry

### 3. Book Management

- Search and filter books (category, author, availability)
- Real-time search filtering
- Book detail view with reviews
- Issue/return/reserve functionality
- Offline support with cached book list

### 4. File Sharing

- Upload PDF files for printing
- Auto-delete after 30 minutes
- Real-time share notifications via Socket.IO
- Download shared files
- File size and page count display

### 5. Print Portal

- View all print jobs
- Real-time status updates (pending → printing → completed)
- Page count and cost calculation
- Cancel pending jobs
- Pickup instructions for completed jobs

### 6. Real-time Updates

- Socket.IO events:
  - `entry_success` - User entry notification
  - `exit_success` - User exit notification
  - `book_available` - Book availability alert
  - `file_shared` - New file shared
  - `print_job_update` - Print status update
  - `notification` - General notifications

## 🚀 Running the App

### Development

```bash
npm start
```

Then:
- Press `i` for iOS
- Press `a` for Android
- Press `w` for web (Expo web)

### Building APK (Android)

```bash
eas build --platform android
```

### Building IPA (iOS)

```bash
eas build --platform ios
```

Requires Expo account and Apple developer account.

## 🧪 Testing

### Run tests

```bash
npm test
```

### Test with specific patterns

```bash
npm test -- --testNamePattern="Login"
```

## 🔍 Debugging

### Enable debug logging

Set in `.env`:
```env
EXPO_PUBLIC_LOG_LEVEL=debug
EXPO_PUBLIC_ENABLE_NETWORK_LOGGING=true
EXPO_PUBLIC_ENABLE_DEBUG_PANEL=true
```

### React Native Debugger

```bash
npm install -g react-native-debugger
```

Then open app and press `Ctrl+M` (Android) or `Cmd+D` (iOS) to open dev menu.

### Network inspection

- Use React Native network inspector in dev menu
- Check API calls in `services/api.js` with logging enabled

## 📱 Device Permissions

The app requests the following permissions:

- **Camera**: QR code scanning and entry/exit verification
- **Photos/Media**: File selection for uploads
- **Notifications**: Real-time updates and alerts
- **Contacts**: Optional for sharing (if enabled)

## 🔐 Security

- JWT tokens stored securely in AsyncStorage
- Automatic token refresh before expiration
- HTTPS enforced in production
- Request validation on API calls
- Password requirements enforced

## 🌐 Network Requirements

- Stable internet connection for backend communication
- Socket.IO connection for real-time updates
- File upload requires adequate bandwidth (max 50MB)

## 📦 Dependencies

See `package.json` for complete list. Key packages:

```json
{
  "dependencies": {
    "react-native": "latest",
    "expo": "latest",
    "react-navigation": "latest",
    "zustand": "latest",
    "axios": "latest",
    "socket.io-client": "latest"
  }
}
```

## 🐛 Troubleshooting

### App not connecting to API

- Check `.env` API_URL is correct
- Verify backend is running
- Check network connectivity
- Review error logs in console

### QR code not refreshing

- Verify `QR_REFRESH_INTERVAL` in constants
- Check app is in foreground
- Restart app if stuck

### Socket.IO not receiving updates

- Verify Socket.IO URL in `.env`
- Check Socket.IO service initialization
- Review network logs for connection status
- Ensure user is authenticated

### File upload failing

- Check file size (max 50MB)
- Verify file is PDF
- Check app has file access permission
- Try uploading smaller file

## 📚 Documentation

- [React Navigation Docs](https://reactnavigation.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Axios Documentation](https://axios-http.com/)

## 👨‍💻 Development

### Code Style

- ESLint configuration included
- Prettier for code formatting
- Follow React Native best practices
- Use functional components and hooks

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: description"

# Push to remote
git push origin feature/feature-name
```

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/newfeature`)
3. Commit changes (`git commit -m 'Add newfeature'`)
4. Push to branch (`git push origin feature/newfeature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- GitHub Issues: [Smart Library Issues](https://github.com/smartlibrary/issues)
- Email: support@smartlibrary.com
- Documentation: [Smart Library Docs](https://docs.smartlibrary.com/)

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintained by**: Smart Library Team
