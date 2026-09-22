const mongoose = require('mongoose');
const ExamResult = require('../models/ExamResult');
const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const SubjectiveEvaluation = require('../models/SubjectiveEvaluation');
const { emitLeaderboardUpdate } = require('../sockets/leaderboardSocket');

/**
 * Finalize or re-finalize exam result for a completed session.
 * Enforces:
 * 1. Must be COMPLETED or AUTO_SUBMITTED (TERMINATED sessions are strictly blocked).
 * 2. Must be EVALUATED (Incomplete or pending subjective evaluations are blocked).
 * 3. Applies Admin Override > AI Evaluation priority for subjective marks.
 * 4. Saves deterministic finalizedAt timestamp for tie-breaking.
 * 5. Emits real-time Socket.IO notification to the exam room.
 *
 * @param {string|Object} sessionOrId - ExamSession document or sessionId string
 * @returns {Promise<Object|null>} - Finalized ExamResult or null if ineligible
 */
const finalizeExamResult = async (sessionOrId) => {
  let session =
    typeof sessionOrId === 'string'
      ? (mongoose.connection.readyState === 1 ? await ExamSession.findOne({ sessionId: sessionOrId }) : null)
      : sessionOrId;

  if (!session) return null;

  // Rule 3 & 25: Terminated attempts must NEVER appear on the leaderboard
  if (session.status === 'TERMINATED') {
    // If an ExamResult was previously stored, remove it
    if (mongoose.connection.readyState === 1) {
      await ExamResult.deleteOne({ studentId: session.studentId, examId: session.examId });
    }
    emitLeaderboardUpdate(session.examId);
    return null;
  }

  // Must be submitted
  if (session.status !== 'COMPLETED' && session.status !== 'AUTO_SUBMITTED') {
    return null;
  }

  // Rule 3 & 25: Do not publish final leaderboard entry if subjective evaluation is still pending
  if (session.evaluationStatus !== 'EVALUATED') {
    return null;
  }

  const exam = await Exam.findById(session.examId);
  const mcqMarks = session.score || 0;

  // Fetch all subjective evaluations to guarantee accurate scores and admin overrides
  const evaluations = await SubjectiveEvaluation.find({ sessionId: session.sessionId });

  let subjectiveMarks = 0;
  for (const ev of evaluations) {
    // Priority: Admin Override > AI Evaluation
    const effective =
      ev.status === 'OVERRIDDEN' && ev.overrideMarks !== undefined
        ? ev.overrideMarks
        : ev.aiMarks || 0;
    subjectiveMarks += effective;
  }

  const totalMarks = mcqMarks + subjectiveMarks;
  const maxMarks =
    exam?.totalMarks ||
    (session.totalPossibleScore || 15) + (session.totalSubjectivePossible || 25);

  // Preserve existing finalizedAt timestamp if re-evaluating or overriding,
  // or set fresh timestamp on first finalization.
  const existingResult = await ExamResult.findOne({
    studentId: session.studentId,
    examId: session.examId,
  });

  const finalizedAt = existingResult?.finalizedAt || session.submittedAt || new Date();

  // Atomically upsert ExamResult (unique: studentId + examId)
  const result = await ExamResult.findOneAndUpdate(
    { studentId: session.studentId, examId: session.examId },
    {
      $set: {
        sessionId: session.sessionId,
        mcqMarks,
        subjectiveMarks,
        totalMarks,
        maxMarks,
        submissionTime: session.submittedAt || new Date(),
        evaluationStatus: session.evaluationStatus,
        finalizedAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Trigger real-time update in Socket.IO room for this exam
  emitLeaderboardUpdate(session.examId);

  return result;
};

/**
 * Retrieve public leaderboard for an exam with deterministic tie-breaking:
 * 1. Higher total marks -> higher rank
 * 2. Identical marks -> earlier finalizedAt timestamp gets higher position
 *
 * @param {string} examId - Exam ID
 * @param {string} [currentStudentId] - Optional student ID to compute myRank & myScore
 */
const getPublicLeaderboard = async (examId, currentStudentId = null) => {
  const exam = await Exam.findById(examId);

  // Fetch only eligible finalized results (evaluationStatus: EVALUATED)
  const results = await ExamResult.find({
    examId,
    evaluationStatus: 'EVALUATED',
  })
    .sort({ totalMarks: -1, finalizedAt: 1 })
    .populate('studentId', 'name rollNumber');

  let myRank = null;
  let myScore = null;
  let myTotalPossible = exam?.totalMarks || 40;

  const entries = results.map((r, index) => {
    const rank = index + 1;
    const isCurrent =
      currentStudentId && r.studentId?._id?.toString() === currentStudentId.toString();

    if (isCurrent) {
      myRank = rank;
      myScore = r.totalMarks;
      myTotalPossible = r.maxMarks;
    }

    return {
      rank,
      name: r.studentId?.name || 'Anonymous Candidate',
      rollNumber: r.studentId?.rollNumber || 'N/A',
      obtainedMarks: r.totalMarks,
      totalMarks: r.maxMarks,
      isCurrentUser: Boolean(isCurrent),
    };
  });

  return {
    examId: examId.toString(),
    examTitle: exam?.title || 'NSS Recruitment Online Test',
    totalMarks: exam?.totalMarks || (entries[0]?.totalMarks || 40),
    totalParticipants: entries.length,
    entries,
    myRank,
    myScore,
    myTotalPossible,
  };
};

/**
 * Retrieve detailed admin leaderboard with score breakdowns
 *
 * @param {string} examId - Exam ID
 */
const getAdminLeaderboard = async (examId) => {
  const exam = await Exam.findById(examId);

  const results = await ExamResult.find({
    examId,
    evaluationStatus: 'EVALUATED',
  })
    .sort({ totalMarks: -1, finalizedAt: 1 })
    .populate('studentId', 'name rollNumber branch year');

  const entries = results.map((r, index) => ({
    rank: index + 1,
    studentId: r.studentId?._id,
    name: r.studentId?.name || 'N/A',
    rollNumber: r.studentId?.rollNumber || 'N/A',
    branch: r.studentId?.branch || 'N/A',
    year: r.studentId?.year || 1,
    mcqMarks: r.mcqMarks,
    subjectiveMarks: r.subjectiveMarks,
    totalMarks: r.totalMarks,
    maxMarks: r.maxMarks,
    evaluationStatus: r.evaluationStatus,
    submissionTime: r.submissionTime,
    finalizedAt: r.finalizedAt,
  }));

  return {
    examId: examId.toString(),
    examTitle: exam?.title || 'NSS Recruitment Online Test',
    totalMarks: exam?.totalMarks || 40,
    totalParticipants: entries.length,
    entries,
  };
};

module.exports = {
  finalizeExamResult,
  getPublicLeaderboard,
  getAdminLeaderboard,
};

