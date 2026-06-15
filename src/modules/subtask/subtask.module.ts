import { Module } from '@nestjs/common';
import { SubtaskService } from './subtask.service';
import { SubtaskController } from './subtask.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [SubtaskService],
  controllers: [SubtaskController],
  exports: [SubtaskService],
})
export class SubtaskModule {}
