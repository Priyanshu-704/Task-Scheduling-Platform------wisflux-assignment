import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly realtimeGateway: RealtimeGateway,
    @InjectQueue('notification.queue')
    private readonly notificationQueue: Queue,
    @InjectQueue('email.queue') private readonly emailQueue: Queue,
  ) {}

  async createAndSendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
  ) {
    try {
      // 1. Persist notification in database
      const notification = this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        isRead: false,
      });
      const savedNotification =
        await this.notificationRepository.save(notification);

      // 2. Deliver in real-time via WebSockets
      this.realtimeGateway.sendNotificationCreated(userId, savedNotification);

      // 3. Queue for offline / channel delivery (Email, Push, SMS)
      await this.notificationQueue.add(
        'send-push',
        {
          notificationId: savedNotification.id,
          userId,
          type,
          title,
          message,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );

      // Also queue an email notification job
      await this.emailQueue.add(
        'send-email',
        {
          userId,
          subject: title,
          text: message,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      return savedNotification;
    } catch (error) {
      this.logger.error(
        `Failed to process notification for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getNotificationsForUser(userId: string, isRead?: boolean) {
    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (notification) {
      notification.isRead = true;
      return this.notificationRepository.save(notification);
    }
    return null;
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }
}
