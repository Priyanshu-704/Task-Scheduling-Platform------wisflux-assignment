import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import type { RootState } from '../app/store/store';
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
} from '../app/api/endpoints';
import { setActiveProjectId } from '../app/store/slices/projectSlice';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  const { data: projects = [], isLoading } = useGetProjectsQuery(activeWorkspaceId!, {
    skip: !activeWorkspaceId,
  });

  const [createProject] = useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!activeWorkspaceId) {
    return (
      <EmptyState
        title="No Workspace Selected"
        description="Please select a workspace from the sidebar switcher to access projects."
      />
    );
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createProject({ workspaceId: activeWorkspaceId, name, description }).unwrap();
      enqueueSnackbar('Project created successfully!', { variant: 'success' });
      setOpenCreate(false);
      setName('');
      setDescription('');
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to create project', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject({ workspaceId: activeWorkspaceId, id: deleteId }).unwrap();
      enqueueSnackbar('Project deleted successfully!', { variant: 'success' });
      setDeleteId(null);
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to delete project', { variant: 'error' });
    }
  };

  const handleSelectProject = (projId: string) => {
    dispatch(setActiveProjectId(projId));
    navigate('/tasks');
  };

  if (isLoading) return <Loader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your workspace roadmap, teams, and timelines.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setOpenCreate(true)}>
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <EmptyState
          title="No Projects Found"
          description="Create your first workspace project to start logging tasks and subtasks!"
          actionText="Create Project"
          onAction={() => setOpenCreate(true)}
        />
      ) : (
        <Grid container spacing={3}>
          {projects.map((proj: any) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={proj.id}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, letterSpacing: '-0.018em' }}>
                    {proj.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                    {proj.description || 'No description provided.'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                  <Button variant="outlined" size="small" onClick={() => handleSelectProject(proj.id)}>
                    View Board
                  </Button>
                  <IconButton size="small" color="error" onClick={() => setDeleteId(proj.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Modal */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Project</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Project Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            size="small"
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} variant="text" size="small">
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="contained" disabled={!name.trim()} size="small">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project?"
        description="Are you absolutely sure you want to delete this project? This will permanently delete all associated tasks, subtasks, and comments. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};
export default Projects;
