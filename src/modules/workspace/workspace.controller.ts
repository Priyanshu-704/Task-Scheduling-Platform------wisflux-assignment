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
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, Permission } from '../../common/constants';

class UpdateWorkspaceDto {
  name: string;
}

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(userId, dto.name, dto.slug);
  }

  @ApiOperation({ summary: 'Get all workspaces of the current user' })
  @Get()
  async getUserWorkspaces(@CurrentUser('userId') userId: string) {
    return this.workspaceService.getUserWorkspaces(userId);
  }

  @ApiOperation({ summary: 'Get workspace details by slug' })
  @UseGuards(RoleGuard)
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.workspaceService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Get workspace details by ID' })
  @UseGuards(RoleGuard)
  @Get(':workspaceId')
  async getById(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.findById(workspaceId);
  }

  @ApiOperation({ summary: 'Update workspace details' })
  @UseGuards(RoleGuard, PermissionGuard)
  @Permissions(Permission.WORKSPACE_UPDATE)
  @Patch(':workspaceId')
  async update(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(workspaceId, userId, dto.name);
  }

  @ApiOperation({ summary: 'Delete a workspace' })
  @UseGuards(RoleGuard, PermissionGuard)
  @Permissions(Permission.WORKSPACE_DELETE)
  @Delete(':workspaceId')
  async delete(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.workspaceService.deleteWorkspace(workspaceId, userId);
  }

  @ApiOperation({ summary: 'Invite a member to the workspace' })
  @UseGuards(RoleGuard, PermissionGuard)
  @Permissions(Permission.WORKSPACE_INVITE)
  @Post([':workspaceId/invite', ':workspaceId/members/invite'])
  async invite(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspaceService.inviteMember(
      workspaceId,
      userId,
      dto.email,
      dto.role,
    );
  }

  @ApiOperation({ summary: 'Get workspace members list' })
  @UseGuards(RoleGuard)
  @Get(':workspaceId/members')
  async getMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspaceService.getMembers(workspaceId);
  }
}
