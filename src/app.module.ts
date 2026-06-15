import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

// Infrastructure Modules
import { QueueModule } from './modules/queue/queue.module';
import { CacheModule } from './modules/cache/cache.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { HealthModule } from './modules/health/health.module';
import { FilesModule } from './modules/files/files.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AuditModule } from './modules/audit/audit.module';
import { ActivityModule } from './modules/activity/activity.module';

// Business Modules
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { SubtaskModule } from './modules/subtask/subtask.module';
import { CommentModule } from './modules/comment/comment.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WorkersModule } from './workers/workers.module';

// Middleware
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

// Entities list for TypeORM
import { User } from './database/entities/user.entity';
import { UserSession } from './database/entities/user-session.entity';
import { Workspace } from './database/entities/workspace.entity';
import { WorkspaceMember } from './database/entities/workspace-member.entity';
import { Project } from './database/entities/project.entity';
import { Task } from './database/entities/task.entity';
import { Comment } from './database/entities/comment.entity';
import { Activity } from './database/entities/activity.entity';
import { Notification } from './database/entities/notification.entity';
import { Reminder } from './database/entities/reminder.entity';
import { AuditLog } from './database/entities/audit-log.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          User,
          UserSession,
          Workspace,
          WorkspaceMember,
          Project,
          Task,
          Comment,
          Activity,
          Notification,
          Reminder,
          AuditLog,
        ],
        synchronize: true, // Auto-create schema in development
        logging: false,
      }),
    }),

    // Infrastructure & Services
    QueueModule,
    CacheModule,
    MetricsModule,
    HealthModule,
    FilesModule,
    RealtimeModule,
    NotificationModule,
    AuditModule,
    ActivityModule,

    // Core Business Domains
    UsersModule,
    AuthModule,
    WorkspaceModule,
    ProjectModule,
    TaskModule,
    SubtaskModule,
    CommentModule,
    SchedulerModule,

    // Background Processing Workers
    WorkersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation tracing middleware to all routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
