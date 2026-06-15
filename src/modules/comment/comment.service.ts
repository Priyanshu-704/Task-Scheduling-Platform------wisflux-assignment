import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../database/entities/comment.entity';
import { Task } from '../../database/entities/task.entity';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly auditService: AuditService,
    private readonly activityService: ActivityService,
    private readonly notificationService: NotificationService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async addComment(
    workspaceId: string,
    taskId: string,
    userId: string,
    message: string,
  ): Promise<Comment> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, workspaceId },
    });
    if (!task) {
      throw new NotFoundException('Task not found in this workspace');
    }

    const comment = this.commentRepository.create({
      taskId,
      userId,
      message,
    });
    const saved = await this.commentRepository.save(comment);

    // Fetch comment with user relation for clean websocket return
    const savedWithUser = await this.commentRepository.findOne({
      where: { id: saved.id },
      relations: { user: true },
    });

    // Realtime notification
    this.realtimeGateway.sendCommentCreated(workspaceId, savedWithUser);

    // Audit and Activity logs
    await this.auditService.log('COMMENT_CREATE', userId, {
      commentId: saved.id,
      taskId,
      workspaceId,
    });
    await this.activityService.log(
      workspaceId,
      'TASK',
      taskId,
      'COMMENT_ADDED',
      userId,
    );

    // Notify assignee and creator if they are not the commenter
    const targets = new Set<string>();
    if (task.assignedTo && task.assignedTo !== userId) {
      targets.add(task.assignedTo);
    }
    if (task.createdBy !== userId) {
      targets.add(task.createdBy);
    }

    for (const targetUserId of targets) {
      await this.notificationService.createAndSendNotification(
        targetUserId,
        'COMMENT_ADDED',
        `New Comment on: ${task.title}`,
        `A new comment was added to the task "${task.title}": "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      );
    }

    return saved;
  }

  async getComments(taskId: string, workspaceId: string): Promise<Comment[]> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, workspaceId },
    });
    if (!task) {
      throw new NotFoundException('Task not found in this workspace');
    }

    return this.commentRepository.find({
      where: { taskId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }
}
