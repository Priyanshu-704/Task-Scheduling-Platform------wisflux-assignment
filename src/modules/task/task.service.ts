import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  OptimisticLockVersionMismatchError,
} from 'typeorm';
import { Task } from '../../database/entities/task.entity';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { QueryTaskDto } from './dto/query-task.dto';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly activityService: ActivityService,
    private readonly notificationService: NotificationService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly dataSource: DataSource,
  ) {}

  private getTaskCacheKey(id: string): string {
    return `task:id:${id}`;
  }

  private getListCachePattern(workspaceId: string, projectId: string): string {
    return `workspace:${workspaceId}:project:${projectId}:tasks:*`;
  }

  private getListCacheKey(
    workspaceId: string,
    projectId: string,
    query: QueryTaskDto,
  ): string {
    return `workspace:${workspaceId}:project:${projectId}:tasks:page:${query.page}:limit:${query.limit}:status:${query.status || 'all'}:priority:${query.priority || 'all'}:assignee:${query.assignedTo || 'all'}:search:${query.search || 'none'}:sortBy:${query.sortBy}:sortOrder:${query.sortOrder}`;
  }

  async createTask(
    workspaceId: string,
    projectId: string,
    userId: string,
    dto: {
      title: string;
      description?: string;
      parentTaskId?: string;
      priority?: string;
      assignedTo?: string;
      dueDate?: string;
      labels?: string[];
      attachments?: {
        name: string;
        url: string;
        size: number;
        mimeType: string;
      }[];
    },
  ): Promise<Task> {
    const task = this.taskRepository.create({
      workspaceId,
      projectId,
      title: dto.title,
      description: dto.description,
      parentTaskId: dto.parentTaskId,
      priority: dto.priority || 'MEDIUM',
      status: 'TODO',
      assignedTo: dto.assignedTo,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      labels: dto.labels,
      attachments: dto.attachments || [],
      createdBy: userId,
    });

    const saved = await this.taskRepository.save(task);

    // Invalidate list caches for this project
    await this.cacheService.delPattern(
      this.getListCachePattern(workspaceId, projectId),
    );

    // Audit, Activity & Websocket
    await this.auditService.log('TASK_CREATE', userId, {
      taskId: saved.id,
      projectId,
      workspaceId,
    });
    await this.activityService.log(
      workspaceId,
      'TASK',
      saved.id,
      'TASK_CREATED',
      userId,
    );
    this.realtimeGateway.sendTaskCreated(workspaceId, saved);

    // Notify assignee if present
    if (dto.assignedTo) {
      await this.notificationService.createAndSendNotification(
        dto.assignedTo,
        'TASK_ASSIGNED',
        `Assigned Task: ${dto.title}`,
        `You have been assigned to the task "${dto.title}" in project.`,
      );
    }

    return saved;
  }

  async getTasks(workspaceId: string, projectId: string, query: QueryTaskDto) {
    const cacheKey = this.getListCacheKey(workspaceId, projectId, query);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.workspaceId = :workspaceId', { workspaceId })
      .andWhere('task.projectId = :projectId', { projectId });

    // Filter by Status
    if (query.status) {
      queryBuilder.andWhere('task.status = :status', { status: query.status });
    }

    // Filter by Priority
    if (query.priority) {
      queryBuilder.andWhere('task.priority = :priority', {
        priority: query.priority,
      });
    }

    // Filter by Assignee
    if (query.assignedTo) {
      queryBuilder.andWhere('task.assignedTo = :assignedTo', {
        assignedTo: query.assignedTo,
      });
    }

    // Full Text Search
    if (query.search) {
      queryBuilder.andWhere(
        "to_tsvector('english', coalesce(task.title, '') || ' ' || coalesce(task.description, '')) @@ plainto_tsquery('english', :search)",
        { search: query.search },
      );
    }

    // Sorting
    const sortField =
      query.sortBy === 'createdAt' ||
      query.sortBy === 'dueDate' ||
      query.sortBy === 'title'
        ? `task.${query.sortBy}`
        : 'task.createdAt';
    queryBuilder.orderBy(sortField, query.sortOrder || 'DESC');

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    queryBuilder.take(limit).skip(skip);

    const [items, total] = await queryBuilder.getManyAndCount();
    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result (5 min TTL)
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  async findById(id: string, workspaceId: string): Promise<Task> {
    const cacheKey = this.getTaskCacheKey(id);
    const cached = await this.cacheService.get<Task>(cacheKey);
    if (cached && cached.workspaceId === workspaceId) {
      return cached;
    }

    const task = await this.taskRepository.findOne({
      where: { id, workspaceId },
      relations: { assignee: true, creator: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found in this workspace');
    }

    await this.cacheService.set(cacheKey, task, 300); // 5 min TTL
    return task;
  }

  async updateTask(
    id: string,
    workspaceId: string,
    userId: string,
    dto: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedTo?: string;
      dueDate?: string;
      labels?: string[];
      attachments?: {
        name: string;
        url: string;
        size: number;
        mimeType: string;
      }[];
      version?: number;
    },
  ): Promise<Task> {
    const task = await this.findById(id, workspaceId);
    const oldVal = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      version: task.version,
    };

    // Optimistic locking version validation
    if (dto.version !== undefined && task.version !== dto.version) {
      throw new ConflictException(
        'Optimistic locking violation: Task has been modified by another request. Please reload.',
      );
    }

    // Set completion date if status transitions to DONE
    let taskCompleted = false;
    if (dto.status && dto.status === 'DONE' && task.status !== 'DONE') {
      task.completedAt = new Date();
      taskCompleted = true;
    } else if (dto.status && dto.status !== 'DONE') {
      task.completedAt = null as any; // Clear completion timestamp
    }

    let assigneeChanged = false;
    if (dto.assignedTo !== undefined && dto.assignedTo !== task.assignedTo) {
      task.assignedTo = dto.assignedTo;
      assigneeChanged = true;
    }

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.dueDate !== undefined)
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : (null as any);
    if (dto.labels !== undefined) task.labels = dto.labels;
    if (dto.attachments !== undefined) task.attachments = dto.attachments;

    try {
      const saved = await this.taskRepository.save(task);

      // Invalidate caches
      await this.cacheService.del(this.getTaskCacheKey(id));
      await this.cacheService.delPattern(
        this.getListCachePattern(workspaceId, task.projectId),
      );

      // Audit and activity logging
      await this.auditService.log('TASK_UPDATE', userId, {
        taskId: id,
        workspaceId,
        previous: oldVal,
        new: dto,
      });

      if (taskCompleted) {
        await this.activityService.log(
          workspaceId,
          'TASK',
          id,
          'TASK_COMPLETED',
          userId,
        );

        // Notify creator that task is completed
        if (task.createdBy !== userId) {
          await this.notificationService.createAndSendNotification(
            task.createdBy,
            'TASK_COMPLETED',
            `Completed Task: ${task.title}`,
            `The task "${task.title}" has been completed.`,
          );
        }
      } else if (assigneeChanged && task.assignedTo) {
        await this.activityService.log(
          workspaceId,
          'TASK',
          id,
          'TASK_ASSIGNED',
          userId,
        );

        await this.notificationService.createAndSendNotification(
          task.assignedTo,
          'TASK_ASSIGNED',
          `Assigned Task: ${task.title}`,
          `You have been assigned to the task "${task.title}".`,
        );
      } else {
        await this.activityService.log(
          workspaceId,
          'TASK',
          id,
          'TASK_UPDATED',
          userId,
        );
      }

      // Realtime publish
      this.realtimeGateway.sendTaskUpdated(workspaceId, saved);

      return saved;
    } catch (error) {
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'Optimistic locking violation: Task has been modified by another request. Please reload.',
        );
      }
      throw error;
    }
  }

  async deleteTask(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const task = await this.findById(id, workspaceId);

    // Soft Delete (marks deletedAt)
    await this.taskRepository.softRemove(task);

    // Invalidate caches
    await this.cacheService.del(this.getTaskCacheKey(id));
    await this.cacheService.delPattern(
      this.getListCachePattern(workspaceId, task.projectId),
    );

    // Audit and activity logging
    await this.auditService.log('TASK_DELETE', userId, {
      taskId: id,
      workspaceId,
    });
    await this.activityService.log(
      workspaceId,
      'TASK',
      id,
      'TASK_DELETED',
      userId,
    );

    // Realtime update
    this.realtimeGateway.sendTaskUpdated(workspaceId, {
      id,
      status: 'DELETED',
      deletedAt: new Date(),
    });
  }
}
