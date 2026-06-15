import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('email.queue')
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing transactional email job [ID: ${job.id}] - Template: ${job.name}`,
    );
    const { email, name, code, subject, text } = job.data;

    switch (job.name) {
      case 'send-verification':
        this.logger.log(
          `[EMAIL SENT] To: ${name} <${email}> | Subject: Verify Email | Code: ${code}`,
        );
        break;
      case 'send-password-reset':
        this.logger.log(
          `[EMAIL SENT] To: <${email}> | Subject: Password Reset | Code: ${code}`,
        );
        break;
      case 'send-email':
        this.logger.log(
          `[EMAIL SENT] To: <${email}> | Subject: ${subject} | Body: ${text}`,
        );
        break;
      default:
        this.logger.log(`[EMAIL SENT] Generic email to <${email}>`);
        break;
    }
    return { success: true };
  }
}
