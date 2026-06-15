export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum Permission {
  WORKSPACE_CREATE = 'workspace:create',
  WORKSPACE_UPDATE = 'workspace:update',
  WORKSPACE_DELETE = 'workspace:delete',
  WORKSPACE_INVITE = 'workspace:invite',

  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',

  TASK_CREATE = 'task:create',
  TASK_ASSIGN = 'task:assign',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.MEMBER]: [
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.TASK_CREATE,
    Permission.TASK_ASSIGN,
    Permission.TASK_UPDATE,
  ],
};
