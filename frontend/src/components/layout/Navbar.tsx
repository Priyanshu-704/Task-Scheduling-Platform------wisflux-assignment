import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CloudOffIcon from '@mui/icons-material/CloudOff';

import type { RootState } from '../../app/store/store';
import { useCustomTheme } from '../../theme/ThemeContext';
import { logout } from '../../app/store/slices/authSlice';
import { useGetNotificationsQuery } from '../../app/api/endpoints';
import socketService from '../../services/socket/socketService';
import Divider from '@mui/material/Divider';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useCustomTheme();

  const user = useSelector((state: RootState) => state.auth.user);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [isConnected, setIsConnected] = useState(false);

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !user,
    pollingInterval: 15000,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 3000);
    return () => clearInterval(checkConnection);
  }, []);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleCloseUserMenu();
    navigate('/login');
  };

  const handleOpenSettings = () => {
    handleCloseUserMenu();
    navigate('/settings');
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ height: 64, justifyContent: 'space-between', px: 2 }}>
        {/* Left Search input & status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 400 }}>
          <Box
            onClick={() => dispatch({ type: 'ui/setCommandPaletteOpen', payload: true })}
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              bgcolor: 'background.default',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.75,
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': {
                borderColor: 'text.secondary',
              },
            }}
          >
            <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Search or command (Ctrl + K)
            </Typography>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'action.selected',
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                fontSize: '0.675rem',
                fontWeight: 600,
              }}
            >
              ⌘K
            </Typography>
          </Box>
        </Box>

        {/* Right Nav Utilities */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Socket connectivity status */}
          <Tooltip title={isConnected ? 'Sync Online' : 'Sync Offline (Reconnecting)'}>
            <IconButton size="small" sx={{ color: isConnected ? 'success.main' : 'text.disabled' }}>
              {isConnected ? <CloudQueueIcon fontSize="small" /> : <CloudOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Theme Mode Toggle */}
          <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
            <IconButton onClick={toggleTheme} size="small" color="inherit">
              {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Notifications Drawer Toggle */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={() => dispatch({ type: 'ui/toggleNotificationDrawer' })}
              size="small"
              color="inherit"
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', mx: 1 }} />

          {/* User Profile avatar dropdown */}
          {user && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={user.name}
                    src={user.avatar}
                    sx={{ width: 32, height: 32, fontSize: '0.875rem', fontWeight: 600, bgcolor: 'secondary.main' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleOpenSettings}>Profile & Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
export default Navbar;
