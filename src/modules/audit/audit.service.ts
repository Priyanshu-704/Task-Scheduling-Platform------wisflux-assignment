import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuditService {
  constructor(@InjectQueue('audit.queue') private readonly auditQueue: Queue) {}

  async log(action: string, userId: string | null, payload: any) {
    try {
      await this.auditQueue.add(
        'log-action',
        {
          action,
          userId,
          payload,
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
      // Fallback: log to console if queue fails to avoid losing audit trail
      console.error('Failed to enqueue audit log:', error);
    }
  }
}
