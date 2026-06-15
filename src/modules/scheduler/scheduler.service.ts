import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Reminder } from '../../database/entities/reminder.entity';
import { Task } from '../../database/entities/task.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectQueue('reminder.queue') private readonly reminderQueue: Queue,
  ) {}

  @Cron('0 * * * * *') // Run every minute
  async checkDueTasks() {
    this.logger.log('Running task due-date reminder check...');

    // We define our reminder milestones (24h, 12h, 6h, 1h)
    const milestones = [
      { name: '24 hours', hours: 24 },
      { name: '12 hours', hours: 12 },
      { name: '6 hours', hours: 6 },
      { name: '1 hour', hours: 1 },
    ];

    for (const milestone of milestones) {
      // Find tasks that are due in the next (hours) window AND don't have a reminder generated for this milestone.
      // We check if a reminder exists with scheduledAt close to the target time.
      const targetTimeMin = new Date();
      targetTimeMin.setHours(targetTimeMin.getHours() + milestone.hours - 1); // 1-hour window

      const targetTimeMax = new Date();
      targetTimeMax.setHours(targetTimeMax.getHours() + milestone.hours);

      const tasks = await this.dataSource
        .getRepository(Task)
        .createQueryBuilder('task')
        .where('task.dueDate BETWEEN :min AND :max', {
          min: targetTimeMin,
          max: targetTimeMax,
        })
        .andWhere('task.status != :status', { status: 'DONE' })
        .andWhere('task.assignedTo IS NOT NULL')
        .getMany();

      for (const task of tasks) {
        // Check if reminder already created for this milestone
        // We look for a reminder for this task created in the last 24h for this milestone
        const existing = await this.dataSource.getRepository(Reminder).findOne({
          where: {
            taskId: task.id,
            status: 'SENT',
          },
        });

        // To make it simple, we check if we've already scheduled/sent a reminder for this milestone.
        // We can check if a reminder has been created for the task in the database recently.
        const reminderCount = await this.dataSource
          .getRepository(Reminder)
          .count({
            where: {
              taskId: task.id,
              scheduledAt: task.dueDate, // We match the exact task due date as the identifier of this reminder target
            },
          });

        if (reminderCount === 0) {
          // Save Reminder record as PENDING
          const reminder = this.dataSource.getRepository(Reminder).create({
            taskId: task.id,
            scheduledAt: task.dueDate,
            status: 'PENDING',
          });
          const savedReminder = await this.dataSource
            .getRepository(Reminder)
            .save(reminder);

          // Push to BullMQ reminder queue
          await this.reminderQueue.add(
            'process-reminder',
            {
              reminderId: savedReminder.id,
              taskId: task.id,
              userId: task.assignedTo,
              milestone: milestone.name,
              dueDate: task.dueDate,
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 1000 },
            },
          );

          this.logger.log(
            `Enqueued due-date reminder for task ${task.id} (${milestone.name} milestone)`,
          );
        }
      }
    }
  }
}
