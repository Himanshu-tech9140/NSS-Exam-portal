const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['MCQ', 'SUBJECTIVE'],
        message: 'Question type must be either MCQ or SUBJECTIVE',
      },
      required: [true, 'Question type is required'],
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      default: undefined,
      validate: {
        validator: function (val) {
          if (this.type === 'MCQ') {
            return Array.isArray(val) && val.length >= 2;
          }
          return true;
        },
        message: 'MCQ question must have at least 2 options',
      },
    },
    correctAnswer: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          if (this.type === 'MCQ') {
            return typeof val === 'string' && val.trim().length > 0;
          }
          return true;
        },
        message: 'MCQ question must have a correct answer',
      },
    },
    expectedAnswer: {
      type: String,
      trim: true,
      default: '',
    },
    importantPoints: {
      type: [String],
      default: [],
    },
    marks: {
      type: Number,
      required: [true, 'Marks are required'],
      default: 1,
      min: [1, 'Marks must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);

