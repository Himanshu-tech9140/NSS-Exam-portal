const crypto = require('crypto');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');
const Answer = require('../models/Answer');
const Student = require('../models/Student');
const Violation = require('../models/Violation');
const SubjectiveEvaluation = require('../models/SubjectiveEvaluation');
const ExamResult = require('../models/ExamResult');
const { evaluateSessionSubjectives } = require('../services/aiEvaluationService');
const { logSecurityEvent } = require('../utils/securityLogger');
const { emitLeaderboardUpdate } = require('../sockets/leaderboardSocket');

// Standard human-readable reason mapping for anti-cheat violations
const VIOLATION_REASONS = {
  TAB_SWITCH: 'Tab switch detected.',
  WINDOW_BLUR: 'Window focus was lost.',
  FULLSCREEN_EXIT: 'Fullscreen was exited.',
  COPY_ATTEMPT: 'Copy attempt detected.',
  PASTE_ATTEMPT: 'Paste attempt detected.',
  CUT_ATTEMPT: 'Cut attempt detected.',
  RIGHT_CLICK: 'Right-click context menu attempt detected.',
  TEXT_SELECTION: 'Prohibited text selection detected.',
  RESTRICTED_SHORTCUT: 'Restricted keyboard shortcut used.',
  PRINT_ATTEMPT: 'Print screen or print page attempt detected.',
  SAVE_ATTEMPT: 'Page save attempt detected.',
  MULTIPLE_SESSION: 'Multiple active sessions detected on another device or tab.',
};

// Utility to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Verify device/session token to prevent concurrent tab/device hijacking
 */
const verifySessionSecurity = (req, session) => {
  // 1. Session ownership check
  if (session.studentId.toString() !== req.user.id.toString()) {
    logSecurityEvent('UNAUTHORIZED_SESSION_ACCESS', {
      studentId: req.user.id,
      sessionOwner: session.studentId,
      sessionId: session.sessionId,
    });
    return {
      valid: false,
      status: 403,
      message: 'Access denied: You do not own this exam session.',
    };
  }

  // 2. Client session token verification (if hash is stored)
  if (session.sessionTokenHash) {
    const clientToken =
      req.headers['x-session-token'] ||
      req.body?.clientSessionToken ||
      req.query?.clientSessionToken;

    if (!clientToken || typeof clientToken !== 'string') {
      logSecurityEvent('SESSION_TOKEN_MISSING', {
        studentId: req.user.id,
        sessionId: session.sessionId,
        ip: req.ip,
      });
      return {
        valid: false,
        status: 403,
        message: 'Session token required. Concurrent or unverified device access blocked.',
      };
    }

    const calculatedHash = crypto.createHash('sha256').update(clientToken.trim()).digest('hex');
    if (calculatedHash !== session.sessionTokenHash) {
      logSecurityEvent('SESSION_TOKEN_MISMATCH', {
        studentId: req.user.id,
        sessionId: session.sessionId,
        ip: req.ip,
      });
      return {
        valid: false,
        status: 403,
        message: 'Session token mismatch: Another session or device is active.',
      };
    }
  }

  return { valid: true };
};

/**
 * Internal helper to atomically calculate MCQ score and finalize session
 */
