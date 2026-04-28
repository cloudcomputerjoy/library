import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminDashboardProvider } from './contexts/AdminDashboardContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ErrorBoundary } from './components/Common';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import BooksManagement from './pages/BooksManagement';
import IssueReturnCenter from './pages/IssueReturnCenter';
import QRLogs from './pages/QRLogs';
import Attendance from './pages/Attendance';
import PrintServices from './pages/PrintServices';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import Support from './pages/Support';
import SettingsPage from './pages/Settings';
import CurrencySettings from './pages/CurrencySettings';
import SystemLogs from './pages/SystemLogs';

// Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5', // Modern indigo
      light: '#818cf8',
      dark: '#3730a3',
    },
    secondary: {
      main: '#ec4899', // Vibrant pink
      light: '#f472b6',
      dark: '#be185d',
    },
    background: {
      default: '#f8fafc', // Very soft slate
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#64748b', // Slate 500
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid #f1f5f9',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

/**
 * Protected Routes Component
 * Shows dashboard and admin layout if authenticated
 */
function ProtectedRoutes() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default' }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/books" element={<BooksManagement />} />
              <Route path="/add-books" element={<BooksManagement />} />
              <Route path="/transactions" element={<IssueReturnCenter />} />
              <Route path="/issue-books" element={<Navigate to="/transactions?tab=issue" replace />} />
              <Route path="/return-books" element={<Navigate to="/transactions?tab=return" replace />} />
              <Route path="/qr-logs" element={<QRLogs />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/print-services" element={<PrintServices />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/support" element={<Support />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/currency" element={<CurrencySettings />} />
              <Route path="/system-logs" element={<SystemLogs />} />
              {/* Catch all unmatched routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Main App Component
 * Routes between Login and Protected Dashboard based on authentication state
 */
function AppContent() {
  const { user, token } = useAdmin();
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    setIsAuthenticated(!!token && !!user);
  }, [token, user]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />}
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={isAuthenticated ? <ProtectedRoutes /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AdminProvider>
          <AdminDashboardProvider>
            <AppContent />
          </AdminDashboardProvider>
        </AdminProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
