import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useSocket } from '../../hooks';
import { formatDateTime } from '../../utils/formatters';

const LiveFeed = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for entry events
    const handleEntryEvent = (data) => {
      setEvents((prev) => [
        {
          id: Date.now(),
          type: 'entry',
          user: data.userName,
          time: new Date(),
          message: `${data.userName} entered`,
        },
        ...prev.slice(0, 9),
      ]);
    };

    // Listen for exit events
    const handleExitEvent = (data) => {
      setEvents((prev) => [
        {
          id: Date.now(),
          type: 'exit',
          user: data.userName,
          time: new Date(),
          message: `${data.userName} exited`,
        },
        ...prev.slice(0, 9),
      ]);
    };

    socket.on('entry-event', handleEntryEvent);
    socket.on('exit-event', handleExitEvent);

    return () => {
      socket.off('entry-event', handleEntryEvent);
      socket.off('exit-event', handleExitEvent);
    };
  }, [socket]);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Live Feed
        </Typography>
        {loading && <CircularProgress />}
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {events.length === 0 ? (
            <Typography color="textSecondary" align="center">
              No recent activity
            </Typography>
          ) : (
            events.map((event) => (
              <ListItem key={event.id} divider>
                <ListItemText
                  primary={event.message}
                  secondary={formatDateTime(event.time)}
                />
                <Chip
                  label={event.type}
                  size="small"
                  color={event.type === 'entry' ? 'success' : 'error'}
                  variant="outlined"
                />
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default LiveFeed;
