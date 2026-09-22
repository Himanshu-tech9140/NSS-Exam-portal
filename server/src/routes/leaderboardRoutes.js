const express = require('express');
const router = express.Router();
const {
  getExamLeaderboard,
  getAdminExamLeaderboard,
} = require('../controllers/leaderboardController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Public/Student leaderboard: requires authentication (student or admin)
router.get('/:examId/leaderboard', verifyToken, getExamLeaderboard);

// Admin detailed leaderboard: requires admin authentication
router.get('/:examId/leaderboard/admin', verifyToken, requireAdmin, getAdminExamLeaderboard);

module.exports = router;

