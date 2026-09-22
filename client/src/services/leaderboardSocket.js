import { io } from 'socket.io-client';

let socket = null;

// Determine socket server URL
const getSocketUrl = () => {
  // In development, server runs on http://localhost:5000
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

/**
 * Get or initialize the Socket.IO client instance
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
    });
  }
  return socket;
};

/**
 * Join an exam-specific room and subscribe to leaderboard updates
 *
 * @param {string} examId - Exam ID
 * @param {Function} onUpdate - Callback invoked when a real-time leaderboard update arrives
 * @param {Function} onStatusChange - Callback to notify connection state changes (connected/disconnected)
 * @returns {Function} - Cleanup unsubscribe function
 */
export const subscribeToExamLeaderboard = (examId, onUpdate, onStatusChange) => {
  const sock = getSocket();

  if (!sock.connected) {
    sock.connect();
  }

  const handleConnect = () => {
    sock.emit('leaderboard:join', { examId });
    if (onStatusChange) onStatusChange('connected');
  };

  const handleDisconnect = () => {
    if (onStatusChange) onStatusChange('disconnected');
  };

  const handleConnectError = () => {
    if (onStatusChange) onStatusChange('error');
  };

  const handleUpdate = (data) => {
    if (data && (!data.examId || data.examId.toString() === examId.toString())) {
      if (onUpdate) onUpdate(data);
    }
  };

  // Join room immediately if already connected
  if (sock.connected) {
    handleConnect();
  }

  sock.on('connect', handleConnect);
  sock.on('disconnect', handleDisconnect);
  sock.on('connect_error', handleConnectError);
  sock.on('leaderboard:update', handleUpdate);

  // Return unsubscribe cleanup function
  return () => {
    sock.emit('leaderboard:leave', { examId });
    sock.off('connect', handleConnect);
    sock.off('disconnect', handleDisconnect);
    sock.off('connect_error', handleConnectError);
    sock.off('leaderboard:update', handleUpdate);
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

