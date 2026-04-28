import React from 'react';
import { Chip } from '@mui/material';
import { getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status, variant = 'outlined' }) => {
  const color = getStatusColor(status);
  
  return (
    <Chip
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      color={color}
      variant={variant}
      size="small"
    />
  );
};

export default StatusBadge;
