const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'TAB_SWITCH',
        'WINDOW_BLUR',
        'FULLSCREEN_EXIT',
        'COPY_ATTEMPT',
        'PASTE_ATTEMPT',
        'CUT_ATTEMPT',
        'RIGHT_CLICK',
        'TEXT_SELECTION',
        'RESTRICTED_SHORTCUT',
        'PRINT_ATTEMPT',
        'SAVE_ATTEMPT',
        'MULTIPLE_SESSION',
      ],
      required: [true, 'Violation type is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying violations for a specific session
violationSchema.index({ sessionId: 1, type: 1 });
violationSchema.index({ studentId: 1, examId: 1 });

module.exports = mongoose.model('Violation', violationSchema);

