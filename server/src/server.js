require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { logSecurityEvent } = require('./utils/securityLogger');
const { initSocketServer } = require('./sockets/leaderboardSocket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// 1. Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS configuration with explicit origin allowlist
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logSecurityEvent('CORS_ORIGIN_BLOCKED', { origin });
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
  })
);

// 3. Body parsers with strict size limits to prevent payload flooding (10kb)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Rate Limiting Configuration (Scaled for 150+ concurrent students sharing same college Wi-Fi/IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please try again later.',
  },
});
app.use('/api', apiLimiter);

// Auth Endpoint Rate Limiter (Allow up to 1000 logins/registrations per 15 min from same lab IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('AUTH_RATE_LIMIT_TRIGGERED', { ip: req.ip, path: req.originalUrl });
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
  },
});
app.use('/api/auth/student/login', authLimiter);
app.use('/api/auth/student/register', authLimiter);
app.use('/api/auth/admin/login', authLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const { getDBStatus } = require('./config/db');
  res.status(200).json({
    status: 'online',
    service: 'NSS Recruitment Online Test Portal - Backend API',
    mongoDB: getDBStatus && getDBStatus() ? 'Connected' : 'Not Connected',
    timestamp: new Date().toISOString(),
  });
});

// Database readiness check middleware for /api routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const { getDBStatus } = require('./config/db');
  if (!getDBStatus()) {
    return res.status(503).json({
      success: false,
      message: 'Database is still connecting. Please retry in a few seconds.',
    });
  }
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/exams', leaderboardRoutes);

// 404 Fallback
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO server
initSocketServer(server);

server.listen(PORT, () => {
  console.log(`[Server] NSS Backend API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});

module.exports = { app, server };
