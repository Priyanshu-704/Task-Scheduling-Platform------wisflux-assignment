import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { User } from '../../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly dataSource: DataSource,
  ) {}

  private getCacheKey(idOrSlug: string, isSlug = false): string {
    return isSlug ? `workspace:slug:${idOrSlug}` : `workspace:id:${idOrSlug}`;
  }

  async createWorkspace(
    ownerId: string,
    name: string,
    slug?: string,
  ): Promise<Workspace> {
    // Generate slug if not provided
    const workspaceSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    // Check if slug is unique
    const existing = await this.workspaceRepository.findOne({
      where: { slug: workspaceSlug },
    });
    if (existing) {
      throw new ConflictException(
        'A workspace with this slug already exists. Please choose a different slug or name.',
      );
    }

    // Run in transaction to ensure workspace and member role are both created
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workspace = queryRunner.manager.create(Workspace, {
        name,
        slug: workspaceSlug,
        ownerId,
      });
      const savedWorkspace = await queryRunner.manager.save(
        Workspace,
        workspace,
      );

      const member = queryRunner.manager.create(WorkspaceMember, {
        workspaceId: savedWorkspace.id,
        userId: ownerId,
        role: 'ADMIN',
      });
      await queryRunner.manager.save(WorkspaceMember, member);

      await queryRunner.commitTransaction();

      await this.auditService.log('WORKSPACE_CREATE', ownerId, {
        workspaceId: savedWorkspace.id,
        slug: workspaceSlug,
      });

      return savedWorkspace;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Workspace> {
    const cacheKey = this.getCacheKey(id);
    const cached = await this.cacheService.get<Workspace>(cacheKey);
    if (cached) {
      return cached;
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: { owner: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Cache workspace details (1 hour TTL)
    await this.cacheService.set(cacheKey, workspace, 3600);
    return workspace;
  }

  async findBySlug(slug: string): Promise<Workspace> {
    const cacheKey = this.getCacheKey(slug, true);
    const cached = await this.cacheService.get<Workspace>(cacheKey);
    if (cached) {
      return cached;
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { slug },
      relations: { owner: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.cacheService.set(cacheKey, workspace, 3600);
    return workspace;
  }

  async updateWorkspace(
    id: string,
    userId: string,
    name: string,
  ): Promise<Workspace> {
    const workspace = await this.findById(id);
    const oldName = workspace.name;
    workspace.name = name;

    const saved = await this.workspaceRepository.save(workspace);

    // Invalidate Cache
    await this.cacheService.del(this.getCacheKey(id));
    await this.cacheService.del(this.getCacheKey(workspace.slug, true));

    await this.auditService.log('WORKSPACE_UPDATE', userId, {
      workspaceId: id,
      previous: { name: oldName },
      new: { name },
    });

    return saved;
  }

  async deleteWorkspace(id: string, userId: string): Promise<void> {
    const workspace = await this.findById(id);
    await this.workspaceRepository.remove(workspace);

    // Invalidate Cache
    await this.cacheService.del(this.getCacheKey(id));
    await this.cacheService.del(this.getCacheKey(workspace.slug, true));

    await this.auditService.log('WORKSPACE_DELETE', userId, {
      workspaceId: id,
      slug: workspace.slug,
    });
  }

  async inviteMember(
    workspaceId: string,
    performerId: string,
    email: string,
    role: string,
  ) {
    const workspace = await this.findById(workspaceId);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        'User with this email not found. They must register first.',
      );
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: user.id },
    });
    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const member = this.memberRepository.create({
      workspaceId,
      userId: user.id,
      role,
    });
    const savedMember = await this.memberRepository.save(member);

    // Fetch complete user details to attach
    const invitedUser = await this.usersService.findById(user.id);

    // Realtime notification
    this.realtimeGateway.sendMemberJoined(workspaceId, {
      workspaceId,
      role,
      user: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
        avatar: invitedUser.avatar,
      },
    });

    // In-app & Queue Notification
    await this.notificationService.createAndSendNotification(
      user.id,
      'WORKSPACE_MEMBER_JOINED',
      `Joined Workspace: ${workspace.name}`,
      `You have been added to the workspace "${workspace.name}" as a ${role}.`,
    );

    await this.auditService.log('WORKSPACE_INVITE', performerId, {
      workspaceId,
      invitedUserId: user.id,
      invitedUserEmail: email,
      role,
    });

    return savedMember;
  }

  async getMembers(workspaceId: string) {
    return this.memberRepository.find({
      where: { workspaceId },
      relations: { user: true },
    });
  }

  async getUserWorkspaces(userId: string) {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: { workspace: true },
    });
    return memberships.map((m) => m.workspace);
  }
}
