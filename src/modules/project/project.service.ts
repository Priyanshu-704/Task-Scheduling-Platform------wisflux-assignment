import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../database/entities/project.entity';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly activityService: ActivityService,
  ) {}

  private getListCacheKey(workspaceId: string): string {
    return `workspace:${workspaceId}:projects`;
  }

  async createProject(
    workspaceId: string,
    userId: string,
    name: string,
    description?: string,
  ): Promise<Project> {
    const project = this.projectRepository.create({
      workspaceId,
      name,
      description,
      status: 'ACTIVE',
    });
    const saved = await this.projectRepository.save(project);

    // Invalidate Cache
    await this.cacheService.del(this.getListCacheKey(workspaceId));

    // Audit and Activity logs
    await this.auditService.log('PROJECT_CREATE', userId, {
      projectId: saved.id,
      workspaceId,
    });
    await this.activityService.log(
      workspaceId,
      'PROJECT',
      saved.id,
      'PROJECT_CREATED',
      userId,
    );

    return saved;
  }

  async getProjects(workspaceId: string): Promise<Project[]> {
    const cacheKey = this.getListCacheKey(workspaceId);
    const cached = await this.cacheService.get<Project[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const projects = await this.projectRepository.find({
      where: { workspaceId, status: 'ACTIVE' },
      order: { createdAt: 'DESC' },
    });

    await this.cacheService.set(cacheKey, projects, 300); // 5 min TTL
    return projects;
  }

  async findById(id: string, workspaceId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, workspaceId },
    });
    if (!project) {
      throw new NotFoundException(`Project not found in this workspace`);
    }
    return project;
  }

  async updateProject(
    id: string,
    workspaceId: string,
    userId: string,
    name?: string,
    description?: string,
    status?: string,
  ): Promise<Project> {
    const project = await this.findById(id, workspaceId);
    const oldVal = {
      name: project.name,
      description: project.description,
      status: project.status,
    };

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    const saved = await this.projectRepository.save(project);

    // Invalidate Cache
    await this.cacheService.del(this.getListCacheKey(workspaceId));

    // Audit and Activity logs
    await this.auditService.log('PROJECT_UPDATE', userId, {
      projectId: id,
      workspaceId,
      previous: oldVal,
      new: {
        name: project.name,
        description: project.description,
        status: project.status,
      },
    });
    await this.activityService.log(
      workspaceId,
      'PROJECT',
      id,
      'PROJECT_UPDATED',
      userId,
    );

    return saved;
  }

  async deleteProject(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.findById(id, workspaceId);
    await this.projectRepository.remove(project);

    // Invalidate Cache
    await this.cacheService.del(this.getListCacheKey(workspaceId));

    // Audit and Activity logs
    await this.auditService.log('PROJECT_DELETE', userId, {
      projectId: id,
      workspaceId,
    });
    await this.activityService.log(
      workspaceId,
      'PROJECT',
      id,
      'PROJECT_DELETED',
      userId,
    );
  }
}
