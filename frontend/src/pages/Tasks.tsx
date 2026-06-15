import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import KanbanIcon from '@mui/icons-material/DashboardOutlined';
import ListIcon from '@mui/icons-material/ListAltOutlined';
import TableIcon from '@mui/icons-material/GridOnOutlined';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { useSnackbar } from 'notistack';

import type { RootState } from '../app/store/store';
import { setSelectedTaskId, setView } from '../app/store/slices/taskSlice';
import { setActiveProjectId } from '../app/store/slices/projectSlice';
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useGetProjectsQuery,
  useGetWorkspaceMembersQuery,
} from '../app/api/endpoints';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import TaskDetailsDrawer from '../components/task/TaskDetailsDrawer';

// Drag & Drop Draggable Card Component
const DraggableTaskCard: React.FC<{ task: any; onClick: () => void }> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      sx={{
        mb: 2,
        cursor: 'grab',
        border: '1px solid',
        borderColor: 'divider',
        '&:active': { cursor: 'grabbing' },
        '&:hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
        userSelect: 'none',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Chip
            label={task.priority}
            size="small"
            color={
              task.priority === 'CRITICAL'
                ? 'error'
                : task.priority === 'HIGH'
                ? 'warning'
                : 'default'
            }
            sx={{ fontSize: '0.675rem', height: 20 }}
          />
          {task.assignee && (
            <Avatar sx={{ width: 22, height: 22, fontSize: '0.675rem', bgcolor: 'secondary.main' }}>
              {task.assignee.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Droppable Kanban Column Component
const DroppableColumn: React.FC<{ status: string; title: string; tasks: any[]; onTaskClick: (id: string) => void }> = ({
  status,
  title,
  tasks,
  onTaskClick,
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Box
        ref={setNodeRef}
        sx={{
          bgcolor: 'background.default',
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          minHeight: '500px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>
          <Chip label={tasks.length} size="small" variant="outlined" sx={{ height: 18 }} />
        </Box>
        <Box>
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </Box>
      </Box>
    </Grid>
  );
};

export const Tasks: React.FC = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const viewMode = useSelector((state: RootState) => state.task.view);
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);
  const activeProjectId = useSelector((state: RootState) => state.project.activeProjectId);

  const { data: projects = [] } = useGetProjectsQuery(activeWorkspaceId!, {
    skip: !activeWorkspaceId,
  });

  React.useEffect(() => {
    if (projects && projects.length > 0) {
      if (!activeProjectId || !projects.some((p: any) => p.id === activeProjectId)) {
        dispatch(setActiveProjectId(projects[0].id));
      }
    } else if (projects && projects.length === 0) {
      dispatch(setActiveProjectId(null));
    }
  }, [projects, activeProjectId, dispatch]);

  const { data: members = [] } = useGetWorkspaceMembersQuery(activeWorkspaceId!, {
    skip: !activeWorkspaceId,
  });

  const { data: taskData, isLoading } = useGetTasksQuery(
    { workspaceId: activeWorkspaceId!, projectId: activeProjectId!, params: {} },
    { skip: !activeWorkspaceId || !activeProjectId }
  );

  const tasks = taskData?.items || [];

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('UNASSIGNED');
  const [dueDate, setDueDate] = useState('');

  if (!activeWorkspaceId) {
    return (
      <EmptyState
        title="No Workspace Selected"
        description="Please select a workspace from the sidebar switcher to access tasks."
      />
    );
  }

  const handleProjectChange = (e: any) => {
    dispatch(setActiveProjectId(e.target.value));
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    try {
      await createTask({
        workspaceId: activeWorkspaceId,
        projectId: activeProjectId!,
        title,
        description,
        priority,
        assignedTo: assignedTo === 'UNASSIGNED' ? undefined : assignedTo,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }).unwrap();

      enqueueSnackbar('Task created successfully!', { variant: 'success' });
      setOpenCreate(false);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssignedTo('UNASSIGNED');
      setDueDate('');
    } catch (err: any) {
      enqueueSnackbar(err.data?.message || 'Failed to create task', { variant: 'error' });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id; // column status

    const task = tasks.find((t: any) => t.id === taskId);
    if (task && task.status !== newStatus) {
      try {
        await updateTask({
          workspaceId: activeWorkspaceId,
          taskId,
          status: newStatus,
          version: task.version,
        }).unwrap();
      } catch (err: any) {
        enqueueSnackbar(err.data?.message || 'Failed to update task status', { variant: 'error' });
      }
    }
  };

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No Projects Available"
        description="You need to create a project before adding or managing tasks."
        actionText="Go to Projects"
        onAction={() => dispatch(setActiveProjectId(null))}
      />
    );
  }

  // Group tasks by status for Kanban Board
  const todoTasks = tasks.filter((t: any) => t.status === 'TODO');
  const progressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS');
  const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED');
  const doneTasks = tasks.filter((t: any) => t.status === 'DONE');

  // MUI DataGrid Columns Definition
  const tableColumns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1.5 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'priority', headerName: 'Priority', flex: 1 },
    {
      field: 'assignee',
      headerName: 'Assignee',
      flex: 1.2,
      valueGetter: (value: any) => value?.name || 'Unassigned',
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      flex: 1.2,
      valueGetter: (value: any) => (value ? new Date(value).toLocaleDateString() : 'None'),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Selector bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Project:</Typography>
          <Select
            value={activeProjectId || ''}
            onChange={handleProjectChange}
            size="small"
            sx={{ minWidth: 160 }}
          >
            {projects.map((p: any) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </Select>
        </Box>

        {activeProjectId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tabs
              value={viewMode}
              onChange={(_, val) => dispatch(setView(val))}
              sx={{ borderRight: '1px solid', borderColor: 'divider', pr: 1 }}
            >
              <Tab icon={<KanbanIcon fontSize="small" />} label="Board" value="board" sx={{ minHeight: 40, py: 0 }} />
              <Tab icon={<ListIcon fontSize="small" />} label="List" value="list" sx={{ minHeight: 40, py: 0 }} />
              <Tab icon={<TableIcon fontSize="small" />} label="Table" value="table" sx={{ minHeight: 40, py: 0 }} />
            </Tabs>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
              New Task
            </Button>
          </Box>
        )}
      </Box>

      {/* Task Content viewport based on selected view mode */}
      {!activeProjectId ? (
        <EmptyState
          title="Select a Project"
          description="Select a project from the top dropdown selector to manage tasks."
        />
      ) : isLoading ? (
        <Loader />
      ) : (
        <Box sx={{ flex: 1 }}>
          {viewMode === 'board' && (
            <DndContext onDragEnd={handleDragEnd}>
              <Grid container spacing={3}>
                <DroppableColumn status="TODO" title="To Do" tasks={todoTasks} onTaskClick={(id) => dispatch(setSelectedTaskId(id))} />
                <DroppableColumn status="IN_PROGRESS" title="In Progress" tasks={progressTasks} onTaskClick={(id) => dispatch(setSelectedTaskId(id))} />
                <DroppableColumn status="BLOCKED" title="Blocked" tasks={blockedTasks} onTaskClick={(id) => dispatch(setSelectedTaskId(id))} />
                <DroppableColumn status="DONE" title="Completed" tasks={doneTasks} onTaskClick={(id) => dispatch(setSelectedTaskId(id))} />
              </Grid>
            </DndContext>
          )}

          {viewMode === 'list' && (
            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 2 }}>
                {tasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No tasks logged.</Typography>
                ) : (
                  tasks.map((task: any) => (
                    <Box
                      key={task.id}
                      onClick={() => dispatch(setSelectedTaskId(task.id))}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={task.status} size="small" color="secondary" />
                        <Chip label={task.priority} size="small" />
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Card>
          )}

          {viewMode === 'table' && (
            <Box sx={{ height: 400, width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <DataGrid
                rows={tasks}
                columns={tableColumns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 5 },
                  },
                }}
                pageSizeOptions={[5, 10]}
                onRowClick={(params) => dispatch(setSelectedTaskId(params.row.id as string))}
                sx={{ border: 'none' }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Task Details Drawer */}
      <TaskDetailsDrawer />

      {/* Create Task Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create New Task</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Task Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            sx={{ mb: 2 }}
            size="small"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
                {members.map((m: any) => (
                  <MenuItem key={m.user.id} value={m.user.id}>{m.user.name}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                type="date"
                label="Due Date"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} variant="text" size="small">
            Cancel
          </Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={!title.trim()} size="small">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Tasks;
