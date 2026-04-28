/**
 * Real-Time Notification Panel Component
 * Displays live notifications and activities from dashboard
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  styled,
} from '@mui/material';
import {
  Notifications as BellIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useRealtimeNotifications, useRecentActivities, useSystemStatus } from '../hooks/useDashboardHooks';

const NotificationBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return <SuccessIcon style={{ color: '#4caf50' }} />;
    case 'warning':
      return <WarningIcon style={{ color: '#ff9800' }} />;
    case 'error':
      return <ErrorIcon style={{ color: '#f44336' }} />;
    default:
      return <InfoIcon style={{ color: '#2196f3' }} />;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'info';
  }
};

export const RealtimeNotificationPanel = ({ maxHeight = 500 }) => {
  const { notifications: liveNotifications = [], unreadCount = 0 } = useRealtimeNotifications();
  const { activities = [] } = useRecentActivities();
  const { status: systemStatus = 'loading' } = useSystemStatus();
  const [tabValue, setTabValue] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <NotificationBadge badgeContent={unreadCount}>
            <BellIcon />
          </NotificationBadge>
        }
        title="Real-Time Notifications"
        subheader={`${liveNotifications.length} notifications`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={systemStatus}
              size="small"
              color={systemStatus === 'healthy' ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        }
      />

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ px: 2 }}>
        <Tab label={`Notifications (${liveNotifications.length})`} />
        <Tab label={`Activities (${activities.length})`} />
      </Tabs>

      <CardContent
        sx={{
          flex: 1,
          overflow: 'auto',
          maxHeight: maxHeight,
        }}
      >
        {/* Notifications Tab */}
        {tabValue === 0 && (
          <>
            {liveNotifications.length === 0 ? (
              <Alert severity="info">No notifications yet</Alert>
            ) : (
              <List sx={{ width: '100%' }}>
                {liveNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id || index}>
                    <ListItem
                      sx={{
                        bgcolor:
                          expandedId === notification.id
                            ? 'action.hover'
                            : 'transparent',
                        cursor: 'pointer',
                        borderRadius: 1,
                        mb: 1,
                        border: `1px solid ${
                          expandedId === notification.id
                            ? 'primary.main'
                            : 'divider'
                        }`,
                      }}
                      onClick={() =>
                        setExpandedId(
                          expandedId === notification.id
                            ? null
                            : notification.id
                        )
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{notification.title}</span>
                            <Chip
                              label={notification.type}
                              size="small"
                              color={getNotificationColor(notification.type)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <div>{notification.message}</div>
                            <small style={{ opacity: 0.7 }}>
                              {new Date(notification.timestamp).toLocaleString()}
                            </small>
                          </>
                        }
                      />
                    </ListItem>
                    {expandedId === notification.id && notification.details && (
                      <Box sx={{ pl: 4, py: 1, mb: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(notification.details, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}

        {/* Activities Tab */}
        {tabValue === 1 && (
          <>
            {activities.length === 0 ? (
              <Alert severity="info">No recent activities</Alert>
            ) : (
              <List sx={{ width: '100%' }}>
                {activities.map((activity, index) => (
                  <ListItem key={activity.id || index} sx={{ mb: 1 }}>
                    <ListItemText
                      primary={activity.description}
                      secondary={
                        <small>
                          {new Date(activity.timestamp).toLocaleString()}
                        </small>
                      }
                    />
                    {activity.status && (
                      <Chip
                        label={activity.status}
                        size="small"
                        color={
                          activity.status === 'completed'
                            ? 'success'
                            : 'default'
                        }
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Notification Bell Icon with Dropdown
 */
export const NotificationBell = () => {
  const { notifications: liveNotifications, unreadCount } = useRealtimeNotifications();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current?.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <Box>
      <Tooltip title={`${unreadCount} unread notifications`}>
        <IconButton
          ref={anchorRef}
          onClick={handleToggle}
          sx={{ position: 'relative' }}
        >
          <NotificationBadge badgeContent={unreadCount}>
            <BellIcon />
          </NotificationBadge>
        </IconButton>
      </Tooltip>

      {open && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 50,
            width: 400,
            maxHeight: 500,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1,
            zIndex: 1000,
            overflow: 'auto',
          }}
          onClick={handleClose}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
          </Box>
          {liveNotifications.slice(0, 5).map((notification, index) => (
            <Box
              key={notification.id || index}
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
                cursor: 'pointer',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                {getNotificationIcon(notification.type)}
                <Box sx={{ flex: 1 }}>
                  <strong>{notification.title}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                    {notification.message}
                  </p>
                  <small style={{ opacity: 0.7 }}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </small>
                </Box>
              </Box>
            </Box>
          ))}
          {liveNotifications.length > 5 && (
            <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
              <Button size="small">View all notifications</Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * System Status Indicator
 */
export const SystemStatusIndicator = () => {
  const { status, errorMessage } = useSystemStatus();

  return (
    <Tooltip title={`System: ${status}${errorMessage ? ' - ' + errorMessage : ''}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor:
              status === 'healthy'
                ? '#4caf50'
                : status === 'disconnected'
                ? '#f44336'
                : '#ff9800',
            animation:
              status === 'loading'
                ? 'pulse 1.5s ease-in-out infinite'
                : 'none',
            '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
          }}
        />
        <span style={{ fontSize: '0.85rem' }}>
          {status === 'healthy' && 'Connected'}
          {status === 'disconnected' && 'Disconnected'}
          {status === 'warning' && 'Warning'}
          {status === 'loading' && 'Loading...'}
        </span>
      </Box>
    </Tooltip>
  );
};

const notificationPanelExports = {
  RealtimeNotificationPanel,
  NotificationBell,
  SystemStatusIndicator,
};

export default notificationPanelExports;
