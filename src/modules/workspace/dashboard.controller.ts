import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { DataSource } from 'typeorm';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('workspaces/:workspaceId/dashboard')
export class DashboardController {
  constructor(private readonly dataSource: DataSource) {}

  @ApiOperation({
    summary: 'Get workspace and project dashboard summary metrics',
  })
  @Get(['summary', 'metrics'])
  async getSummary(@Param('workspaceId') workspaceId: string) {
    // 1. Total Projects Count
    const projectCountRes = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM projects WHERE "workspaceId" = $1`,
      [workspaceId],
    );
    const totalProjects = projectCountRes[0]?.count || 0;

    // 2. Tasks Status Distribution
    const statusDistribution = await this.dataSource.query(
      `SELECT status, COUNT(*)::int as count FROM tasks WHERE "workspaceId" = $1 AND "deletedAt" IS NULL GROUP BY status`,
      [workspaceId],
    );

    // 3. Overdue Tasks (dueDate in the past and not completed)
    const overdueRes = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM tasks WHERE "workspaceId" = $1 AND "dueDate" < NOW() AND status != 'DONE' AND "deletedAt" IS NULL`,
      [workspaceId],
    );
    const overdueTasks = overdueRes[0]?.count || 0;

    // 4. Upcoming Tasks (due in next 7 days and not completed)
    const upcomingRes = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM tasks WHERE "workspaceId" = $1 AND "dueDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days' AND status != 'DONE' AND "deletedAt" IS NULL`,
      [workspaceId],
    );
    const upcomingTasks = upcomingRes[0]?.count || 0;

    // 5. Task Distribution by Priority
    const priorityDistribution = await this.dataSource.query(
      `SELECT priority, COUNT(*)::int as count FROM tasks WHERE "workspaceId" = $1 AND "deletedAt" IS NULL GROUP BY priority`,
      [workspaceId],
    );

    // 6. Member Productivity (Completed tasks per member)
    const memberProductivity = await this.dataSource.query(
      `
      SELECT u.id as "userId", u.name, u.avatar, COUNT(t.id)::int as "completedTasksCount"
      FROM tasks t
      INNER JOIN users u ON t."assignedTo" = u.id
      WHERE t."workspaceId" = $1 AND t.status = 'DONE' AND t."deletedAt" IS NULL
      GROUP BY u.id, u.name, u.avatar
      ORDER BY "completedTasksCount" DESC
      `,
      [workspaceId],
    );

    // Calculate Completion Rate
    let totalTasks = 0;
    let completedTasks = 0;
    statusDistribution.forEach((item: any) => {
      totalTasks += item.count;
      if (item.status === 'DONE') {
        completedTasks = item.count;
      }
    });
    const completionRate =
      totalTasks > 0
        ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2))
        : 0;

    return {
      counts: {
        totalTasks,
        completedTasks,
        overdueTasks,
        upcomingTasks,
      },
      totalProjects,
      completionRate,
      statusDistribution,
      priorityDistribution,
      memberProductivity,
    };
  }
}
