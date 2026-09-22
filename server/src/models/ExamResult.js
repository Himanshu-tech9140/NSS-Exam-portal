const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
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
    },
    mcqMarks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    subjectiveMarks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    submissionTime: {
      type: Date,
      default: Date.now,
    },
    evaluationStatus: {
      type: String,
      enum: ['PENDING_EVALUATION', 'PARTIALLY_EVALUATED', 'EVALUATED'],
      default: 'EVALUATED',
    },
    finalizedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee one final result per student per exam
examResultSchema.index({ studentId: 1, examId: 1 }, { unique: true });

// Optimize real-time leaderboard querying and deterministic tie-breaking:
// 1. Higher total marks -> better rank
// 2. Same marks -> earlier finalizedAt time
examResultSchema.index({ examId: 1, totalMarks: -1, finalizedAt: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);

