import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, ROLE_PERMISSIONS, Role } from '../constants';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { Workspace } from '../../database/entities/workspace.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User context not found in request');
    }

    // Attempt to read already resolved workspace member metadata from RoleGuard
    let member = request.workspaceMember;
    let workspaceId = request.workspaceId;

    if (!member) {
      // Resolve workspaceId & membership if RoleGuard did not run
      workspaceId =
        request.params.workspaceId ||
        request.query.workspaceId ||
        request.headers['x-workspace-id'] ||
        request.body?.workspaceId;
      const slug =
        request.params.slug ||
        request.query.slug ||
        request.headers['x-workspace-slug'] ||
        request.body?.slug;

      if (!workspaceId && slug) {
        const workspace = await this.dataSource
          .getRepository(Workspace)
          .findOne({ where: { slug } });
        if (workspace) {
          workspaceId = workspace.id;
        }
      }

      if (!workspaceId) {
        throw new BadRequestException(
          'Workspace context is required for permission check',
        );
      }

      member = await this.dataSource.getRepository(WorkspaceMember).findOne({
        where: { workspaceId, userId: user.userId },
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this workspace');
      }

      request.workspaceId = workspaceId;
      request.workspaceMember = member;
    }

    const userRole = member.role as Role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );
    if (!hasPermissions) {
      throw new ForbiddenException(
        `Access denied. Required permission(s): ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
