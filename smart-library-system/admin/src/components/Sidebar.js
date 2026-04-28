import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  People,
  LibraryBooks,
  SwapHoriz,
  QrCode,
  AccessTime,
  Print,
  Payment,
  Assessment,
  Support,
  Settings,
  BugReport,
  Insights,
  MenuOpen,
  Menu,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Users', icon: <People />, path: '/users' },
  { text: 'Books Management', icon: <LibraryBooks />, path: '/books' },
  { text: 'Issue / Return', icon: <SwapHoriz />, path: '/transactions' },
  { text: 'QR & RFID Logs', icon: <QrCode />, path: '/qr-logs' },
  { text: 'Attendance', icon: <AccessTime />, path: '/attendance' },
  { text: 'Print Services', icon: <Print />, path: '/print-services' },
  { text: 'Payments & Fines', icon: <Payment />, path: '/payments' },
  { text: 'Reports & Analytics', icon: <Assessment />, path: '/reports' },
  { text: 'AI Insights', icon: <Insights />, path: '/ai-insights' },
  { text: 'Support Center', icon: <Support />, path: '/support' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
  { text: 'Currency Settings', icon: <Payment />, path: '/settings/currency' },
  { text: 'System Logs', icon: <BugReport />, path: '/system-logs' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 88 : drawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          width: collapsed ? 88 : drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#0f172a', // Slate 900
          color: '#f8fafc', // Slate 50
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRight: 'none',
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box sx={{
        p: 2.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'space-between',
        alignItems: 'center',
        minHeight: 76, // Match standard appbar height
      }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 'bold' }}>
              📚
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                Smart Library
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                ADMIN PORTAL
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton
          onClick={toggleSidebar}
          sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' } }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <Menu /> : <MenuOpen />}
        </IconButton>
      </Box>

      <List sx={{ pt: 2, px: 2, overflowY: 'auto', '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' } }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: '12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 2,
                  py: 1.2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)',
                  },
                  '&:hover': {
                    backgroundColor: isSelected ? 'primary.dark' : 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isSelected ? 'white' : 'rgba(255,255,255,0.7)', 
                  minWidth: collapsed ? 0 : 40,
                  justifyContent: 'center',
                }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'white' : 'rgba(255,255,255,0.85)'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.08)', mt: 'auto' }} />

      <Box sx={{ p: 3, display: collapsed ? 'none' : 'block' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', textAlign: 'center' }}>
          © 2024 Smart Library
          <br />v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
