import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilesService } from '../files/files.service';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller()
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly filesService: FilesService,
  ) {}

  @ApiOperation({ summary: 'Create a task in a project' })
  @UseGuards(PermissionGuard)
  @Permissions(Permission.TASK_CREATE)
  @Post('workspaces/:workspaceId/projects/:projectId/tasks')
  async create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.createTask(workspaceId, projectId, userId, dto);
  }

  @ApiOperation({
    summary: 'List tasks in a project with filtering/sorting/search',
  })
  @Get('workspaces/:workspaceId/projects/:projectId/tasks')
  async list(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Query() query: QueryTaskDto,
  ) {
    return this.taskService.getTasks(workspaceId, projectId, query);
  }

  @ApiOperation({ summary: 'Get task details' })
  @Get('workspaces/:workspaceId/tasks/:taskId')
  async get(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.findById(taskId, workspaceId);
  }

  @ApiOperation({ summary: 'Update task details' })
  @UseGuards(PermissionGuard)
  @Permissions(Permission.TASK_UPDATE)
  @Put('workspaces/:workspaceId/tasks/:taskId')
  @Patch('workspaces/:workspaceId/tasks/:taskId')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(taskId, workspaceId, userId, dto);
  }

  @ApiOperation({ summary: 'Delete a task (Soft Delete)' })
  @UseGuards(PermissionGuard)
  @Permissions(Permission.TASK_DELETE)
  @Delete('workspaces/:workspaceId/tasks/:taskId')
  async delete(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.taskService.deleteTask(taskId, workspaceId, userId);
  }

  @ApiOperation({
    summary:
      'Generate presigned S3/MinIO upload/download URLs for task attachments',
  })
  @Get('workspaces/:workspaceId/tasks/:taskId/attachments/presign')
  async getAttachmentPresign(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    const key = `workspaces/${workspaceId}/tasks/${taskId}/${uuidv4()}-${filename}`;
    const uploadUrl = await this.filesService.getUploadPresignedUrl(
      key,
      contentType,
    );
    const downloadUrl = await this.filesService.getDownloadPresignedUrl(key);
    return { uploadUrl, downloadUrl, key };
  }
}
