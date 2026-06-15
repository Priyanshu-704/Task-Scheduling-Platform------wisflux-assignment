import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { useSnackbar } from 'notistack';

import type { RootState } from '../../app/store/store';
import { setSelectedTaskId } from '../../app/store/slices/taskSlice';
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useGetWorkspaceMembersQuery,
  useGetSubtaskTreeQuery,
  useCreateTaskMutation,
} from '../../app/api/endpoints';
import Loader from '../common/Loader';

export const TaskDetailsDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  const taskId = useSelector((state: RootState) => state.task.selectedTaskId);

  const { data: task, isLoading: taskLoading } = useGetTaskByIdQuery(
    { workspaceId: activeWorkspaceId!, taskId: taskId! },
    { skip: !activeWorkspaceId || !taskId }
  );

  const { data: members = [] } = useGetWorkspaceMembersQuery(activeWorkspaceId!, {
    skip: !activeWorkspaceId,
  });

  const { data: comments = [] } = useGetCommentsQuery(
    { workspaceId: activeWorkspaceId!, taskId: taskId! },
    { skip: !activeWorkspaceId || !taskId }
  );

  const { data: subtaskTree } = useGetSubtaskTreeQuery(
    { workspaceId: activeWorkspaceId!, taskId: taskId! },
    { skip: !activeWorkspaceId || !taskId }
  );

  const [updateTask] = useUpdateTaskMutation();
  const [addComment] = useAddCommentMutation();
  const [createTask] = useCreateTaskMutation();

  const [commentText, setCommentText] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const handleClose = () => {
    dispatch(setSelectedTaskId(null));
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !task) return;
    try {
      await createTask({
        workspaceId: activeWorkspaceId!,
        projectId: task.projectId,
        title: subtaskTitle,
        parentTaskId: taskId!,
      }).unwrap();
      setSubtaskTitle('');
      enqueueSnackbar('Subtask created successfully', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to create subtask', { variant: 'error' });
    }
  };

  const handleFieldChange = async (field: string, value: any) => {
    try {
      await updateTask({
        workspaceId: activeWorkspaceId!,
        taskId: taskId!,
        [field]: value,
        version: task.version,
      }).unwrap();
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to update task', { variant: 'error' });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({
        workspaceId: activeWorkspaceId!,
        taskId: taskId!,
        message: commentText,
      }).unwrap();
      setCommentText('');
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to post comment', { variant: 'error' });
    }
  };

  if (!taskId) return null;

  return (
    <Drawer
      anchor="right"
      open={!!taskId}
      onClose={handleClose}
      slotProps={{ paper: { sx: { width: 500, p: 0 } } }}
    >
      {taskLoading || !task ? (
        <Loader />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header Panel */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Task Details</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Details Scroll Area */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            {/* Title */}
            <TextField
              fullWidth
              variant="standard"
              value={task.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: { fontSize: '1.25rem', fontWeight: 700 }
                }
              }}
              placeholder="Task Title"
              sx={{ mb: 2 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              label="Description"
              value={task.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              sx={{ mb: 3 }}
              size="small"
            />

            {/* Parameters Grid */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {/* Status */}
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  STATUS
                </Typography>
                <Select
                  value={task.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="TODO">To Do</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="BLOCKED">Blocked</MenuItem>
                  <MenuItem value="DONE">Completed</MenuItem>
                </Select>
              </Grid>

              {/* Priority */}
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  PRIORITY
                </Typography>
                <Select
                  value={task.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </Grid>

              {/* Assignee */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  ASSIGNEE
                </Typography>
                <Select
                  value={task.assignedTo || 'UNASSIGNED'}
                  onChange={(e) => handleFieldChange('assignedTo', e.target.value === 'UNASSIGNED' ? null : e.target.value)}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                  {members.map((m: any) => (
                    <MenuItem key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.user.email})
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              {/* Due Date */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  DUE DATE
                </Typography>
                <TextField
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().substr(0, 10) : ''}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value ? new Date(e.target.value) : null)}
                  size="small"
                  fullWidth
                  slotProps={{
                    inputLabel: { shrink: true }
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Subtasks Section */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Subtasks</Typography>
            <Box component="form" onSubmit={handleAddSubtask} sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                placeholder="Add subtask..."
                size="small"
                fullWidth
                value={subtaskTitle}
                onChange={(e) => setSubtaskTitle(e.target.value)}
              />
              <IconButton type="submit" color="primary" disabled={!subtaskTitle.trim()}>
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>

            <List disablePadding sx={{ mb: 3 }}>
              {subtaskTree?.subTasks && subtaskTree.subTasks.length > 0 ? (
                subtaskTree.subTasks.map((st: any) => (
                  <Card 
                    key={st.id} 
                    sx={{ 
                      mb: 1, 
                      p: 1.5, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => dispatch(setSelectedTaskId(st.id))}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {st.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      px: 1, 
                      py: 0.2, 
                      borderRadius: 1, 
                      bgcolor: st.status === 'DONE' ? 'success.light' : 'action.disabledBackground',
                      color: st.status === 'DONE' ? 'success.contrastText' : 'text.secondary',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      {st.status}
                    </Typography>
                  </Card>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No subtasks created yet.
                </Typography>
              )}
            </List>

            <Divider sx={{ my: 3 }} />

            {/* Comments Thread Section */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Comments</Typography>
            <Box component="form" onSubmit={handleAddComment} sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                placeholder="Write a comment..."
                size="small"
                fullWidth
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <IconButton type="submit" color="primary" disabled={!commentText.trim()}>
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>

            <List disablePadding>
              {comments.map((c: any) => (
                <Card key={c.id} sx={{ mb: 1.5, p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>
                      {c.user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{c.user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{c.message}</Typography>
                </Card>
              ))}
            </List>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};
export default TaskDetailsDrawer;
