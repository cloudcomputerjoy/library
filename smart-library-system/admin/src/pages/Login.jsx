import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

/**
 * Admin Login Component
 * Authenticates admin users with email/password using the AdminContext
 * 
 * Features:
 * - Email/password authentication via AdminContext
 * - Password visibility toggle
 * - Remember me functionality
 * - Error handling with user-friendly messages
 * - Loading state
 * - Forgot password link
 */

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAdmin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  /**
   * Validate email format
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate password strength
   */
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  /**
   * Handle login submission
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate inputs
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      // Call login from context
      await login(email.toLowerCase().trim(), password);

      setSuccessMessage('Login successful! Redirecting...');

      // Remember email if checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Login failed. Please try again.';
      setError(errorMessage);

      // Specific error handling
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Connection timeout. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Handle forgot password
   */
  const handleForgotPassword = () => {
    navigate('/forgot-password', { replace: true });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Grid container spacing={2} justifyContent="center" maxWidth="500px">
        {/* Logo Section */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', color: 'white', mb: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <Lock sx={{ fontSize: 32 }} />
              Smart Library Admin
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Secure Admin Portal
            </Typography>
          </Box>
        </Grid>

        {/* Login Card */}
        <Grid item xs={12}>
          <Card
            sx={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              borderRadius: 2
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Title */}
              <Typography
                variant="h5"
                sx={{
                  mb: 1,
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                }}
              >
                Admin Login
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 3,
                  color: '#666'
                }}
              >
                Enter your credentials to access the admin panel
              </Typography>

              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              )}

              {/* Success Alert */}
              {successMessage && (
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  onClose={() => setSuccessMessage('')}
                >
                  {successMessage}
                </Alert>
              )}

              {/* Form */}
              <form onSubmit={handleLogin}>
                {/* Email Field */}
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#666', mr: 1 }} />
                      </InputAdornment>
                    )
                  }}
                  placeholder="admin@example.com"
                />

                {/* Password Field */}
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#666', mr: 1 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  placeholder="Enter your password"
                />

                {/* Remember Me Checkbox */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    style={{ cursor: 'pointer' }}
                  />
                  <Typography variant="body2" sx={{ cursor: 'pointer' }}>
                    Remember me
                  </Typography>
                </Box>

                {/* Login Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 1.5,
                    fontWeight: 'bold',
                    fontSize: 16,
                    mb: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a4492 100%)',
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                      Logging in...
                    </>
                  ) : (
                    'Login to Admin Panel'
                  )}
                </Button>

                {/* Forgot Password Link */}
                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    sx={{
                      cursor: 'pointer',
                      color: '#667eea',
                      textDecoration: 'none',
                      fontSize: 14,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </Link>
                </Box>
              </form>

              {/* Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Secured by Supabase Authentication
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Demo Credentials (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <Typography variant="caption">
                <strong>Demo Mode:</strong> Use your Supabase admin credentials to login.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Login;
