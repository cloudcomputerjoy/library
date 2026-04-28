import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useAdmin } from '../context/AdminContext';
import { FormFieldSkeleton } from '../components/SkeletonLoader';

const Reports = () => {
  const { api } = useAdmin();
  const [reportType, setReportType] = useState('attendance');
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/reports?type=${reportType}`);
      if (response.data.success) {
        console.log('Report generated:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        📊 Reports & Analytics
      </Typography>

      <Card>
        <CardContent>
          {loading ? (
            <FormFieldSkeleton count={2} />
          ) : (
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="attendance">Attendance</MenuItem>
                  <MenuItem value="books">Books</MenuItem>
                  <MenuItem value="users">Users</MenuItem>
                  <MenuItem value="fines">Fines</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={generateReport} disabled={loading}>
                Generate Report
              </Button>
            </Box>
          )}
          
          <Typography variant="body1" color="text.secondary">
            Select a report type and click Generate to create a detailed report.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
