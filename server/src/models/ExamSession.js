const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'AUTO_SUBMITTED', 'TERMINATED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    assignedQuestionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    // Map of questionId -> string[] of shuffled options to preserve randomized option order across refreshes
    assignedOptionsMap: {
      type: Map,
      of: [String],
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalPossibleScore: {
      type: Number,
      default: 0,
    },
    subjectiveScore: {
      type: Number,
      default: 0,
    },
    totalSubjectivePossible: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    evaluationStatus: {
      type: String,
      enum: ['PENDING_EVALUATION', 'PARTIALLY_EVALUATED', 'EVALUATED'],
      default: 'PENDING_EVALUATION',
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    terminatedAt: {
      type: Date,
    },
    terminationReason: {
      type: String,
      default: '',
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    // Cryptographic hash of client session token for device/session mismatch protection
    sessionTokenHash: {
      type: String,
      default: '',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one student only has one active session per exam
// Indexes for fast lookup and multi-session constraints
examSessionSchema.index({ studentId: 1, examId: 1, status: 1 });
examSessionSchema.index({ studentId: 1, examId: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);

