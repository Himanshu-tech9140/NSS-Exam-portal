const mongoose = require('mongoose');

const subjectiveEvaluationSchema = new mongoose.Schema(
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
      index: true,
    },
    sessionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question ID is required'],
      index: true,
    },
    answerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
    },
    studentAnswer: {
      type: String,
      default: '',
      trim: true,
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: 1,
    },
    aiMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiReason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'OVERRIDDEN'],
      default: 'PENDING',
      index: true,
    },
    overrideMarks: {
      type: Number,
      min: 0,
    },
    overrideReason: {
      type: String,
      trim: true,
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    overriddenAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    evaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee one evaluation per question per session
subjectiveEvaluationSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
subjectiveEvaluationSchema.index({ studentId: 1, examId: 1 });

module.exports = mongoose.model('SubjectiveEvaluation', subjectiveEvaluationSchema);
