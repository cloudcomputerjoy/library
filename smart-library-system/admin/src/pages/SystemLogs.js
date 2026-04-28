import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useAdmin } from '../context/AdminContext';
import { formatDateTime } from '../utils/formatters';
import { TableSkeleton } from '../components/SkeletonLoader';

const SystemLogs = () => {
  const { api } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/admin/system-logs?filter=${filter}`);
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setLogs([]);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      info: 'info',
      warning: 'warning',
      error: 'error',
      success: 'success',
    };
    return colors[level] || 'default';
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        📋 System Logs
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outlined" startIcon={<CloudDownloadIcon />}>
              Download
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="All"
              variant={filter === 'all' ? 'filled' : 'outlined'}
              onClick={() => setFilter('all')}
            />
            <Chip
              label="Errors"
              variant={filter === 'error' ? 'filled' : 'outlined'}
              onClick={() => setFilter('error')}
            />
            <Chip
              label="Warnings"
              variant={filter === 'warning' ? 'filled' : 'outlined'}
              onClick={() => setFilter('warning')}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell>Time</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.level}
                      size="small"
                      color={getLevelColor(log.level)}
                    />
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.source || 'System'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default SystemLogs;
