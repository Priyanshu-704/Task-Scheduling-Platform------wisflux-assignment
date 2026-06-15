import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';

import { useSelector } from 'react-redux';
import type { RootState } from '../app/store/store';
import { useGetAdminAuditLogsQuery } from '../app/api/endpoints';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

export const Admin: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: auditData, isLoading, error } = useGetAdminAuditLogsQuery({ limit: 50, page: 1 }, {
    skip: user?.email !== 'admin@gmail.com',
  });
  const logs = auditData?.items || [];

  if (user?.email !== 'admin@gmail.com') {
    return (
      <EmptyState
        title="Admin Privileges Required"
        description="Only system administrators can access global security audit logs and logs metadata."
      />
    );
  }

  const columns: GridColDef[] = [
    { field: 'action', headerName: 'Action Event', flex: 1.2 },
    {
      field: 'user',
      headerName: 'Performer Email',
      flex: 1.5,
      valueGetter: (value: any) => value?.email || 'System / Auto',
    },
    {
      field: 'ipAddress',
      headerName: 'IP Address',
      flex: 1,
      valueGetter: (_value: any, row: any) => row?.payload?.ipAddress || 'N/A',
    },
    {
      field: 'deviceFingerprint',
      headerName: 'Device Details',
      flex: 2,
      valueGetter: (_value: any, row: any) => row?.payload?.deviceFingerprint || 'N/A',
    },
    {
      field: 'createdAt',
      headerName: 'Timestamp',
      flex: 1.3,
      valueGetter: (value: any) => new Date(value).toLocaleString(),
    },
  ];

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <EmptyState
        title="Admin Privileges Required"
        description="Only system administrators can access global security audit logs and logs metadata."
      />
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
        Administration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Review security audit logs, active connections, and session telemetry.
      </Typography>

      <Card sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: 450, width: '100%' }}>
            <DataGrid
              rows={logs}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 20]}
              sx={{ border: 'none' }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default Admin;
