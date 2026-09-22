const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide exam title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: Number,
      required: [true, 'Please provide duration in minutes'],
      default: 20,
      min: [1, 'Duration must be at least 1 minute'],
    },
    totalMarks: {
      type: Number,
      default: 20,
      min: [0, 'Total marks cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Exam', examSchema);

