import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ActivityService {
  constructor(
    @InjectQueue('activity.queue') private readonly activityQueue: Queue,
  ) {}

  async log(
    workspaceId: string,
    entityType: string,
    entityId: string,
    action: string,
    performedBy: string,
  ) {
    try {
      await this.activityQueue.add(
        'log-activity',
        {
          workspaceId,
          entityType,
          entityId,
          action,
          performedBy,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (error) {
      console.error('Failed to enqueue activity log:', error);
    }
  }
}
