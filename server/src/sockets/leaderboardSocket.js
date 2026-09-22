const { Server } = require('socket.io');

let io = null;

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/**
 * Initialize Socket.IO server attached to HTTP server
 */
const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  io.on('connection', (socket) => {
    // Client joins specific exam room to prevent cross-exam broadcasting
    socket.on('leaderboard:join', ({ examId }) => {
      if (examId) {
        const room = `leaderboard:exam:${examId}`;
        socket.join(room);
      }
    });

    socket.on('leaderboard:leave', ({ examId }) => {
      if (examId) {
        const room = `leaderboard:exam:${examId}`;
        socket.leave(room);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

/**
 * Emit leaderboard update event to the specific exam room
 * Clients will re-fetch latest data from authoritative REST API
 *
 * @param {string} examId - ID of the exam that updated
 */
const emitLeaderboardUpdate = (examId) => {
  if (!io) return;
  const room = `leaderboard:exam:${examId}`;
  io.to(room).emit('leaderboard:update', {
    examId: examId.toString(),
    timestamp: new Date().toISOString(),
  });
};

const getIO = () => io;

module.exports = {
  initSocketServer,
  emitLeaderboardUpdate,
  getIO,
};

