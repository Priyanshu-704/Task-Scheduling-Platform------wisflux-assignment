import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import TaskIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

import type { RootState } from '../../app/store/store';

export const CommandPalette: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((state: RootState) => state.ui.commandPaletteOpen);

  const [search, setSearch] = useState('');

  // Handle Ctrl+K shortcut keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'ui/toggleCommandPalette' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const handleClose = () => {
    dispatch({ type: 'ui/setCommandPaletteOpen', payload: false });
    setSearch('');
  };

  const commands = [
    { text: 'Go to Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
    { text: 'Go to Tasks', path: '/tasks', icon: <TaskIcon fontSize="small" /> },
    { text: 'Go to Projects', path: '/projects', icon: <FolderIcon fontSize="small" /> },
    { text: 'Go to Members', path: '/members', icon: <PeopleIcon fontSize="small" /> },
    { text: 'Go to Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.text.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Input area */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1.5 }} />
          <InputBase
            placeholder="Type a command or navigate..."
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            sx={{ fontSize: '1rem' }}
          />
        </Box>

        {/* Results area */}
        <Box sx={{ p: 1, maxHeight: 300, overflowY: 'auto' }}>
          {filteredCommands.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No command results found.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredCommands.map((cmd) => (
                <ListItemButton
                  key={cmd.text}
                  onClick={() => handleNavigate(cmd.path)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                    {cmd.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={cmd.text}
                    slotProps={{
                      primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } }
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
export default CommandPalette;
