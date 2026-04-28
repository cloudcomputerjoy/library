import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showPasswords, setShowPasswords] = useState({});

  const [settings, setSettings] = useState({
    // Library Settings
    libraryName: 'Smart Library System',
    email: 'admin@library.com',
    maxBooksPerUser: 5,
    loanDays: 14,
    backupEnabled: true,
    notificationsEnabled: true,

    // bKash Settings
    bkashEnabled: false,
    bkashAppKey: '',
    bkashAppSecret: '',
    bkashUsername: '',
    bkashPassword: '',
    bkashMode: 'sandbox',

    // Nagad Settings
    nagadEnabled: false,
    nagadMerchantId: '',
    nagadPublicKey: '',
    nagadPrivateKey: '',
    nagadMode: 'sandbox',

    // Twilio Settings
    twilioEnabled: false,
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',

    // SMTP Settings
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: 'Smart Library System',
    smtpSecure: true,

    // OpenRouter API
    openRouterEnabled: false,
    openRouterApiKey: '',
    openRouterModel: 'openrouter/auto',

    // Cloudflare R2 Settings
    cloudflarR2Enabled: false,
    cloudflarAccountId: '',
    cloudflarAccessKeyId: '',
    cloudflarAccessKeySecret: '',
    cloudflarBucketName: '',
    cloudflarPublicUrl: '',
  });

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const handleSave = async () => {
    try {
      console.log('Saving settings:', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const PasswordField = ({ label, field, value }) => (
    <TextField
      fullWidth
      label={label}
      type={showPasswords[field] ? 'text' : 'password'}
      value={value}
      onChange={(e) => handleChange(field, e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => togglePasswordVisibility(field)}
              edge="end"
            >
              {showPasswords[field] ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          ⚙️ System Settings
        </Typography>
        <Button variant="contained" color="primary" onClick={handleSave} sx={{ borderRadius: 2 }}>
          Save All Settings
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Library" />
          <Tab label="Payment Gateways" />
          <Tab label="Communication" />
          <Tab label="AI & Storage" />
        </Tabs>
      </Box>

      {/* Tab 0: Library Settings */}
      {tabValue === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📚 Library Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Library Name"
                    value={settings.libraryName}
                    onChange={(e) => handleChange('libraryName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Admin Email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📖 Book Management
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Books Per User"
                    value={settings.maxBooksPerUser}
                    onChange={(e) => handleChange('maxBooksPerUser', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Loan Days"
                    value={settings.loanDays}
                    onChange={(e) => handleChange('loanDays', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🔧 System Options
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.backupEnabled}
                    onChange={(e) => handleChange('backupEnabled', e.target.checked)}
                  />
                }
                label="Enable Automatic Backups"
              />
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                  />
                }
                label="Enable Email Notifications"
              />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: Payment Gateways */}
      {tabValue === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">💳 bKash Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.bkashEnabled}
                      onChange={(e) => handleChange('bkashEnabled', e.target.checked)}
                    />
                  }
                  label="Enable"
                />
              </Box>
              {settings.bkashEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="App Key"
                      value={settings.bkashAppKey}
                      onChange={(e) => handleChange('bkashAppKey', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <PasswordField
                      label="App Secret"
                      field="bkashAppSecret"
                      value={settings.bkashAppSecret}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={settings.bkashUsername}
                      onChange={(e) => handleChange('bkashUsername', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <PasswordField
                      label="Password"
                      field="bkashPassword"
                      value={settings.bkashPassword}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Environment"
                      value={settings.bkashMode}
                      onChange={(e) => handleChange('bkashMode', e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production</option>
                    </TextField>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">💱 Nagad Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.nagadEnabled}
                      onChange={(e) => handleChange('nagadEnabled', e.target.checked)}
                    />
                  }
                  label="Enable"
                />
              </Box>
              {settings.nagadEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Merchant ID"
                      value={settings.nagadMerchantId}
                      onChange={(e) => handleChange('nagadMerchantId', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <PasswordField
                      label="Public Key"
                      field="nagadPublicKey"
                      value={settings.nagadPublicKey}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <PasswordField
                      label="Private Key"
                      field="nagadPrivateKey"
                      value={settings.nagadPrivateKey}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Environment"
                      value={settings.nagadMode}
                      onChange={(e) => handleChange('nagadMode', e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production</option>
                    </TextField>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 2: Communication */}
      {tabValue === 2 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">📱 Twilio SMS Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twilioEnabled}
                      onChange={(e) => handleChange('twilioEnabled', e.target.checked)}
                    />
                  }
                  label="Enable"
                />
              </Box>
              {settings.twilioEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Account SID"
                      value={settings.twilioAccountSid}
                      onChange={(e) => handleChange('twilioAccountSid', e.target.value)}
                      helperText="Your Twilio Account SID"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <PasswordField
                      label="Auth Token"
                      field="twilioAuthToken"
                      value={settings.twilioAuthToken}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={settings.twilioPhoneNumber}
                      onChange={(e) => handleChange('twilioPhoneNumber', e.target.value)}
                      helperText="Twilio phone number (format: +1234567890)"
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">✉️ SMTP Email Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smtpEnabled}
                      onChange={(e) => handleChange('smtpEnabled', e.target.checked)}
                    />
                  }
                  label="Enable"
                />
              </Box>
              {settings.smtpEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Host"
                      value={settings.smtpHost}
                      onChange={(e) => handleChange('smtpHost', e.target.value)}
                      helperText="e.g., smtp.gmail.com"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="SMTP Port"
                      value={settings.smtpPort}
                      onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SMTP Username"
                      value={settings.smtpUser}
                      onChange={(e) => handleChange('smtpUser', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <PasswordField
                      label="SMTP Password"
                      field="smtpPassword"
                      value={settings.smtpPassword}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="From Email"
                      type="email"
                      value={settings.smtpFromEmail}
                      onChange={(e) => handleChange('smtpFromEmail', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="From Name"
                      value={settings.smtpFromName}
                      onChange={(e) => handleChange('smtpFromName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.smtpSecure}
                          onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                        />
                      }
                      label="Use TLS/SSL Secure Connection"
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 3: AI & Storage */}
      {tabValue === 3 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">🤖 OpenRouter AI Settings</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.openRouterEnabled}
                      onChange={(e) => handleChange('openRouterEnabled', e.target.checked)}
                    />
                  }
                  label="Enable"
                />
              </Box>
              {settings.openRouterEnabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      OpenRouter provides access to multiple AI models. Get your API key at https://openrouter.ai
                    </Alert>
                  </Grid>
                  <Grid item xs={12}>
                    <PasswordField
                      label="OpenRouter API Key"
                      field="openRouterApiKey"
                      value={settings.openRouterApiKey}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Default Model"
                      value={settings.openRouterModel}
                      onChange={(e) => handleChange('openRouterModel', e.target.value)}
                      helperText="e.g., openrouter/auto, gpt-4-turbo, claude-3-opus"
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">☁️ Cloudflare R2 Storage</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cloudflarR2Enabled}
                      onChange={(e) => handleChange('cloudflarR2Enabled', e.target.checked)}
                    />
                  }
                  label="Enable"
                />
              </Box>
              {settings.cloudflarR2Enabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Store PDF files and images in Cloudflare R2. Perfect for scalable, cost-effective file storage.
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account ID"
                      value={settings.cloudflarAccountId}
                      onChange={(e) => handleChange('cloudflarAccountId', e.target.value)}
                      helperText="Your Cloudflare Account ID"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bucket Name"
                      value={settings.cloudflarBucketName}
                      onChange={(e) => handleChange('cloudflarBucketName', e.target.value)}
                      helperText="R2 bucket name for files"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Access Key ID"
                      value={settings.cloudflarAccessKeyId}
                      onChange={(e) => handleChange('cloudflarAccessKeyId', e.target.value)}
                      helperText="R2 API Token Access Key ID"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <PasswordField
                      label="Access Key Secret"
                      field="cloudflarAccessKeySecret"
                      value={settings.cloudflarAccessKeySecret}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Public URL (Optional)"
                      value={settings.cloudflarPublicUrl}
                      onChange={(e) => handleChange('cloudflarPublicUrl', e.target.value)}
                      helperText="Custom domain or R2 public URL for served files (e.g., https://cdn.example.com)"
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Settings;
