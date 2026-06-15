import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('workspaces/:workspaceId/tasks/:taskId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @ApiOperation({ summary: 'Add a comment to a task' })
  @Post()
  async add(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.addComment(
      workspaceId,
      taskId,
      userId,
      dto.message,
    );
  }

  @ApiOperation({ summary: 'List all comments on a task' })
  @Get()
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.commentService.getComments(taskId, workspaceId);
  }
}
