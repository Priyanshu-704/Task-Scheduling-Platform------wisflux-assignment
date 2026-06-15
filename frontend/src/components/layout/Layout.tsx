import React from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationDrawer from './NotificationDrawer';
import useSocket from '../../hooks/useSocket';

export const Layout: React.FC = () => {
  // Activate websocket listeners
  useSocket();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Collapsible Left Navigation */}
      <Sidebar />

      {/* Main Container */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Dashboard Viewport */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Side Slide-out Drawer */}
      <NotificationDrawer />
    </Box>
  );
};
export default Layout;
