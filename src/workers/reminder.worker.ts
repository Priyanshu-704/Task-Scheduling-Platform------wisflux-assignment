import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Reminder } from '../database/entities/reminder.entity';
import { NotificationService } from '../modules/notification/notification.service';
import { Task } from '../database/entities/task.entity';

@Processor('reminder.queue')
export class ReminderWorker extends WorkerHost {
  private readonly logger = new Logger(ReminderWorker.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { reminderId, taskId, userId, milestone } = job.data;
    this.logger.log(
      `Processing task reminder job [ID: ${job.id}] - Task: ${taskId} | Milestone: ${milestone}`,
    );

    const reminderRepo = this.dataSource.getRepository(Reminder);
    const taskRepo = this.dataSource.getRepository(Task);

    try {
      const task = await taskRepo.findOne({ where: { id: taskId } });
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // 1. Deliver in-app and live websocket notification
      await this.notificationService.createAndSendNotification(
        userId,
        'DUE_REMINDER',
        `Task Due Soon: ${task.title}`,
        `Reminder: The task "${task.title}" is due in ${milestone}.`,
      );

      // 2. Mark reminder as SENT in DB
      await reminderRepo.update({ id: reminderId }, { status: 'SENT' });
      this.logger.log(`Reminder ${reminderId} marked as SENT`);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process reminder ${reminderId} for task ${taskId}:`,
        error,
      );

      // Update status to FAILED
      await reminderRepo.update({ id: reminderId }, { status: 'FAILED' });
      throw error; // Re-throwing allows BullMQ to manage retries/backoffs
    }
  }
}
