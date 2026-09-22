const mongoose = require('mongoose');

/**
 * Validates student login input
 */
const validateStudentLogin = (req, res, next) => {
  const { rollNumber, password } = req.body;
  if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both roll number and password.',
    });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both roll number and password.',
    });
  }
  next();
};

/**
 * Validates student registration input
 */
const validateStudentRegister = (req, res, next) => {
  const { name, rollNumber, password, branch, year } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters long.',
    });
  }
  if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Valid roll number is required.',
    });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }
  if (!branch || typeof branch !== 'string' || !branch.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Branch is required.',
    });
  }
  const yearNum = Number(year);
  if (!year || isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
    return res.status(400).json({
      success: false,
      message: 'Year must be a number between 1 and 5.',
    });
  }
  next();
};

/**
 * Validates answer submission input
 */
const validateAnswerSubmission = (req, res, next) => {
  const { sessionId, questionId, answer } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid session ID is required.',
    });
  }
  if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid question ID format.',
    });
  }
  if (answer !== undefined && typeof answer !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Answer must be a valid text string.',
    });
  }
  if (answer && answer.length > 5000) {
    return res.status(400).json({
      success: false,
      message: 'Answer exceeds maximum allowed length of 5000 characters.',
    });
  }
  next();
};

/**
 * Validates exam creation/update input
 */
const validateExamInput = (req, res, next) => {
  const { title, duration, totalMarks } = req.body;
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Exam title must be at least 3 characters long.',
      });
    }
  }
  if (duration !== undefined) {
    const durNum = Number(duration);
    if (isNaN(durNum) || durNum < 1 || durNum > 300) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 300 minutes.',
      });
    }
  }
  if (totalMarks !== undefined) {
    const marksNum = Number(totalMarks);
    if (isNaN(marksNum) || marksNum < 1 || marksNum > 500) {
      return res.status(400).json({
        success: false,
        message: 'Total marks must be a positive number between 1 and 500.',
      });
    }
  }
  next();
};

/**
 * Validates question creation/update input
 */
const validateQuestionInput = (req, res, next) => {
  const { examId, type, question, options, correctAnswer, marks } = req.body;
  if (req.method === 'POST') {
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Exam ID is required.',
      });
    }
    if (!type || !['MCQ', 'SUBJECTIVE'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Question type must be either MCQ or SUBJECTIVE.',
      });
    }
    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Question statement must be at least 5 characters long.',
      });
    }
    if (type === 'MCQ') {
      if (!Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require exactly 4 options (A, B, C, D).',
        });
      }
      for (const opt of options) {
        if (!opt || typeof opt !== 'string' || !opt.trim()) {
          return res.status(400).json({
            success: false,
            message: 'All 4 options must be non-empty strings.',
          });
        }
      }
      if (!correctAnswer || typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Correct answer is required for MCQ questions.',
        });
      }
    }
  }
  if (marks !== undefined) {
    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 1 || marksNum > 50) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a positive integer between 1 and 50.',
      });
    }
  }
  next();
};

module.exports = {
  validateStudentLogin,
  validateStudentRegister,
  validateAnswerSubmission,
  validateExamInput,
  validateQuestionInput,
};

