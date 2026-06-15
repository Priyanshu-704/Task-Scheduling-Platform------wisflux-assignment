import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';

import type { RootState } from '../../app/store/store';
import { useGetWorkspacesQuery } from '../../app/api/endpoints';

const sidebarWidth = 240;
const collapsedWidth = 64;

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: workspaces = [] } = useGetWorkspacesQuery(undefined, {
    skip: !user,
  });

  const handleWorkspaceChange = (e: any) => {
    dispatch({ type: 'workspace/setActiveWorkspaceId', payload: e.target.value });
    navigate('/');
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardOutlinedIcon />, path: '/' },
    { text: 'My Tasks', icon: <AssignmentTurnedInOutlinedIcon />, path: '/tasks' },
    { text: 'Projects', icon: <FolderOutlinedIcon />, path: '/projects' },
    { text: 'Members', icon: <PeopleOutlinedIcon />, path: '/members' },
    { text: 'Activity log', icon: <HistoryToggleOffOutlinedIcon />, path: '/activities' },
    { text: 'Settings', icon: <SettingsOutlinedIcon />, path: '/settings' },
  ];

  // If user is admin (mocked logic or matching verification), display admin panel
  const showAdmin = user?.email === 'admin@gmail.com';

  const activePath = location.pathname;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? sidebarWidth : collapsedWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: sidebarOpen ? sidebarWidth : collapsedWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Header Logotype */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          px: 2,
        }}
      >
        {sidebarOpen && (
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'secondary.main' }} />
            Task Scheduler
          </Typography>
        )}
        <IconButton onClick={() => dispatch({ type: 'ui/toggleSidebar' })} size="small">
          {sidebarOpen ? <MenuOpenIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider />

      {/* Workspace Switcher Selector */}
      {sidebarOpen && workspaces.length > 0 && (
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            WORKSPACE
          </Typography>
          <Select
            value={activeWorkspaceId || ''}
            onChange={handleWorkspaceChange}
            size="small"
            fullWidth
            sx={{
              height: 36,
              fontSize: '0.875rem',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
            }}
          >
            {workspaces.map((ws: any) => (
              <MenuItem key={ws.id} value={ws.id} sx={{ fontSize: '0.875rem' }}>
                {ws.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}

      {sidebarOpen && workspaces.length === 0 && (
        <Box sx={{ px: 2, py: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            fullWidth
            onClick={() => navigate('/settings')}
            sx={{ height: 36, fontSize: '0.75rem' }}
          >
            Create Workspace
          </Button>
        </Box>
      )}

      {sidebarOpen && <Divider />}

      {/* Navigation Links */}
      <List sx={{ px: 1, py: 1 }}>
        {navItems.map((item) => {
          const isSelected = activePath === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: 1,
                  py: 1,
                  px: sidebarOpen ? 1.5 : 1,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    color: 'secondary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'secondary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: isSelected ? 'secondary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary={item.text} slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: isSelected ? 600 : 500 } } }} />}
              </ListItemButton>
            </ListItem>
          );
        })}

        {showAdmin && (
          <>
            {sidebarOpen && (
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  ADMINISTRATION
                </Typography>
              </Box>
            )}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate('/admin')}
                selected={activePath === '/admin'}
                sx={{
                  borderRadius: 1,
                  py: 1,
                  px: sidebarOpen ? 1.5 : 1,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    color: 'error.main',
                    '& .MuiListItemIcon-root': {
                      color: 'error.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen ? 2 : 'auto',
                    justifyContent: 'center',
                    color: activePath === '/admin' ? 'error.main' : 'text.secondary',
                  }}
                >
                  <AdminPanelSettingsOutlinedIcon />
                </ListItemIcon>
                {sidebarOpen && <ListItemText primary="Admin Panel" slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: activePath === '/admin' ? 600 : 500 } } }} />}
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );
};
export default Sidebar;
