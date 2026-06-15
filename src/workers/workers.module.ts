import { Module } from '@nestjs/common';
import { NotificationWorker } from './notification.worker';
import { EmailWorker } from './email.worker';
import { ReminderWorker } from './reminder.worker';
import { ActivityWorker } from './activity.worker';
import { AuditWorker } from './audit.worker';
import { NotificationModule } from '../modules/notification/notification.module';

@Module({
  imports: [
    NotificationModule, // Used by ReminderWorker
  ],
  providers: [
    NotificationWorker,
    EmailWorker,
    ReminderWorker,
    ActivityWorker,
    AuditWorker,
  ],
})
export class WorkersModule {}