const finalizeSessionScoring = async (session, isAutoSubmitted = false) => {
  if (
    session.status === 'COMPLETED' ||
    session.status === 'AUTO_SUBMITTED' ||
    session.status === 'TERMINATED'
  ) {
    return session;
  }

  // Fetch all assigned questions
  const questions = await Question.find({
    _id: { $in: session.assignedQuestionIds },
  });

  // Fetch all saved answers for this session
  const answers = await Answer.find({ sessionId: session._id });
  const answersMap = {};
  for (const ans of answers) {
    answersMap[ans.questionId.toString()] = ans.answer;
  }

  let totalMCQScore = 0;
  let totalMCQPossible = 0;

  for (const q of questions) {
    if (q.type === 'MCQ') {
      totalMCQPossible += q.marks || 1;
      const studentAns = (answersMap[q._id.toString()] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();

      if (studentAns && studentAns === correctAns) {
        totalMCQScore += q.marks || 1;
      }
    }
  }

  // Atomically update session: prevents race conditions
  const updatedSession = await ExamSession.findOneAndUpdate(
    { _id: session._id, status: 'IN_PROGRESS' },
    {
      $set: {
        status: isAutoSubmitted ? 'AUTO_SUBMITTED' : 'COMPLETED',
        score: totalMCQScore,
        totalPossibleScore: totalMCQPossible,
        submittedAt: new Date(),
      },
    },
    { new: true }
  );

  const finalSession = updatedSession || session;

  // Trigger subjective answer AI evaluation (Phase 5)
  if (finalSession.status === 'COMPLETED' || finalSession.status === 'AUTO_SUBMITTED') {
    try {
      await evaluateSessionSubjectives(finalSession);
    } catch (evalErr) {
      console.error('[AI Evaluation Error]:', evalErr.message);
    }
  }

  return finalSession;
};

/**
 * @desc    Get active NSS exam for students to view on dashboard
 * @route   GET /api/exam/active
 * @access  Protected (Student)
 */
const getActiveExam = async (req, res, next) => {
  try {
    const exam = await Exam.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!exam) {
      return res.status(200).json({
        success: true,
        exam: null,
        message: 'No active recruitment exam at this time.',
      });
    }

    // Check if current student already has a session
    const existingSession = await ExamSession.findOne({
      studentId: req.user.id,
      examId: exam._id,
    });

    let sessionStatus = 'NOT_STARTED';
    let sessionId = null;
    let terminationReason = null;

    if (existingSession) {
      if (existingSession.status === 'TERMINATED') {
        sessionStatus = 'TERMINATED';
        terminationReason = existingSession.terminationReason;
      } else if (
        existingSession.status === 'IN_PROGRESS' &&
        Date.now() >= existingSession.expiresAt.getTime()
      ) {
        await finalizeSessionScoring(existingSession, true);
        sessionStatus = 'AUTO_SUBMITTED';
      } else {
        sessionStatus = existingSession.status;
      }
      sessionId = existingSession.sessionId;
    }

    res.status(200).json({
      success: true,
      exam: {
        id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        totalQuestions: 20,
        mcqCount: 15,
        subjectiveCount: 5,
        sessionStatus,
        sessionId,
        terminationReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start an exam or retrieve existing active session (Requirement 3 & 4)
 * @route   POST /api/exam/:examId/start
 * @access  Protected (Student)
 */
const startExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) {
      return res.status(404).json({
        success: false,
        message: 'The requested exam is either inactive or does not exist.',
      });
    }

    // Check if session already exists for this student + exam
    let session = await ExamSession.findOne({ studentId, examId });

    if (session) {
      // 1. If terminated, permanently block re-entry
      if (session.status === 'TERMINATED') {
        logSecurityEvent('RESUME_ATTEMPT_ON_TERMINATED_SESSION', { studentId, examId, sessionId: session.sessionId });
        return res.status(403).json({
          success: false,
          isTerminated: true,
          message: `This exam was terminated: ${session.terminationReason || 'Violation detected'}. You cannot resume or retake this exam.`,
          sessionId: session.sessionId,
          status: session.status,
          terminationReason: session.terminationReason,
        });
      }

      // 2. Check if expired
      if (session.status === 'IN_PROGRESS' && Date.now() >= session.expiresAt.getTime()) {
        session = await finalizeSessionScoring(session, true);
        return res.status(200).json({
          success: true,
          message: 'Time is over. Your exam has been submitted automatically.',
          isExpired: true,
          sessionId: session.sessionId,
          status: session.status,
        });
      }

      // 3. Completed or auto-submitted: cannot start again
      if (session.status === 'COMPLETED' || session.status === 'AUTO_SUBMITTED') {
        logSecurityEvent('DUPLICATE_START_AFTER_COMPLETION', { studentId, examId, sessionId: session.sessionId });
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this exam.',
          sessionId: session.sessionId,
          status: session.status,
        });
      }

      // 4. Return existing active session without regenerating questions (Requirement 3)
      // Issue refreshed clientSessionToken for the resuming session
      const clientSessionToken = crypto.randomBytes(32).toString('hex');
      session.sessionTokenHash = crypto.createHash('sha256').update(clientSessionToken).digest('hex');
      session.lastSeenAt = new Date();
      await session.save();

      return res.status(200).json({
        success: true,
        message: 'Resuming existing active exam session.',
        clientSessionToken,
        session: {
          sessionId: session.sessionId,
          examId: session.examId,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          status: session.status,
          duration: exam.duration,
        },
      });
    }

    // No existing session -> Select exactly 15 MCQs and 5 Subjective questions
    const allMCQs = await Question.find({ examId, type: 'MCQ' });
    const allSubjectives = await Question.find({ examId, type: 'SUBJECTIVE' });

    if (allMCQs.length < 15 || allSubjectives.length < 5) {
      console.warn(
        `[Exam Warning] Exam has ${allMCQs.length} MCQs and ${allSubjectives.length} Subjectives. Ideal: 15 MCQs, 5 Subjectives.`
      );
    }

    // Sample 15 MCQs (or all available if fewer)
    const shuffledMCQs = shuffleArray(allMCQs).slice(0, 15);

    // Sample 5 Subjectives (or all available if fewer)
    const shuffledSubjectives = shuffleArray(allSubjectives).slice(0, 5);

    // Combine and shuffle overall question order
    const combinedQuestions = shuffleArray([...shuffledMCQs, ...shuffledSubjectives]);
    const assignedQuestionIds = combinedQuestions.map((q) => q._id);

    // Randomize options for each MCQ and store in assignedOptionsMap
    const assignedOptionsMap = {};
    for (const q of combinedQuestions) {
      if (q.type === 'MCQ' && Array.isArray(q.options)) {
        assignedOptionsMap[q._id.toString()] = shuffleArray(q.options);
      }
    }

    const serverNow = new Date();
    const serverExpiresAt = new Date(serverNow.getTime() + exam.duration * 60 * 1000);
    // Cryptographically secure, unguessable session identifier (Requirement 4)
    const uniqueSessionId = `SESSION_${crypto.randomBytes(20).toString('hex')}`;

    // Cryptographically secure client session token
    const clientSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(clientSessionToken).digest('hex');

    session = await ExamSession.create({
      studentId,
      examId,
      sessionId: uniqueSessionId,
      startedAt: serverNow,
      expiresAt: serverExpiresAt,
      lastSeenAt: serverNow,
      status: 'IN_PROGRESS',
      assignedQuestionIds,
      assignedOptionsMap,
      sessionTokenHash,
    });

    res.status(201).json({
      success: true,
      message: 'Exam session started successfully.',
      clientSessionToken,
      session: {
        sessionId: session.sessionId,
        examId: session.examId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status,
        duration: exam.duration,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current exam session status
 * @route   GET /api/exam/session
 * @access  Protected (Student)
 */
const getSession = async (req, res, next) => {
  try {
    const { sessionId, examId } = req.query;
    const studentId = req.user.id;

    const query = { studentId };
    if (sessionId) query.sessionId = sessionId;
    if (examId) query.examId = examId;

    let session = await ExamSession.findOne(query);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No exam session found.',
      });
    }

    // Session Ownership Verification (Requirement 5)
    const securityCheck = verifySessionSecurity(req, session);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json({
        success: false,
        message: securityCheck.message,
      });
    }

    // Check if terminated
    if (session.status === 'TERMINATED') {
      return res.status(200).json({
        success: true,
        session: {
          sessionId: session.sessionId,
          examId: session.examId,
          status: session.status,
          terminationReason: session.terminationReason,
          terminatedAt: session.terminatedAt,
        },
      });
    }

    // Check server-side expiration
    if (session.status === 'IN_PROGRESS' && Date.now() >= session.expiresAt.getTime()) {
      session = await finalizeSessionScoring(session, true);
    }

    res.status(200).json({
      success: true,
      session: {
        sessionId: session.sessionId,
        examId: session.examId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status,
        totalQuestions: session.assignedQuestionIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get assigned questions and existing answers for active session
 * @route   GET /api/exam/session/questions
 * @access  Protected (Student)
 */
const getSessionQuestions = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const studentId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required.',
      });
    }

    let session = await ExamSession.findOne({ sessionId, studentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or does not belong to the current student.',
      });
    }

    // Session Ownership Verification (Requirement 5)
    const securityCheck = verifySessionSecurity(req, session);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json({
        success: false,
        message: securityCheck.message,
      });
    }

    // Check if terminated
    if (session.status === 'TERMINATED') {
      return res.status(200).json({
        success: true,
        isTerminated: true,
        message: 'Exam Terminated',
        reason: session.terminationReason || 'Prohibited action detected.',
        session: {
          sessionId: session.sessionId,
          status: session.status,
          terminatedAt: session.terminatedAt,
        },
        questions: [],
        answersMap: {},
      });
    }

    // Check server expiration
    if (session.status === 'IN_PROGRESS' && Date.now() >= session.expiresAt.getTime()) {
      session = await finalizeSessionScoring(session, true);
      return res.status(200).json({
        success: true,
        isExpired: true,
        message: 'Time is over. Your exam has been submitted automatically.',
        session: {
          sessionId: session.sessionId,
          status: session.status,
          expiresAt: session.expiresAt,
        },
        questions: [],
        answersMap: {},
      });
    }

    const exam = await Exam.findById(session.examId);

    // Fetch assigned questions in the exact order stored
    const questionsDocs = await Question.find({
      _id: { $in: session.assignedQuestionIds },
    });

    // Create an ID map for fast order retrieval
    const questionMap = {};
    for (const q of questionsDocs) {
      questionMap[q._id.toString()] = q;
    }

    // Build ordered list and strictly sanitize private answers (Requirement 8)
    const sanitizedQuestions = [];
    for (const qId of session.assignedQuestionIds) {
      const q = questionMap[qId.toString()];
      if (!q) continue;

      if (q.type === 'MCQ') {
        const randomizedOptions =
          session.assignedOptionsMap?.get(q._id.toString()) ||
          session.assignedOptionsMap?.[q._id.toString()] ||
          q.options;

        sanitizedQuestions.push({
          questionId: q._id,
          type: 'MCQ',
          question: q.question,
          options: randomizedOptions,
          marks: q.marks,
        });
      } else {
        sanitizedQuestions.push({
          questionId: q._id,
          type: 'SUBJECTIVE',
          question: q.question,
          marks: q.marks,
        });
      }
    }

    // Retrieve already saved answers
    const savedAnswers = await Answer.find({ sessionId: session._id });
    const answersMap = {};
    for (const ans of savedAnswers) {
      answersMap[ans.questionId.toString()] = ans.answer;
    }

    res.status(200).json({
      success: true,
      exam: {
        id: exam?._id,
        title: exam?.title || 'NSS Recruitment Online Test',
        duration: exam?.duration || 20,
      },
      session: {
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status,
      },
      questions: sanitizedQuestions,
      answersMap,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save/update an answer atomically with strict security checks (Requirement 7 & 9)
 * @route   POST /api/exam/session/answer
 * @access  Protected (Student)
 */
const saveAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId, answer } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !questionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and Question ID are required.',
      });
    }

    const session = await ExamSession.findOne({ sessionId, studentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found or does not belong to you.',
      });
    }

    // Session Ownership & Token Check (Requirement 5 & 14)
    const securityCheck = verifySessionSecurity(req, session);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json({
        success: false,
        message: securityCheck.message,
      });
    }

    // Verify session status: Reject if TERMINATED
    if (session.status === 'TERMINATED') {
      logSecurityEvent('ANSWER_AFTER_TERMINATION', { studentId, sessionId, questionId });
      return res.status(403).json({
        success: false,
        isTerminated: true,
        message: `Exam was terminated: ${session.terminationReason || 'Violation detected'}. No further answers can be saved.`,
      });
    }

    // Verify session status: Reject if COMPLETED or AUTO_SUBMITTED
    if (session.status !== 'IN_PROGRESS') {
      logSecurityEvent('ANSWER_AFTER_COMPLETION', { studentId, sessionId, questionId, status: session.status });
      return res.status(400).json({
        success: false,
        message: `Cannot save answer. Exam session is ${session.status}.`,
      });
    }

    // Verify server-side timer expiry (Requirement 6)
    if (Date.now() >= session.expiresAt.getTime()) {
      logSecurityEvent('ANSWER_AFTER_EXPIRY', { studentId, sessionId, questionId });
      await finalizeSessionScoring(session, true);
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: 'Time is over. Your exam has been submitted automatically.',
      });
    }

    // Verify question is part of assigned set (Requirement 7)
    const isAssigned = session.assignedQuestionIds.some(
      (id) => id.toString() === questionId.toString()
    );
    if (!isAssigned) {
      logSecurityEvent('SUSPICIOUS_UNASSIGNED_QUESTION', { studentId, sessionId, questionId });
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This question is not part of your assigned exam set.',
      });
    }

    // Upsert answer to avoid duplicates (Requirement 24)
    await Answer.findOneAndUpdate(
      { sessionId: session._id, questionId },
      {
        studentId,
        examId: session.examId,
        answer: typeof answer === 'string' ? answer.trim() : '',
        savedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Answer saved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit exam manually with atomic transition (Requirement 10 & 11)
 * @route   POST /api/exam/session/submit
 * @access  Protected (Student)
 */
const submitExam = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const studentId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required to submit.',
      });
    }

    const session = await ExamSession.findOne({ sessionId, studentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found.',
      });
    }

    // Session Ownership & Token Check (Requirement 5 & 14)
    const securityCheck = verifySessionSecurity(req, session);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json({
        success: false,
        message: securityCheck.message,
      });
    }

    // Prevent submission if already TERMINATED (Requirement 11 & 12)
    if (session.status === 'TERMINATED') {
      logSecurityEvent('SUBMIT_AFTER_TERMINATION', { studentId, sessionId });
      return res.status(403).json({
        success: false,
        isTerminated: true,
        message: 'This exam was terminated due to a violation and cannot be submitted.',
        sessionId: session.sessionId,
      });
    }

    // Prevent duplicate submission
    if (session.status === 'COMPLETED' || session.status === 'AUTO_SUBMITTED') {
      logSecurityEvent('DUPLICATE_SUBMISSION_ATTEMPT', { studentId, sessionId });
      return res.status(400).json({
        success: false,
        message: 'This exam session has already been submitted.',
        sessionId: session.sessionId,
        status: session.status,
      });
    }

    const isExpired = Date.now() >= session.expiresAt.getTime();
    const finalSession = await finalizeSessionScoring(session, isExpired);

    res.status(200).json({
      success: true,
      message: isExpired
        ? 'Time was over. Your exam has been submitted automatically.'
        : 'Exam submitted successfully.',
      sessionId: finalSession.sessionId,
      status: finalSession.status,
      score: finalSession.score,
      subjectiveScore: finalSession.subjectiveScore,
      totalScore: finalSession.totalScore,
      evaluationStatus: finalSession.evaluationStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record anti-cheat violation and terminate exam session atomically (Requirement 12)
 * @route   POST /api/exam/session/violation
 * @access  Protected (Student)
 */
const recordViolationAndTerminate = async (req, res, next) => {
  try {
    const { sessionId, type, metadata } = req.body;
    const studentId = req.user.id;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Violation type is required.',
      });
    }

    const defaultReason = VIOLATION_REASONS[type] || 'Prohibited action detected during active exam.';
    const reason = metadata?.customReason || defaultReason;

    // Locate the session (optionally by sessionId)
    const sessionQuery = { studentId };
    if (sessionId) sessionQuery.sessionId = sessionId;

    const session = await ExamSession.findOne(sessionQuery);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found.',
      });
    }

    // Increment violation count atomically
    const updatedSession = await ExamSession.findOneAndUpdate(
      { _id: session._id },
      { $inc: { violationCount: 1 } },
      { new: true }
    );

    // First violation → warning only (no termination)
    if (updatedSession.violationCount === 1) {
      logSecurityEvent('CHEAT_WARNING_ISSUED', {
        studentId,
        sessionId: updatedSession.sessionId,
        type,
        reason,
      });
      return res.status(200).json({
        success: true,
        warning: true,
        message: 'Cheating detected. One more violation will terminate the exam.',
        violationCount: updatedSession.violationCount,
        violationReason: reason,
      });
    }

    // Second or subsequent violation → terminate the session
    const finalSession = await ExamSession.findOneAndUpdate(
      { _id: updatedSession._id, status: 'IN_PROGRESS' },
      {
        $set: {
          status: 'TERMINATED',
          terminatedAt: new Date(),
          terminationReason: reason,
          lastSeenAt: new Date(),
        },
      },
      { new: true }
    );

    // Zero out the student's scores instead of deleting the result document
    await ExamResult.findOneAndUpdate(
      { studentId, examId: finalSession.examId },
      { $set: { mcqMarks: 0, subjectiveMarks: 0, totalMarks: 0 } },
      { new: true, upsert: true }
    );
    emitLeaderboardUpdate(finalSession.examId);

    // Record the violation in the Violation collection
    await Violation.create({
      studentId,
      examId: finalSession.examId,
      sessionId: finalSession.sessionId,
      type,
      timestamp: new Date(),
      metadata: metadata || {},
    });

    logSecurityEvent('EXAM_TERMINATED_VIOLATION', {
      studentId,
      sessionId: finalSession.sessionId,
      type,
      reason,
    });

    return res.status(200).json({
      success: true,
      terminated: true,
      reason: finalSession?.terminationReason || reason,
      type,
      sessionId: finalSession?.sessionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Session keepalive heartbeat (Requirement 13)
 * @route   POST /api/exam/session/heartbeat
 * @access  Protected (Student)
 */
const heartbeat = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const studentId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required for heartbeat.',
      });
    }

    const session = await ExamSession.findOne({ sessionId, studentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found.',
      });
    }

    // Token check
    const securityCheck = verifySessionSecurity(req, session);
    if (!securityCheck.valid) {
      return res.status(securityCheck.status).json({
        success: false,
        message: securityCheck.message,
      });
    }

    if (session.status === 'TERMINATED') {
      return res.status(200).json({
        success: true,
        status: session.status,
        isTerminated: true,
        terminationReason: session.terminationReason || null,
        isExpired: false,
      });
    }

    if (session.status === 'COMPLETED' || session.status === 'AUTO_SUBMITTED') {
      return res.status(200).json({
        success: true,
        status: session.status,
        isTerminated: false,
        isExpired: session.status === 'AUTO_SUBMITTED',
      });
    }

    // Check timer expiry (transitions to AUTO_SUBMITTED if time ran out)
    if (Date.now() >= session.expiresAt.getTime()) {
      await finalizeSessionScoring(session, true);
      return res.status(200).json({
        success: true,
        status: 'AUTO_SUBMITTED',
        isTerminated: false,
        isExpired: true,
      });
    }

    // Update ONLY lastSeenAt. NEVER modify expiresAt or startedAt (Requirement 13)
    await ExamSession.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date() } });

    res.status(200).json({
      success: true,
      status: session.status,
      isTerminated: false,
      terminationReason: null,
      isExpired: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get result for a completed session (Requirement 25 + Phase 5 Subjective Feedback)
 * @route   GET /api/exam/session/result
 * @access  Protected (Student)
 */
const getResult = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    const studentId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required to view results.',
      });
    }

    // Security: Find ONLY sessions owned by this student
    let session = await ExamSession.findOne({ sessionId, studentId });
    if (!session) {
      logSecurityEvent('RESULT_UNAUTHORIZED_ACCESS', { studentId, sessionId });
      return res.status(404).json({
        success: false,
        message: 'Session result not found or does not belong to your account.',
      });
    }

    if (session.status === 'TERMINATED') {
      return res.status(403).json({
        success: false,
        isTerminated: true,
        message: 'This exam was terminated due to an anti-cheat violation.',
        reason: session.terminationReason,
      });
    }

    if (session.status === 'IN_PROGRESS') {
      // Check if expired
      if (Date.now() >= session.expiresAt.getTime()) {
        session = await finalizeSessionScoring(session, true);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Exam is still in progress. Please submit the exam first.',
        });
      }
    }

    // Ensure subjective questions are evaluated if still pending
    if (
      (!session.evaluationStatus || session.evaluationStatus === 'PENDING_EVALUATION') &&
      (session.status === 'COMPLETED' || session.status === 'AUTO_SUBMITTED')
    ) {
      try {
        session = await evaluateSessionSubjectives(session);
      } catch (err) {
        console.error('[Evaluation in getResult]:', err.message);
      }
    }

    const student = await Student.findById(studentId);
    const exam = await Exam.findById(session.examId);
    const assignedCount = session.assignedQuestionIds.length;
    const answeredCount = await Answer.countDocuments({ sessionId: session._id });

    // Fetch subjective evaluations for this session (Requirement: Mask expectedAnswer & importantPoints)
    const evaluations = await SubjectiveEvaluation.find({ sessionId: session.sessionId })
      .populate('questionId', 'question marks');

    const subjectiveBreakdown = evaluations.map((ev) => {
      const effectiveMarks =
        ev.status === 'OVERRIDDEN' && ev.overrideMarks !== undefined
          ? ev.overrideMarks
          : ev.aiMarks || 0;
      const effectiveReason =
        ev.status === 'OVERRIDDEN' && ev.overrideReason
          ? ev.overrideReason
          : ev.aiReason || '';

      return {
        id: ev._id,
        question: ev.questionId?.question || 'Subjective Question',
        studentAnswer: ev.studentAnswer || '',
        marks: effectiveMarks,
        maxMarks: ev.maxMarks,
        reason: effectiveReason,
        status: ev.status,
      };
    });

    const mcqScore = session.score || 0;
    const mcqTotalPossible = session.totalPossibleScore || 15;
    const subjectiveScore = session.subjectiveScore || 0;
    const subjectiveTotalPossible = session.totalSubjectivePossible || 25;
    const totalScore = (session.totalScore !== undefined) ? session.totalScore : (mcqScore + subjectiveScore);
    const totalPossible = mcqTotalPossible + subjectiveTotalPossible;

    res.status(200).json({
      success: true,
      result: {
        examId: session.examId,
        studentName: student?.name || req.user.name,
        rollNumber: student?.rollNumber || req.user.rollNumber,
        examTitle: exam?.title || 'NSS Recruitment Online Test',
        status: session.status,
        submissionTime: session.submittedAt
          ? new Date(session.submittedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : 'N/A',
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        totalQuestions: assignedCount,
        answeredCount,
        mcqScore,
        mcqTotalPossible,
        subjectiveScore,
        subjectiveTotalPossible,
        totalScore,
        totalPossible,
        evaluationStatus: session.evaluationStatus || 'PENDING_EVALUATION',
        subjectiveBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  VIOLATION_REASONS,
  getActiveExam,
  startExam,
  getSession,
  getSessionQuestions,
  saveAnswer,
  submitExam,
  recordViolationAndTerminate,
  heartbeat,
  getResult,
};
