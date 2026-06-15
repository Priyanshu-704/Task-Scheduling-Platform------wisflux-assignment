import {
  Processor as BullProcessor,
  WorkerHost as BullWorkerHost,
} from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';

@BullProcessor('audit.queue')
export class AuditWorker extends BullWorkerHost {
  private readonly logger = new Logger(AuditWorker.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { action, userId, payload } = job.data;
    this.logger.log(
      `Processing security audit log job [ID: ${job.id}] - Action: ${action}`,
    );

    try {
      const auditRepo = this.dataSource.getRepository(AuditLog);
      const audit = auditRepo.create({
        action,
        userId,
        payload,
      });
      await auditRepo.save(audit);

      this.logger.log(
        `Audit log persisted: ${action} for user ${userId || 'guest'}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to persist audit log for action ${action}:`,
        error,
      );
      throw error;
    }
  }
}
