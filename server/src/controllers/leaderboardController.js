const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const {
  getPublicLeaderboard,
  getAdminLeaderboard,
} = require('../services/leaderboardService');

/**
 * @desc    Get public live leaderboard for an exam
 * @route   GET /api/exams/:examId/leaderboard
 * @access  Protected (Student or Admin)
 */
const getExamLeaderboard = async (req, res, next) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Exam ID format.',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Only compute myRank if logged in as student
    const currentStudentId = req.user?.role === 'student' ? req.user.id : null;
    const data = await getPublicLeaderboard(examId, currentStudentId);

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed admin leaderboard for an exam
 * @route   GET /api/exams/:examId/leaderboard/admin
 * @access  Protected (Admin only)
 */
const getAdminExamLeaderboard = async (req, res, next) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Exam ID format.',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    const data = await getAdminLeaderboard(examId);

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExamLeaderboard,
  getAdminExamLeaderboard,
};

