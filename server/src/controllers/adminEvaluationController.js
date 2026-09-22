const SubjectiveEvaluation = require('../models/SubjectiveEvaluation');
const ExamSession = require('../models/ExamSession');
const Question = require('../models/Question');
const Student = require('../models/Student');
const { evaluateSubjectiveAnswer } = require('../services/aiEvaluationService');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Helper to recompute and persist total scores for an exam session
 */
const recalculateSessionScores = async (sessionId) => {
  const session = await ExamSession.findOne({ sessionId });
  if (!session) return null;

  const evaluations = await SubjectiveEvaluation.find({ sessionId });
  let totalSubjective = 0;
  let totalSubjectivePossible = 0;

  for (const ev of evaluations) {
    totalSubjectivePossible += ev.maxMarks;
    // Priority: Admin Override > AI Evaluation
    const effectiveMarks =
      ev.status === 'OVERRIDDEN' && ev.overrideMarks !== undefined ? ev.overrideMarks : ev.aiMarks || 0;
    totalSubjective += effectiveMarks;
  }

  session.subjectiveScore = totalSubjective;
  session.totalSubjectivePossible = totalSubjectivePossible;
  session.totalScore = (session.score || 0) + totalSubjective;

  const hasPendingOrFailed = evaluations.some((e) => e.status === 'FAILED' || e.status === 'PENDING');
  session.evaluationStatus = hasPendingOrFailed ? 'PARTIALLY_EVALUATED' : 'EVALUATED';

  await session.save();

  // Trigger real-time leaderboard update if evaluated (Phase 6)
  if (session.evaluationStatus === 'EVALUATED') {
    try {
      const { finalizeExamResult } = require('../services/leaderboardService');
      await finalizeExamResult(session);
    } catch (err) {
      console.error('[Admin Override Leaderboard Sync Error]:', err.message);
    }
  }

  return session;
};

/**
 * @desc    Get all subjective evaluations for admin review
 * @route   GET /api/admin/evaluations
 * @access  Protected (Admin)
 */
const getEvaluations = async (req, res, next) => {
  try {
    const { status, sessionId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (sessionId) query.sessionId = sessionId;

    const skip = (Number(page) - 1) * Number(limit);

    const [evaluations, total] = await Promise.all([
      SubjectiveEvaluation.find(query)
        .populate('studentId', 'name rollNumber branch')
        .populate('questionId', 'question marks expectedAnswer importantPoints')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SubjectiveEvaluation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      evaluations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single evaluation by ID
 * @route   GET /api/admin/evaluations/:evaluationId
 * @access  Protected (Admin)
 */
const getEvaluationById = async (req, res, next) => {
  try {
    const { evaluationId } = req.params;

    const evaluation = await SubjectiveEvaluation.findById(evaluationId)
      .populate('studentId', 'name rollNumber branch year')
      .populate('questionId', 'question marks expectedAnswer importantPoints')
      .populate('overriddenBy', 'username');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation record not found.',
      });
    }

    res.status(200).json({
      success: true,
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retry a FAILED evaluation
 * @route   POST /api/admin/evaluations/:evaluationId/retry
 * @access  Protected (Admin)
 */
const retryEvaluation = async (req, res, next) => {
  try {
    const { evaluationId } = req.params;

    const evaluation = await SubjectiveEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation record not found.',
      });
    }

    // Rule 12: Only FAILED evaluations can be retried
    if (evaluation.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: `Only FAILED evaluations can be retried. Current status is ${evaluation.status}.`,
      });
    }

    const question = await Question.findById(evaluation.questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Associated question not found.',
      });
    }

    const result = await evaluateSubjectiveAnswer({
      question: question.question,
      expectedAnswer: question.expectedAnswer,
      importantPoints: question.importantPoints,
      maxMarks: evaluation.maxMarks,
      studentAnswer: evaluation.studentAnswer,
    });

    evaluation.aiMarks = result.marks;
    evaluation.aiReason = result.reason;
    evaluation.status = result.status;
    evaluation.errorMessage = result.error || '';
    evaluation.evaluatedAt = new Date();
    await evaluation.save();

    // Recalculate session scores
    await recalculateSessionScores(evaluation.sessionId);

    logSecurityEvent('ADMIN_EVALUATION_RETRY', {
      adminId: req.user.id,
      evaluationId,
      newStatus: evaluation.status,
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation retried successfully.',
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually override marks by Admin (Requirement 13)
 * @route   PATCH /api/admin/evaluations/:evaluationId/override
 * @access  Protected (Admin)
 */
const overrideEvaluation = async (req, res, next) => {
  try {
    const { evaluationId } = req.params;
    const { overrideMarks, overrideReason } = req.body;

    if (overrideMarks === undefined || isNaN(Number(overrideMarks))) {
      return res.status(400).json({
        success: false,
        message: 'Valid override marks are required.',
      });
    }

    if (!overrideReason || typeof overrideReason !== 'string' || !overrideReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A clear reason for the manual override is required.',
      });
    }

    const evaluation = await SubjectiveEvaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation record not found.',
      });
    }

    const marksNum = Number(overrideMarks);
    // Strict validation: 0 <= marks <= maxMarks
    if (marksNum < 0 || marksNum > evaluation.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Override marks must be between 0 and maximum marks (${evaluation.maxMarks}).`,
      });
    }

    evaluation.overrideMarks = marksNum;
    evaluation.overrideReason = overrideReason.trim();
    evaluation.overriddenBy = req.user.id;
    evaluation.overriddenAt = new Date();
    evaluation.status = 'OVERRIDDEN';
    await evaluation.save();

    // Recalculate session scores using override priority
    const updatedSession = await recalculateSessionScores(evaluation.sessionId);

    logSecurityEvent('ADMIN_EVALUATION_OVERRIDE', {
      adminId: req.user.id,
      evaluationId,
      originalAiMarks: evaluation.aiMarks,
      overrideMarks: marksNum,
      reason: overrideReason.trim(),
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation overridden successfully. Final score updated.',
      evaluation,
      session: {
        sessionId: updatedSession.sessionId,
        mcqScore: updatedSession.score,
        subjectiveScore: updatedSession.subjectiveScore,
        totalScore: updatedSession.totalScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvaluations,
  getEvaluationById,
  retryEvaluation,
  overrideEvaluation,
};

