import { useEffect } from 'react';
import io from 'socket.io-client';
import { useAdmin } from '../context/AdminContext';

export const useSocket = (events = []) => {
  const { token } = useAdmin();

  useEffect(() => {
    if (!token) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    events.forEach(({ event, callback }) => {
      socket.on(event, callback);
    });

    return () => {
      events.forEach(({ event }) => socket.off(event));
      socket.disconnect();
    };
  }, [token, events]);
};
