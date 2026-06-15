import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Activity } from '../database/entities/activity.entity';

@Processor('activity.queue')
export class ActivityWorker extends WorkerHost {
  private readonly logger = new Logger(ActivityWorker.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { workspaceId, entityType, entityId, action, performedBy } = job.data;
    this.logger.log(
      `Processing activity log job [ID: ${job.id}] - Action: ${action}`,
    );

    try {
      const activityRepo = this.dataSource.getRepository(Activity);
      const activity = activityRepo.create({
        workspaceId,
        entityType,
        entityId,
        action,
        performedBy,
      });
      await activityRepo.save(activity);

      this.logger.log(
        `Activity log persisted: ${action} for entity ${entityId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to persist activity log for action ${action}:`,
        error,
      );
      throw error;
    }
  }
}
