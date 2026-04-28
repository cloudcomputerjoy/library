import React, { useEffect } from 'react';
import { Box, Grid, Paper, Typography, Container } from '@mui/material';
import {
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Book as BookIcon,
  SwapHoriz as TransactionIcon,
} from '@mui/icons-material';
import { useAdmin } from '../../context/AdminContext';
import { Loading } from '../Common';
import StatsCard from './StatsCard';
import LiveFeed from './LiveFeed';
import ActivityChart from './ActivityChart';

const Dashboard = () => {
  const { stats, fetchDashboardStats, loading } = useAdmin();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }

  // Sample chart data - replace with real data from API
  const chartData = [
    { name: 'Mon', issues: 12, returns: 8 },
    { name: 'Tue', issues: 19, returns: 12 },
    { name: 'Wed', issues: 3, returns: 15 },
    { name: 'Thu', issues: 20, returns: 18 },
    { name: 'Fri', issues: 28, returns: 22 },
    { name: 'Sat', issues: 23, returns: 19 },
    { name: 'Sun', issues: 15, returns: 12 },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Welcome back! Here's what's happening in your library.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle="Active members"
            icon={PersonIcon}
            trend="up"
            trendValue={5}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Books"
            value={stats?.totalBooks || 0}
            subtitle="Available in library"
            icon={BookIcon}
            trend="up"
            trendValue={12}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Issues Today"
            value={stats?.issuesToday || 0}
            subtitle="This day"
            icon={TransactionIcon}
            trend="up"
            trendValue={8}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Fines"
            value={`$${stats?.pendingFines || 0}`}
            subtitle="To be collected"
            icon={BarChartIcon}
            trend="down"
            trendValue={3}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts and Feed */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ActivityChart
            title="Weekly Activity"
            data={chartData}
            type="line"
            dataKey="issues"
            height={300}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <LiveFeed />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
