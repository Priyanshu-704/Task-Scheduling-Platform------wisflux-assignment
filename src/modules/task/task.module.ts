import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../../database/entities/task.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), JwtModule.register({})],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService, TypeOrmModule],
})
export class TaskModule {}
