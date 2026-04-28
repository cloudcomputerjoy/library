import React, { useState } from 'react';
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
  Link,
  Container,
  Paper,
  Skeleton,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Forgot Password Component
 * Allows admin users to request a password reset email
 * 
 * Features:
 * - Email validation
 * - Request password reset
 * - Loading states
 * - Error handling
 * - Links back to login
 */

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Validate email format
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle forgot password submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate input
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      // Call forgot password endpoint
      const response = await authService.forgotPassword(email.toLowerCase().trim());

      if (response.success) {
        setSuccess(true);
        setSubmitted(true);
        setEmail('');
      }
    } catch (err) {
      const errorMessage = err.message || 
                          'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle back to login
   */
  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Card
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Smart Library Admin
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Reset Your Password
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography>Sending reset link...</Typography>
                </Box>
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
              </Box>
            ) : success && !submitted ? (
              // Success message
              <Alert severity="success" sx={{ mb: 3 }}>
                Password reset email sent successfully! Please check your inbox for a reset link.
              </Alert>
            ) : null}

            {submitted ? (
              // Instructions after submission
              <Box sx={{ textAlign: 'center' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 3,
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    borderLeft: '4px solid #1976d2',
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    A password reset link has been sent to:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      wordBreak: 'break-all',
                      mb: 2,
                    }}
                  >
                    {email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Please check your email and click the reset link. The link will expire in 1 hour.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    Didn't receive the email? Check your spam folder or try again.
                  </Typography>
                </Paper>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSubmitted(false);
                    setSuccess(false);
                  }}
                  sx={{ mb: 2 }}
                >
                  Try Another Email
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleBackToLogin}
                  startIcon={<ArrowBack />}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              // Form
              <>
                <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="admin@smartlibrary.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mb: 2 }}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: 'inherit' }} /> : 'Send Reset Link'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBackToLogin}
                    disabled={loading}
                    startIcon={<ArrowBack />}
                  >
                    Back to Login
                  </Button>
                </form>
              </>
            )}

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Remember your password?{' '}
                <Link
                  component="button"
                  variant="caption"
                  onClick={handleBackToLogin}
                  sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'none' }}
                >
                  Back to Login
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Typography
          variant="caption"
          sx={{
            mt: 3,
            textAlign: 'center',
            color: 'text.secondary',
            display: 'block',
          }}
        >
          🔒 Your password reset link will expire in 1 hour for security reasons.
        </Typography>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
