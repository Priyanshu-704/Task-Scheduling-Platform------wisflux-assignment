import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

interface LoaderProps {
  fullScreen?: boolean;
  size?: number;
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, size = 40 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '200px',
        width: '100%',
      }}
    >
      <CircularProgress size={size} color="inherit" />
    </Box>
  );
};
export default Loader;
