import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../constants';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { Workspace } from '../../database/entities/workspace.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User context not found in request');
    }

    // Extract workspace identifier
    let workspaceId =
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
      // Find workspace by slug
      const workspace = await this.dataSource
        .getRepository(Workspace)
        .findOne({ where: { slug } });
      if (workspace) {
        workspaceId = workspace.id;
      }
    }

    if (!workspaceId) {
      // If the route doesn't require a workspace context (e.g. profile endpoints, workspace creation), skip role checks
      if (!requiredRoles) {
        return true;
      }
      throw new BadRequestException(
        'Workspace context (workspaceId or slug) is required for this route',
      );
    }

    // Check membership
    const member = await this.dataSource
      .getRepository(WorkspaceMember)
      .findOne({
        where: { workspaceId, userId: user.userId },
      });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Attach workspace membership details to request for downstream use (e.g., in controllers/services)
    request.workspaceId = workspaceId;
    request.workspaceMember = member;

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.includes(member.role as Role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
