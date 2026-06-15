import { apiSlice } from './apiSlice';

export const extendedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // === AUTH ENDPOINTS ===
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Session'],
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    getSessions: builder.query({
      query: () => '/auth/sessions',
      providesTags: ['Session'],
    }),
    revokeSession: builder.mutation({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['Session'],
    }),

    // === WORKSPACE ENDPOINTS ===
    getWorkspaces: builder.query({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),
    createWorkspace: builder.mutation({
      query: (data) => ({
        url: '/workspaces',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workspace'],
    }),
    updateWorkspace: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/workspaces/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Workspace'],
    }),
    deleteWorkspace: builder.mutation({
      query: (id) => ({
        url: `/workspaces/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workspace'],
    }),
    getWorkspaceMembers: builder.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: ['Workspace'],
    }),
    inviteWorkspaceMember: builder.mutation({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/members/invite`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Workspace'],
    }),

    // === PROJECT ENDPOINTS ===
    getProjects: builder.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/projects`,
      providesTags: ['Project'],
    }),
    createProject: builder.mutation({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/projects`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation({
      query: ({ workspaceId, id, ...body }) => ({
        url: `/workspaces/${workspaceId}/projects/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation({
      query: ({ workspaceId, id }) => ({
        url: `/workspaces/${workspaceId}/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),

    // === TASK ENDPOINTS ===
    getTasks: builder.query({
      query: ({ workspaceId, projectId, params }) => ({
        url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        params,
      }),
      providesTags: ['Task'],
    }),
    getTaskById: builder.query({
      query: ({ workspaceId, taskId }) => `/workspaces/${workspaceId}/tasks/${taskId}`,
      providesTags: (_1, _2, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
    createTask: builder.mutation({
      query: ({ workspaceId, projectId, ...body }) => ({
        url: `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task', 'Dashboard'],
    }),
    updateTask: builder.mutation({
      query: ({ workspaceId, taskId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tasks/${taskId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_1, _2, { taskId }) => ['Task', { type: 'Task', id: taskId }, 'Dashboard'],
    }),
    deleteTask: builder.mutation({
      query: ({ workspaceId, taskId }) => ({
        url: `/workspaces/${workspaceId}/tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task', 'Dashboard'],
    }),

    // === COMMENTS ENDPOINTS ===
    getComments: builder.query({
      query: ({ workspaceId, taskId }) => `/workspaces/${workspaceId}/tasks/${taskId}/comments`,
      providesTags: ['Comment'],
    }),
    addComment: builder.mutation({
      query: ({ workspaceId, taskId, ...body }) => ({
        url: `/workspaces/${workspaceId}/tasks/${taskId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Comment'],
    }),

    // === DASHBOARD ENDPOINTS ===
    getDashboardMetrics: builder.query({
      query: (workspaceId) => `/workspaces/${workspaceId}/dashboard/metrics`,
      providesTags: ['Dashboard'],
    }),

    // === NOTIFICATIONS ENDPOINTS ===
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),

    // === ADMIN ENDPOINTS ===
    getAdminAuditLogs: builder.query({
      query: (params) => ({
        url: '/admin/audit-logs',
        params,
      }),
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useInviteWorkspaceMemberMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useGetDashboardMetricsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAdminAuditLogsQuery,
} = extendedApiSlice;
