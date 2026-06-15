import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../services/socket/socketService';
import type { RootState } from '../app/store/store';
import { apiSlice } from '../app/api/apiSlice';

export const useSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  useEffect(() => {
    if (token) {
      socketService.connect(token, activeWorkspaceId);
    } else {
      socketService.disconnect();
    }

    return () => {
      // Keep socket alive but disconnect when token is removed
    };
  }, [token, activeWorkspaceId]);

  // Hook listeners helper
  useEffect(() => {
    if (!token) return;

    const handleTaskCreated = (task: any) => {
      console.log('[useSocket] task.created:', task);
      dispatch(apiSlice.util.invalidateTags(['Task', 'Dashboard']));
    };

    const handleTaskUpdated = (task: any) => {
      console.log('[useSocket] task.updated:', task);
      dispatch(apiSlice.util.invalidateTags(['Task', 'Dashboard', { type: 'Task', id: task.id }]));
    };

    const handleTaskDeleted = (data: any) => {
      console.log('[useSocket] task.deleted:', data);
      dispatch(apiSlice.util.invalidateTags(['Task', 'Dashboard']));
    };

    const handleCommentCreated = (comment: any) => {
      console.log('[useSocket] comment.created:', comment);
      dispatch(apiSlice.util.invalidateTags(['Comment']));
    };

    const handleNotificationCreated = (notification: any) => {
      console.log('[useSocket] notification.created:', notification);
      dispatch(apiSlice.util.invalidateTags(['Notification']));
    };

    const handleWorkspaceUpdated = () => {
      dispatch(apiSlice.util.invalidateTags(['Workspace']));
    };

    const handleProjectUpdated = () => {
      dispatch(apiSlice.util.invalidateTags(['Project']));
    };

    socketService.on('task.created', handleTaskCreated);
    socketService.on('task.updated', handleTaskUpdated);
    socketService.on('task.deleted', handleTaskDeleted);
    socketService.on('comment.created', handleCommentCreated);
    socketService.on('notification.created', handleNotificationCreated);
    socketService.on('workspace.updated', handleWorkspaceUpdated);
    socketService.on('project.updated', handleProjectUpdated);

    return () => {
      socketService.off('task.created', handleTaskCreated);
      socketService.off('task.updated', handleTaskUpdated);
      socketService.off('task.deleted', handleTaskDeleted);
      socketService.off('comment.created', handleCommentCreated);
      socketService.off('notification.created', handleNotificationCreated);
      socketService.off('workspace.updated', handleWorkspaceUpdated);
      socketService.off('project.updated', handleProjectUpdated);
    };
  }, [token, dispatch]);

  return socketService;
};
export default useSocket;
