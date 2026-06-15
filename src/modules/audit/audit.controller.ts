import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  @ApiOperation({ summary: 'Get security audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @Get('audit-logs')
  async getAuditLogs(
    @CurrentUser('email') email: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    if (email !== 'admin@gmail.com') {
      throw new ForbiddenException('Only system administrators can access global security audit logs.');
    }

    const [items, total] = await this.auditLogRepository.findAndCount({
      relations: { user: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { items, total };
  }
}
