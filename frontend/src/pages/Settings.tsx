import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';

import type { RootState } from '../app/store/store';
import { updateUser } from '../app/store/slices/authSlice';
import {
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useGetWorkspacesQuery,
} from '../app/api/endpoints';

export const Settings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.auth.user);
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  const { data: workspaces = [] } = useGetWorkspacesQuery(undefined, { skip: !user });
  const currentWorkspace = workspaces.find((w: any) => w.id === activeWorkspaceId);

  const [createWorkspace] = useCreateWorkspaceMutation();
  const [updateWorkspace] = useUpdateWorkspaceMutation();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [newWsName, setNewWsName] = useState('');

  const handleUpdateProfile = () => {
    if (!profileName.trim()) return;
    dispatch(updateUser({ name: profileName }));
    enqueueSnackbar('Profile updated successfully!', { variant: 'success' });
  };

  const handleUpdateWorkspace = async () => {
    if (!wsName.trim() || !activeWorkspaceId) return;
    try {
      await updateWorkspace({ id: activeWorkspaceId, name: wsName }).unwrap();
      enqueueSnackbar('Workspace updated successfully!', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to update workspace', { variant: 'error' });
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return;
    try {
      const response = await createWorkspace({ name: newWsName }).unwrap() as { id: string };
      dispatch({ type: 'workspace/setActiveWorkspaceId', payload: response.id });
      enqueueSnackbar('New workspace created!', { variant: 'success' });
      setNewWsName('');
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to create workspace', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure personal credentials and active tenant workspace options.
      </Typography>

      <Grid container spacing={4}>
        {/* Profile Info Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Profile Details</Typography>
              <TextField
                label="Email"
                disabled
                fullWidth
                size="small"
                value={user?.email || ''}
                sx={{ mb: 2.5 }}
              />
              <TextField
                label="Full Name"
                fullWidth
                size="small"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button variant="contained" size="small" onClick={handleUpdateProfile} disabled={!profileName.trim()}>
                Save Details
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Workspace Operations Cards */}
        <Grid size={{ xs: 12, md: 6 }}>
          {currentWorkspace && (
            <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Edit Workspace Details</Typography>
                <TextField
                  label="Workspace Slug (ReadOnly)"
                  disabled
                  fullWidth
                  size="small"
                  value={currentWorkspace.slug}
                  sx={{ mb: 2.5 }}
                />
                <TextField
                  label="Workspace Name"
                  fullWidth
                  size="small"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <Button variant="contained" size="small" onClick={handleUpdateWorkspace} disabled={!wsName.trim()}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Create New Workspace</Typography>
              <TextField
                label="Workspace Name"
                fullWidth
                size="small"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                sx={{ mb: 3 }}
                placeholder="Marketing Team, Dev Squad"
              />
              <Button variant="contained" size="small" onClick={handleCreateWorkspace} disabled={!newWsName.trim()}>
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Settings;
