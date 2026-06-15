import React from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AlarmIcon from '@mui/icons-material/Alarm';
import DateRangeIcon from '@mui/icons-material/DateRange';

import type { RootState } from '../app/store/store';
import { useGetDashboardMetricsQuery } from '../app/api/endpoints';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard: React.FC = () => {
  const activeWorkspaceId = useSelector((state: RootState) => state.workspace.activeWorkspaceId);

  const { data: metrics, isLoading, error } = useGetDashboardMetricsQuery(activeWorkspaceId!, {
    skip: !activeWorkspaceId,
  });

  if (!activeWorkspaceId) {
    return (
      <EmptyState
        title="No Workspace Selected"
        description="Please choose or create a workspace from the sidebar switcher to load analytics metrics."
      />
    );
  }

  if (isLoading) return <Loader />;

  if (error || !metrics) {
    return (
      <EmptyState
        title="No Data Available"
        description="We couldn't retrieve any workspace analytics. Try creating a project and adding tasks to generate statistics!"
      />
    );
  }

  const { counts, statusDistribution, priorityDistribution } = metrics;

  const total = Number(counts.totalTasks || 0);
  const completed = Number(counts.completedTasks || 0);
  const overdue = Number(counts.overdueTasks || 0);
  const upcoming = Number(counts.upcomingTasks || 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Format distributions for charts
  const statusChartData = statusDistribution.map((item: any) => ({
    name: item.status,
    value: Number(item.count),
  }));

  const priorityChartData = priorityDistribution.map((item: any) => ({
    name: item.priority,
    value: Number(item.count),
  }));

  const stats = [
    { title: 'Total Tasks', value: total, icon: <AssignmentIcon fontSize="large" color="primary" />, color: 'primary.main' },
    { title: 'Completed Tasks', value: completed, icon: <CheckCircleIcon fontSize="large" color="success" />, color: 'success.main' },
    { title: 'Overdue Tasks', value: overdue, icon: <AlarmIcon fontSize="large" color="error" />, color: 'error.main' },
    { title: 'Upcoming Tasks', value: upcoming, icon: <DateRangeIcon fontSize="large" color="warning" />, color: 'warning.main' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-0.02em' }}>
        Workspace Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Overview of task distributions, team performance, and status metrics.
      </Typography>

      {/* Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
                {stat.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Completion Progress */}
      <Card sx={{ mb: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Workspace Task Completion Rate</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }} color="secondary.main">{completionRate}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={completionRate} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
      </Card>

      {/* Charts Grid */}
      <Grid container spacing={3}>
        {/* Status Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Tasks by Status</Typography>
              <Box sx={{ height: 260 }}>
                {statusChartData.length === 0 ? (
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No status data available</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', minHeight: 380 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Tasks by Priority</Typography>
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {priorityChartData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No priority data available</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {priorityChartData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Dashboard;
