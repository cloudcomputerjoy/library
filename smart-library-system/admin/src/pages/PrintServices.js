import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useAdmin } from '../context/AdminContext';
import { TableSkeleton } from '../components/SkeletonLoader';

const PrintServices = () => {
  const { api } = useAdmin();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrintJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrintJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/print-jobs');
      if (response.data.success) {
        setJobs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch print jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        🖨️ Print Services
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button variant="contained">New Print Job</Button>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>Job ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Pages</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{job.id || `JOB-${idx}`}</TableCell>
                    <TableCell>{job.userName || 'Unknown'}</TableCell>
                    <TableCell>{job.pages || '0'}</TableCell>
                    <TableCell>
                      <Chip label={job.status || 'pending'} size="small" />
                    </TableCell>
                    <TableCell>{job.createdAt || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default PrintServices;
