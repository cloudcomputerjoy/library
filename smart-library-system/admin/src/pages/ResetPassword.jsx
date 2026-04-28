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
  Link,
  Container,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Reset Password Component
 * Allows admin users to reset their password using a reset token
 * Accessed via email link with token and email parameters
 * 
 * Features:
 * - Token validation
 * - Password strength validation
 * - Show/hide password
 * - Password requirements checker
 * - Error handling
 * - Success confirmation
 */

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  /**
   * Load token and email from URL
   */
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Invalid reset link. Please request a new password reset.');
      setValidating(false);
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);
    validateToken(tokenParam, emailParam);
  }, [searchParams]);

  /**
   * Validate reset token with backend
   */
  const validateToken = async (resetToken, resetEmail) => {
    try {
      setValidating(true);
      const response = await authService.verifyResetToken(resetToken, resetEmail);

      if (response.success) {
        setTokenValid(true);
      }
    } catch (err) {
      const errorMessage = err.message || 
                          'Reset link is invalid or has expired. Please request a new one.';
      setError(errorMessage);
      setTokenValid(false);
    } finally {
      setValidating(false);
    }
  };

  /**
   * Validate password strength
   */
  const getPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const strength = (metRequirements / 5) * 100;

    return { requirements, strength, valid: metRequirements === 5 };
  };

  /**
   * Handle password reset submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { valid } = getPasswordStrength(newPassword);
    if (!valid) {
      setError('Password does not meet security requirements');
      return;
    }

    try {
      setLoading(true);

      // Call reset password endpoint
      const response = await authService.resetPassword(token, email, newPassword);

      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err.message || 
                          'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Password strength indicator
   */
  const passwordStrength = getPasswordStrength(newPassword);

  if (validating) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>Validating reset link...</Typography>
        </Box>
      </Container>
    );
  }

  if (!tokenValid) {
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
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Invalid Reset Link
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {error || 'The reset link is invalid or has expired.'}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login', { replace: true })}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (success) {
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
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Password Reset Successful!
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Your password has been reset successfully. You can now log in with your new password.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 3 }}>
                Redirecting to login in a few seconds...
              </Typography>
              <LinearProgress sx={{ mb: 2 }} />
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login', { replace: true })}
              >
                Go to Login Now
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

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
                Create New Password
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="Enter strong password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Password Requirements */}
              {newPassword && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                      Password Strength:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength.strength}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                    Requirements:
                  </Typography>
                  <Box>
                    {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                      <Typography
                        key={key}
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: 0.5,
                          color: met ? 'success.main' : 'text.secondary',
                        }}
                      >
                        {met ? '✓' : '○'} {key === 'length' && 'At least 8 characters'}
                        {key === 'uppercase' && 'Contains uppercase letter'}
                        {key === 'lowercase' && 'Contains lowercase letter'}
                        {key === 'number' && 'Contains number'}
                        {key === 'special' && 'Contains special character (!@#$%^&*)'}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Confirm Password */}
              <TextField
                fullWidth
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Confirm your password"
                error={confirmPassword && newPassword !== confirmPassword}
                helperText={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
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
                disabled={loading || !passwordStrength.valid}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'inherit' }} /> : 'Reset Password'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/login', { replace: true })}
                disabled={loading}
                startIcon={<ArrowBack />}
              >
                Back to Login
              </Button>
            </form>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Got your password back?{' '}
                <Link
                  component="button"
                  variant="caption"
                  onClick={() => navigate('/login', { replace: true })}
                  sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'none' }}
                >
                  Log In Here
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
          🔒 Your password will be encrypted and stored securely.
        </Typography>
      </Box>
    </Container>
  );
};

export default ResetPassword;
