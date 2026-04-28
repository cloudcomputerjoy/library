import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminIssueBooks from './AdminIssueBooks';
import AdminReturnBooks from './AdminReturnBooks';

const TAB_TO_KEY = ['issue', 'return'];

const IssueReturnCenter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabKey = (searchParams.get('tab') || 'issue').toLowerCase();
  const tabIndex = Math.max(0, TAB_TO_KEY.indexOf(tabKey));

  const handleTabChange = (_, newValue) => {
    navigate(`/transactions?tab=${TAB_TO_KEY[newValue]}`, { replace: true });
  };

  return (
    <Box>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden', boxShadow: 2 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ px: 2 }}>
          <Tab label="Issue Books" />
          <Tab label="Return Books" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && <AdminIssueBooks />}
      {tabIndex === 1 && <AdminReturnBooks />}
    </Box>
  );
};

export default IssueReturnCenter;
