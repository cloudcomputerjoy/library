import React from 'react';
import {
  Skeleton,
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
} from '@mui/material';

export { Grid };

/**
 * SkeletonLoader Component
 * Provides reusable skeleton loading patterns for admin pages
 */

// Table Skeleton - for data tables
export const TableSkeleton = ({ rows = 5, columns = 7 }) => {
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: 'grey.50' }}>
          {Array.from({ length: columns }).map((_, index) => (
            <TableCell key={index}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} hover>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton variant="text" width="90%" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Book Table Row Skeleton - specific for BooksManagement
export const BookTableRowSkeleton = ({ rows = 8 }) => {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} hover>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Skeleton variant="circular" width={40} height={40} />
              </Avatar>
              <Box>
                <Skeleton variant="text" width="200px" />
                <Skeleton variant="text" width="150px" />
              </Box>
            </Box>
          </TableCell>
          <TableCell><Skeleton variant="text" width="120px" /></TableCell>
          <TableCell><Skeleton variant="text" width="100px" /></TableCell>
          <TableCell><Skeleton variant="text" width="120px" /></TableCell>
          <TableCell>
            <Box>
              <Skeleton variant="text" width="100px" />
              <Skeleton variant="text" width="80px" />
            </Box>
          </TableCell>
          <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

// Transaction Table Row Skeleton
export const TransactionTableRowSkeleton = ({ rows = 8 }) => {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} hover>
          <TableCell><Skeleton variant="text" width="60px" /></TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Skeleton variant="circular" width={40} height={40} />
              </Avatar>
              <Box>
                <Skeleton variant="text" width="120px" />
                <Skeleton variant="text" width="100px" />
              </Box>
            </Box>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Skeleton variant="circular" width={40} height={40} />
              </Avatar>
              <Box>
                <Skeleton variant="text" width="120px" />
                <Skeleton variant="text" width="100px" />
              </Box>
            </Box>
          </TableCell>
          <TableCell><Skeleton variant="text" width="100px" /></TableCell>
          <TableCell><Skeleton variant="text" width="100px" /></TableCell>
          <TableCell><Skeleton variant="rounded" width={70} height={24} /></TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Skeleton variant="outlined" width={70} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

// List Item Skeleton - for pending requests, scanned books
export const ListItemSkeleton = ({ rows = 5 }) => {
  return (
    <List>
      {Array.from({ length: rows }).map((_, index) => (
        <ListItem key={index} sx={{ mb: 1 }}>
          <ListItemIcon>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemIcon>
          <ListItemText
            primary={<Skeleton variant="text" width="60%" />}
            secondary={<Skeleton variant="text" width="80%" />}
          />
          <Skeleton variant="circular" width={32} height={32} />
        </ListItem>
      ))}
    </List>
  );
};

// Card Skeleton - for content cards
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="70%" height={32} />
              <Skeleton variant="text" width="100%" height={24} />
              <Skeleton variant="text" width="90%" height={24} />
              <Skeleton variant="rounded" width="100%" height={48} sx={{ mt: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Form Field Skeleton
export const FormFieldSkeleton = ({ count = 4 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index}>
          <Skeleton variant="text" width="120px" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={56} />
        </Box>
      ))}
    </Box>
  );
};

// QR Code Grid Skeleton
export const QRCodeGridSkeleton = ({ count = 15 }) => {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 2,
    }}>
      {Array.from({ length: count }).map((_, index) => (
        <Paper key={index} sx={{ p: 1, textAlign: 'center' }}>
          <Skeleton variant="rounded" width="100%" height={150} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1, mx: 'auto' }} />
        </Paper>
      ))}
    </Box>
  );
};

// Session Info Skeleton - for issue/return pages
export const SessionInfoSkeleton = () => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="text" width="100px" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="150px" height={24} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="text" width="120px" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80px" height={24} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="text" width="100px" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="100px" height={24} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="text" width="120px" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width={60} height={24} />
        </Grid>
      </Grid>
    </Paper>
  );
};

// Pending Requests Skeleton - for issue/return pages
export const PendingRequestsSkeleton = ({ count = 3 }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Skeleton variant="text" width="200px" height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </Box>
      <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {Array.from({ length: count }).map((_, index) => (
          <ListItem
            key={index}
            sx={{
              backgroundColor: '#f5f5f5',
              mb: 1,
              borderRadius: 1,
            }}
          >
            <ListItemIcon>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemIcon>
            <ListItemText
              primary={<Skeleton variant="text" width="60%" />}
              secondary={<Skeleton variant="text" width="80%" />}
            />
            <Skeleton variant="rounded" width={60} height={24} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

// Settings Form Skeleton - for CurrencySettings
export const SettingsFormSkeleton = () => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Skeleton variant="circular" width={56} height={56} />
          <Box>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={300} height={20} />
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Skeleton variant="text" width={150} height={20} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={120} height={24} />
            </Grid>
            <Grid item xs={6}>
              <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={120} height={24} />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Skeleton variant="text" width={140} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>
          <Box>
            <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Full Page Skeleton Wrapper
export const PageSkeleton = ({ children, fullHeight = false }) => {
  return (
    <Box
      sx={{
        p: 3,
        minHeight: fullHeight ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
};

export default {
  TableSkeleton,
  BookTableRowSkeleton,
  TransactionTableRowSkeleton,
  ListItemSkeleton,
  CardSkeleton,
  FormFieldSkeleton,
  QRCodeGridSkeleton,
  SessionInfoSkeleton,
  PendingRequestsSkeleton,
  SettingsFormSkeleton,
  PageSkeleton,
  Grid,
};
