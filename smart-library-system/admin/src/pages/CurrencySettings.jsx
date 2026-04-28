/**
 * Currency Settings Page
 * Admin interface to change currency and fine rates
 */

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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Settings,
} from '@mui/icons-material';
import axios from 'axios';
import { SettingsFormSkeleton } from '../components/SkeletonLoader';

export default function CurrencySettings() {
  const [currentSettings, setCurrentSettings] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [fineRate, setFineRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Fetch current settings
        const settingsRes = await axios.get(`${API_URL}/api/currency/settings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (settingsRes.data.success) {
          setCurrentSettings(settingsRes.data.settings);
          setSelectedCurrency(settingsRes.data.settings.currency_code);
          setFineRate(settingsRes.data.settings.fine_rate_per_day.toString());
        }

        // Fetch available currencies
        const currenciesRes = await axios.get(
          `${API_URL}/api/currency/currencies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (currenciesRes.data.success) {
          setAvailableCurrencies(currenciesRes.data.currencies);
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: 'Failed to load currency settings: ' + err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [API_URL]);

  const handleSave = async () => {
    try {
      if (!selectedCurrency) {
        setMessage({ type: 'error', text: 'Please select a currency' });
        return;
      }

      const fineRateNum = parseFloat(fineRate);
      if (isNaN(fineRateNum) || fineRateNum < 0) {
        setMessage({ type: 'error', text: 'Fine rate must be a valid non-negative number' });
        return;
      }

      setSaving(true);
      setMessage({ type: '', text: '' });

      const selectedCurrencyData = availableCurrencies.find(
        (c) => c.code === selectedCurrency
      );

      const response = await axios.post(
        `${API_URL}/api/currency/settings`,
        {
          currency_code: selectedCurrency,
          currency_symbol: selectedCurrencyData.symbol,
          currency_name: selectedCurrencyData.name,
          fine_rate_per_day: fineRateNum,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setCurrentSettings(response.data.settings);
        setMessage({
          type: 'success',
          text: `Currency updated to ${selectedCurrency} with fine rate ${selectedCurrencyData.symbol}${fineRateNum}/day`,
        });

        // Reload settings after 2 seconds
        const reloadTimer = setTimeout(() => {
          window.location.reload();
        }, 2000);
        return () => clearTimeout(reloadTimer);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to save currency settings: ' + err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedCurrencyInfo = () => {
    return availableCurrencies.find((c) => c.code === selectedCurrency);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <SettingsFormSkeleton />
      </Box>
    );
  }

  const selectedInfo = getSelectedCurrencyInfo();

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Settings sx={{ fontSize: 40, color: '#1976d2' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Currency Settings
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Configure the currency used for book fines and transactions across the system
              </Typography>
            </Box>
          </Box>

          {/* Current Settings */}
          {currentSettings && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
                Current Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Currency
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {currentSettings.currency_code} ({currentSettings.currency_symbol})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Fine Rate
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {currentSettings.currency_symbol}
                    {currentSettings.fine_rate_per_day}/day
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Messages */}
          {message.text && (
            <Alert
              severity={message.type === 'success' ? 'success' : 'error'}
              sx={{ mb: 3 }}
              icon={message.type === 'success' ? <CheckCircle /> : <Error />}
            >
              {message.text}
            </Alert>
          )}

          {/* Currency Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Currency</InputLabel>
            <Select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              label="Select Currency"
            >
              {availableCurrencies.map((currency) => (
                <MenuItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code} - {currency.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Fine Rate Input */}
          <TextField
            fullWidth
            label="Fine Rate Per Day"
            type="number"
            value={fineRate}
            onChange={(e) => setFineRate(e.target.value)}
            placeholder="0.00"
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: selectedInfo && (
                <InputAdornment position="start">
                  {selectedInfo.symbol}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  /day
                </InputAdornment>
              ),
            }}
            helperText="Charged per day for overdue books"
            sx={{ mb: 3 }}
          />

          {/* Preview */}
          {selectedInfo && fineRate && (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fff3e0', border: '1px solid #ffcc80' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Preview
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  A book overdue by 1 day: {selectedInfo.symbol}
                  {parseFloat(fineRate).toFixed(2)}
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  A book overdue by 7 days: {selectedInfo.symbol}
                  {(parseFloat(fineRate) * 7).toFixed(2)}
                </Typography>
                <Typography component="li" variant="body2">
                  A book overdue by 30 days: {selectedInfo.symbol}
                  {(parseFloat(fineRate) * 30).toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Save Button */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSave}
            disabled={saving || !selectedCurrency || !fineRate}
            size="large"
            sx={{ mb: 2 }}
          >
            {saving ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Currency Settings'
            )}
          </Button>

          {/* Info */}
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              ℹ️ How it works
            </Typography>
            <Box component="ul" sx={{ pl: 2, margin: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                The selected currency applies system-wide
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Fine rate affects book return calculations
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                All transactions will use the selected currency symbol
              </Typography>
              <Typography component="li" variant="body2">
                Changes take effect immediately
              </Typography>
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
