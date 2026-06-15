import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TaskIcon from '@mui/icons-material/AssignmentOutlined';
import CommentIcon from '@mui/icons-material/CommentOutlined';
import PersonIcon from '@mui/icons-material/PersonAddOutlined';

export const ActivityLog: React.FC = () => {
  // Static mock data representing audit timeline of activities
  const activities = [
    { id: 1, type: 'TASK_CREATED', message: 'You created the task "Setup CI/CD pipeline"', time: '10 mins ago', icon: <TaskIcon fontSize="small" />, color: 'primary' },
    { id: 2, type: 'COMMENT_ADDED', message: 'Sarah Connor commented on task "Fix login refresh token loop"', time: '1 hour ago', icon: <CommentIcon fontSize="small" />, color: 'secondary' },
    { id: 3, type: 'MEMBER_JOINED', message: 'John Doe joined the workspace', time: '2 hours ago', icon: <PersonIcon fontSize="small" />, color: 'success' },
    { id: 4, type: 'TASK_COMPLETED', message: 'Marcus Wright completed task "Configure redis client endpoints"', time: '1 day ago', icon: <TaskIcon fontSize="small" />, color: 'success' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
        Workspace Activity Log
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Live timeline of updates, notifications, and events across tasks and projects.
      </Typography>

      <Card sx={{ border: '1px solid', borderColor: 'divider', maxHeight: 600, overflowY: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {activities.map((act, index) => (
            <Box key={act.id} sx={{ display: 'flex', gap: 2, mb: 3, position: 'relative' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'action.selected',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {act.icon}
                </Box>
                {index < activities.length - 1 && (
                  <Box sx={{ width: '1px', flex: 1, bgcolor: 'divider', mt: 1, minHeight: 24 }} />
                )}
              </Box>
              <Box sx={{ pt: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{act.message}</Typography>
                <Typography variant="caption" color="text.secondary">{act.time}</Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};
export default ActivityLog;
