import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubtaskService } from './subtask.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';

@ApiTags('Subtasks Hierarchy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('workspaces/:workspaceId/tasks/:taskId')
export class SubtaskController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @ApiOperation({
    summary: 'Get full subtask tree recursively starting from a task',
  })
  @Get('tree')
  async getTree(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.subtaskService.getTaskTree(taskId, workspaceId);
  }

  @ApiOperation({
    summary: 'Get all descendants of a task (flattened subtasks list)',
  })
  @Get('descendants')
  async getDescendants(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.subtaskService.getDescendants(taskId, workspaceId);
  }

  @ApiOperation({
    summary: 'Get all ancestors of a task (path up to root task)',
  })
  @Get('ancestors')
  async getAncestors(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.subtaskService.getAncestors(taskId, workspaceId);
  }
}
