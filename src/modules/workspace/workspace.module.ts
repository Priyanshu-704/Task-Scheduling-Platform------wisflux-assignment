import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from '../../database/entities/workspace.entity';
import { WorkspaceMember } from '../../database/entities/workspace-member.entity';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember]),
    UsersModule,
    JwtModule.register({}),
  ],
  providers: [WorkspaceService],
  controllers: [WorkspaceController, DashboardController],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
