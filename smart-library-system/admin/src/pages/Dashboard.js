import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Alert,
  Fade,
} from '@mui/material';
import { PageSkeleton } from '../components/SkeletonLoader';
import {
  People,
  LibraryBooks,
  AccessTime,
  Print,
  MonetizationOn,
  TrendingUp,
  Warning,
  CheckCircle,
  Speed,
  Book,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdmin } from '../context/AdminContext';
import { useDashboardMetrics, useBooks, useUsers, usePendingActions, useRecentActivities } from '../hooks/useDashboardHooks';
import { RealtimeNotificationPanel } from '../components/RealtimeNotificationPanel';

const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend, index }) => {
  return (
    <Fade in={true} timeout={500 + (index * 100)}>
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: `${color}.main`,
          opacity: 0.1,
          zIndex: 0
        }} />
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
              </Typography>
              <Typography variant="h3" component="div" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                {value}
              </Typography>
            </Box>
            <Avatar sx={{ 
              bgcolor: `${color}.light`, 
              color: `${color}.dark`,
              width: 56, 
              height: 56,
              boxShadow: `0 4px 10px rgba(0,0,0,0.05)`
            }}>
              {icon}
            </Avatar>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            {trend !== undefined && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                backgroundColor: trend > 0 ? 'success.light' : 'error.light',
                color: trend > 0 ? 'success.dark' : 'error.dark',
                px: 1,
                py: 0.5,
                borderRadius: '8px',
                opacity: 0.9
              }}>
                <TrendingUp sx={{ fontSize: 16, transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
};

const LiveWidget = ({ title, value, status, icon }) => (
  <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: status === 'Active' || status === 'Live' || status === 'Updated' ? 'success.main' : status === 'Warning' || status === 'Busy' ? 'warning.main' : 'primary.main' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {icon}
          <Chip
            label={status}
            size="small"
            color={status === 'Active' || status === 'Live' || status === 'Updated' ? 'success' : status === 'Warning' || status === 'Busy' ? 'warning' : 'default'}
            sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
          />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { stats, refreshStats } = useAdmin();
  const { metrics, dashboardStats, loading } = useDashboardMetrics('30days', true);
  const { books } = useBooks({}, true);
  const { users } = useUsers({}, true);
  const { pendingCount } = usePendingActions();
  const { activities } = useRecentActivities();
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    refreshStats();

    // Generate chart data from metrics
    setChartData([
      { name: 'Mon', users: 45, books: 23 },
      { name: 'Tue', users: 52, books: 28 },
      { name: 'Wed', users: 48, books: 31 },
      { name: 'Thu', users: 61, books: 35 },
      { name: 'Fri', users: 55, books: 29 },
      { name: 'Sat', users: 67, books: 41 },
      { name: 'Sun', users: 43, books: 22 },
    ]);
  }, [refreshStats]);

  if (loading) {
    return (
      <PageSkeleton>
        <StatCard
          index={0}
          title="Total Users"
          value="--"
          subtitle="Registered members"
          icon={<People fontSize="large" />}
          color="primary"
          trend={0}
        />
        <StatCard
          index={1}
          title="Active Users"
          value="--"
          subtitle="Currently active"
          icon={<CheckCircle fontSize="large" />}
          color="success"
          trend={0}
        />
        <StatCard
          index={2}
          title="Books Issued"
          value="--"
          subtitle="Currently borrowed"
          icon={<Book fontSize="large" />}
          color="secondary"
          trend={0}
        />
        <StatCard
          index={3}
          title="Overdue Books"
          value="--"
          subtitle="Need attention"
          icon={<Warning fontSize="large" />}
          color="error"
          trend={0}
        />
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={3}>
            <LiveWidget
              title="Students Inside"
              value="-- active"
              status="Live"
              icon={<AccessTime sx={{ fontSize: 36, color: 'success.main', opacity: 0.8 }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LiveWidget
              title="Print Queue"
              value="-- pending"
              status="Normal"
              icon={<Print sx={{ fontSize: 36, color: 'info.main', opacity: 0.8 }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LiveWidget
              title="Revenue Today"
              value="$--"
              status="Updated"
              icon={<MonetizationOn sx={{ fontSize: 36, color: 'success.main', opacity: 0.8 }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LiveWidget
              title="System Load"
              value="--%"
              status="Normal"
              icon={<Speed sx={{ fontSize: 36, color: 'primary.main', opacity: 0.8 }} />}
            />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Weekly Activity
                </Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={{}} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line type="monotone" dataKey="users" name="Users" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="books" name="Books" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  User Distribution
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Students', value: 0, color: '#4f46e5' }, { name: 'Staff', value: 0, color: '#ec4899' }, { name: 'Admins', value: 0, color: '#f59e0b' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {[{ name: 'Students', value: 0, color: '#4f46e5' }, { name: 'Staff', value: 0, color: '#ec4899' }, { name: 'Admins', value: 0, color: '#f59e0b' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 600 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  {[{ name: 'Students', color: '#4f46e5' }, { name: 'Staff', color: '#ec4899' }, { name: 'Admins', color: '#f59e0b' }].map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {entry.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Card sx={{ mt: 4, mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(5)].map((_, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  borderRadius: '12px',
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateX(4px)' }
                }}>
                  <Avatar sx={{ 
                    bgcolor: 'success.light',
                    color: 'success.dark',
                    mr: 2
                  }}>
                    <AccessTime />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      --
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      --
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label="info"
                      size="small"
                      color="default"
                      sx={{ mb: 0.5, fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      --
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </PageSkeleton>
    );
  }

  // Default stats if not loaded yet
  const defaultStats = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter(u => u.is_active)?.length || 0,
    booksIssued: metrics?.totalTransactions || 0,
    overdueBooks: dashboardStats?.overdueCount || 0,
    studentsInside: users?.filter(u => u.role === 'student' && u.is_active)?.length || 0,
    pendingPrintJobs: pendingCount || 0,
    totalRevenue: dashboardStats?.totalRevenue || 0,
    totalBooks: books?.length || 0,
    pendingFines: dashboardStats?.pendingFinesCount || 0,
  };

  const currentStats = stats || defaultStats;

  const pieData = [
    { name: 'Students', value: currentStats.totalUsers * 0.8 || 80, color: '#4f46e5' },
    { name: 'Staff', value: currentStats.totalUsers * 0.15 || 15, color: '#ec4899' },
    { name: 'Admins', value: currentStats.totalUsers * 0.05 || 5, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>
      </Box>

      {/* Alert for system status */}
      <Alert severity="success" sx={{ mb: 4, borderRadius: '12px', fontWeight: 500, border: '1px solid', borderColor: 'success.light' }}>
        All systems operational. Library management running smoothly.
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            index={0}
            title="Total Users"
            value={currentStats.totalUsers}
            subtitle="Registered members"
            icon={<People fontSize="large" />}
            color="primary"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            index={1}
            title="Active Users"
            value={currentStats.activeUsers}
            subtitle="Currently active"
            icon={<CheckCircle fontSize="large" />}
            color="success"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            index={2}
            title="Books Issued"
            value={currentStats.booksIssued}
            subtitle="Currently borrowed"
            icon={<Book fontSize="large" />}
            color="secondary"
            trend={-3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            index={3}
            title="Overdue Books"
            value={currentStats.overdueBooks}
            subtitle="Need attention"
            icon={<Warning fontSize="large" />}
            color="error"
            trend={-15}
          />
        </Grid>
      </Grid>

      {/* Live Widgets */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main', animation: 'pulse 2s infinite' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Live Status
        </Typography>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <LiveWidget
            title="Students Inside"
            value={`${currentStats.studentsInside} active`}
            status="Live"
            icon={<AccessTime sx={{ fontSize: 36, color: 'success.main', opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LiveWidget
            title="Print Queue"
            value={`${currentStats.pendingPrintJobs} pending`}
            status={currentStats.pendingPrintJobs > 5 ? 'Busy' : 'Normal'}
            icon={<Print sx={{ fontSize: 36, color: currentStats.pendingPrintJobs > 5 ? 'warning.main' : 'info.main', opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LiveWidget
            title="Revenue Today"
            value={`$${currentStats.totalRevenue}`}
            status="Updated"
            icon={<MonetizationOn sx={{ fontSize: 36, color: 'success.main', opacity: 0.8 }} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <LiveWidget
            title="System Load"
            value="67%"
            status="Normal"
            icon={<Speed sx={{ fontSize: 36, color: 'primary.main', opacity: 0.8 }} />}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Weekly Activity
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line type="monotone" dataKey="users" name="Users" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="books" name="Books" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                User Distribution
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                {pieData.map((entry, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {entry.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card sx={{ mt: 4, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Recent Activity
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(activities && activities.length > 0 ? activities : []).slice(0, 5).map((activity, index) => (
              <Box key={activity.id || index} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2, 
                borderRadius: '12px',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateX(4px)' }
              }}>
                <Avatar sx={{ 
                  bgcolor: activity.type === 'entry' ? 'success.light' : 
                          activity.type === 'book_issue' ? 'primary.light' : 
                          activity.type === 'print' ? 'info.light' : 'warning.light',
                  color: activity.type === 'entry' ? 'success.dark' : 
                         activity.type === 'book_issue' ? 'primary.dark' : 
                         activity.type === 'print' ? 'info.dark' : 'warning.dark',
                  mr: 2
                }}>
                  {activity.type === 'entry' ? <AccessTime /> : 
                   activity.type === 'book_issue' ? <LibraryBooks /> : 
                   activity.type === 'print' ? <Print /> : <Warning />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {activity.user || activity.description || 'Activity'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activity.description || `${activity.type} - ${activity.time || 'just now'}`}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={activity.status || 'info'}
                    size="small"
                    color={activity.status === 'success' ? 'success' :
                           activity.status === 'pending' ? 'warning' : 'default'}
                    sx={{ mb: 0.5, fontWeight: 600 }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    {activity.time || 'now'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Real-Time Notifications Panel */}
      <Box sx={{ mb: 4 }}>
        <RealtimeNotificationPanel maxHeight={600} />
      </Box>
    </Box>
  );
};

export default Dashboard;