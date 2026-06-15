import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class UpdateProjectDto {
  name?: string;
  description?: string;
  status?: string;
}

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @ApiOperation({ summary: 'Create a new project in a workspace' })
  @UseGuards(PermissionGuard)
  @Permissions(Permission.PROJECT_CREATE)
  @Post()
  async create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.createProject(
      workspaceId,
      userId,
      dto.name,
      dto.description,
    );
  }

  @ApiOperation({ summary: 'List all active projects in a workspace' })
  @Get()
  async list(@Param('workspaceId') workspaceId: string) {
    return this.projectService.getProjects(workspaceId);
  }

  @ApiOperation({ summary: 'Get project details' })
  @Get(':projectId')
  async get(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectService.findById(projectId, workspaceId);
  }

  @ApiOperation({ summary: 'Update project details' })
  @UseGuards(PermissionGuard)
  @Permissions(Permission.PROJECT_UPDATE)
  @Patch(':projectId')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(
      projectId,
      workspaceId,
      userId,
      dto.name,
      dto.description,
      dto.status,
    );
  }

  @ApiOperation({ summary: 'Delete a project' })
  @UseGuards(PermissionGuard)
  @Permissions(Permission.PROJECT_DELETE)
  @Delete(':projectId')
  async delete(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.projectService.deleteProject(projectId, workspaceId, userId);
  }
}
