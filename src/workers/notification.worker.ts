import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notification.queue')
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing push notification job [ID: ${job.id}] - Action: ${job.name}`,
    );
    const { userId, title, message } = job.data;

    // Simulate push notification delivery (e.g. Firebase Cloud Messaging / WebPush)
    this.logger.log(
      `Mock Push Notification Sent to User: ${userId} | Title: "${title}" | Message: "${message}"`,
    );
    return { success: true };
  }
}
