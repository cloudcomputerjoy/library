import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  LinearProgress,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAdmin } from '../../context/AdminContext';

const BulkUpload = ({ onClose }) => {
  const { createUser } = useAdmin();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    const uploadResults = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      uploadResults.total = lines.length - 1; // Exclude header

      const header = lines[0].split(',').map((h) => h.trim());
      const nameIdx = header.indexOf('name');
      const emailIdx = header.indexOf('email');
      const typeIdx = header.indexOf('userType');

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map((v) => v.trim());
          const userData = {
            name: values[nameIdx],
            email: values[emailIdx],
            userType: values[typeIdx] || 'user',
            status: 'active',
          };

          await createUser(userData);
          uploadResults.success++;
        } catch (err) {
          uploadResults.failed++;
          uploadResults.errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }

      setResults(uploadResults);
    } catch (err) {
      setError('Error parsing file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (results) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CheckCircleIcon color="success" />
          <Typography>
            Upload completed: {results.success} successful, {results.failed} failed
          </Typography>
        </Box>
        {results.errors.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2">Errors:</Typography>
            <List>
              {results.errors.slice(0, 5).map((err, idx) => (
                <ListItem key={idx}>
                  <Typography variant="caption">{err}</Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        <Button variant="contained" onClick={onClose} fullWidth>
          Close
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="textSecondary" mb={2}>
        Upload a CSV file with columns: name, email, userType
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 1,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          mb: 2,
          backgroundColor: '#f9f9f9',
        }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
          <CloudUploadIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
          <Typography>{file ? file.name : 'Click to select CSV file'}</Typography>
        </label>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={!file || uploading}
        fullWidth
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </Box>
  );
};

export default BulkUpload;
