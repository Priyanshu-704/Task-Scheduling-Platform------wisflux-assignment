import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';

import type { RootState } from '../app/store/store';
import { useGetWorkspaceMembersQuery, useInviteWorkspaceMemberMutation } from '../app/api/endpoints';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

export const Members: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  const { data: members = [], isLoading } = useGetWorkspaceMembersQuery(activeWorkspaceId!, {
    skip: !activeWorkspaceId,
  });

  const [inviteMember] = useInviteWorkspaceMemberMutation();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');

  if (!activeWorkspaceId) {
    return (
      <EmptyState
        title="No Workspace Selected"
        description="Select a workspace from the sidebar switcher to access team member details."
      />
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await inviteMember({ workspaceId: activeWorkspaceId, email, role }).unwrap();
      enqueueSnackbar('Invitation sent and member added!', { variant: 'success' });
      setEmail('');
      setRole('MEMBER');
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to invite user. Make sure the user is registered first.', { variant: 'error' });
    }
  };

  if (isLoading) return <Loader />;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
        Workspace Members
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Invite teammates, adjust roles, and coordinate access permissions.
      </Typography>

      <Grid container spacing={3}>
        {/* Invite Member form */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Invite New Member
              </Typography>
              <Box component="form" onSubmit={handleInvite}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="name@company.com"
                />
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  <MenuItem value="MEMBER">Member</MenuItem>
                  <MenuItem value="ADMIN">Administrator</MenuItem>
                </Select>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<AddIcon />}
                  fullWidth
                  disabled={!email.trim()}
                  size="small"
                >
                  Invite
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Members List */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 0 }}>
              <List disablePadding>
                {members.map((member: any, index: number) => (
                  <React.Fragment key={member.userId}>
                    <ListItem sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 600 }}>
                            {member.user?.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={member.user?.name}
                          secondary={member.user?.email}
                          slotProps={{
                            primary: { sx: { fontWeight: 600, fontSize: '0.9375rem' } },
                            secondary: { sx: { fontSize: '0.75rem' } }
                          }}
                        />
                      </Box>
                      <Chip
                        label={member.role}
                        size="small"
                        color={member.role === 'ADMIN' ? 'secondary' : 'default'}
                      />
                    </ListItem>
                    {index < members.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Members;
