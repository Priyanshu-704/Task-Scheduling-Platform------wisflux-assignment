import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckAllIcon from '@mui/icons-material/DoneAll';

import type { RootState } from '../../app/store/store';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../../app/api/endpoints';
import EmptyState from '../common/EmptyState';

export const NotificationDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const open = useSelector((state: RootState) => state.ui.notificationDrawerOpen);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !open,
  });

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const handleClose = () => {
    dispatch({ type: 'ui/setNotificationDrawerOpen', payload: false });
  };

  const filteredNotifications = notifications.filter((notif: any) => {
    if (activeTab === 'UNREAD') return !notif.isRead;
    return true;
  });

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} slotProps={{ paper: { sx: { width: 360 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, height: 64 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Notifications</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {notifications.some((n: any) => !n.isRead) && (
            <Button
              size="small"
              variant="text"
              startIcon={<CheckAllIcon />}
              onClick={() => markAllRead(undefined)}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark all read
            </Button>
          )}
          <IconButton onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="fullWidth"
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="All" value="ALL" sx={{ fontSize: '0.8125rem' }} />
        <Tab label="Unread" value="UNREAD" sx={{ fontSize: '0.8125rem' }} />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="No Notifications"
            description={activeTab === 'UNREAD' ? 'You have read all notifications!' : 'No notifications found.'}
          />
        ) : (
          <List disablePadding>
            {filteredNotifications.map((notif: any) => (
              <React.Fragment key={notif.id}>
                <ListItem
                  alignItems="flex-start"
                  onClick={() => !notif.isRead && markRead(notif.id)}
                  sx={{
                    py: 2,
                    px: 2.5,
                    cursor: notif.isRead ? 'default' : 'pointer',
                    bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  {!notif.isRead && (
                    <FiberManualRecordIcon
                      color="secondary"
                      sx={{
                        fontSize: 10,
                        position: 'absolute',
                        left: 8,
                        top: 24,
                      }}
                    />
                  )}
                  <ListItemText
                    primary={notif.title}
                    secondary={notif.message}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.875rem',
                          fontWeight: notif.isRead ? 500 : 600,
                          color: 'text.primary',
                          mb: 0.5,
                        }
                      },
                      secondary: {
                        sx: {
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                        }
                      }
                    }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};
export default NotificationDrawer;
