const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');

// --- Exam Management ---

/**
 * @desc    Create new exam
 * @route   POST /api/admin/exams
 * @access  Protected (Admin)
 */
const createExam = async (req, res, next) => {
  try {
    const { title, description, duration, totalMarks, isActive } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Exam title is required.',
      });
    }

    const exam = await Exam.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      duration: duration ? Number(duration) : 20,
      totalMarks: totalMarks ? Number(totalMarks) : 20,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully.',
      exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all exams
 * @route   GET /api/admin/exams
 * @access  Protected (Admin)
 */
const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });

    // Append questions count per exam
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const mcqCount = await Question.countDocuments({ examId: exam._id, type: 'MCQ' });
        const subjectiveCount = await Question.countDocuments({ examId: exam._id, type: 'SUBJECTIVE' });
        const sessionsCount = await ExamSession.countDocuments({ examId: exam._id });

        return {
          ...exam.toObject(),
          mcqCount,
          subjectiveCount,
          totalQuestions: mcqCount + subjectiveCount,
          sessionsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      exams: examsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update exam
 * @route   PUT /api/admin/exams/:id
 * @access  Protected (Admin)
 */
const updateExam = async (req, res, next) => {
  try {
    const { title, description, duration, totalMarks, isActive } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    if (title) exam.title = title.trim();
    if (description !== undefined) exam.description = description.trim();
    if (duration !== undefined) exam.duration = Number(duration);
    if (totalMarks !== undefined) exam.totalMarks = Number(totalMarks);
    if (isActive !== undefined) exam.isActive = Boolean(isActive);

    await exam.save();

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully.',
      exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete exam and all its questions
 * @route   DELETE /api/admin/exams/:id
 * @access  Protected (Admin)
 */
const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found.',
      });
    }

    // Cascade delete questions
    await Question.deleteMany({ examId: exam._id });
    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exam and its associated questions deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// --- Question Management ---

/**
 * @desc    Create question (MCQ or Subjective)
 * @route   POST /api/admin/questions
 * @access  Protected (Admin)
 */
const createQuestion = async (req, res, next) => {
  try {
    const {
      examId,
      type,
      question,
      options,
      correctAnswer,
      expectedAnswer,
      importantPoints,
      marks,
    } = req.body;

    if (!examId || !type || !question) {
      return res.status(400).json({
        success: false,
        message: 'examId, type, and question are required.',
      });
    }

    if (type === 'MCQ') {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require at least 2 options.',
        });
      }
      if (!correctAnswer || !correctAnswer.trim()) {
        return res.status(400).json({
          success: false,
          message: 'MCQ questions require a correctAnswer.',
        });
      }
    }

    const questionDoc = await Question.create({
      examId,
      type,
      question: question.trim(),
      options: type === 'MCQ' ? options.map((opt) => String(opt).trim()) : undefined,
      correctAnswer: type === 'MCQ' ? String(correctAnswer).trim() : undefined,
      expectedAnswer: type === 'SUBJECTIVE' && expectedAnswer ? String(expectedAnswer).trim() : '',
      importantPoints:
        type === 'SUBJECTIVE' && Array.isArray(importantPoints)
          ? importantPoints.map((p) => String(p).trim()).filter(Boolean)
          : [],
      marks: marks ? Number(marks) : 1,
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully.',
      question: questionDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get questions for an exam
 * @route   GET /api/admin/questions/:examId
 * @access  Protected (Admin)
 */
const getQuestionsByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const questions = await Question.find({ examId }).sort({ type: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a question
 * @route   PUT /api/admin/questions/:id
 * @access  Protected (Admin)
 */
const updateQuestion = async (req, res, next) => {
  try {
    const {
      question,
      options,
      correctAnswer,
      expectedAnswer,
      importantPoints,
      marks,
    } = req.body;

    const questionDoc = await Question.findById(req.params.id);
    if (!questionDoc) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    if (question) questionDoc.question = question.trim();
    if (marks !== undefined) questionDoc.marks = Number(marks);

    if (questionDoc.type === 'MCQ') {
      if (options && Array.isArray(options)) {
        questionDoc.options = options.map((o) => String(o).trim());
      }
      if (correctAnswer !== undefined) {
        questionDoc.correctAnswer = String(correctAnswer).trim();
      }
    } else if (questionDoc.type === 'SUBJECTIVE') {
      if (expectedAnswer !== undefined) {
        questionDoc.expectedAnswer = String(expectedAnswer).trim();
      }
      if (importantPoints !== undefined && Array.isArray(importantPoints)) {
        questionDoc.importantPoints = importantPoints.map((p) => String(p).trim()).filter(Boolean);
      }
    }

    await questionDoc.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully.',
      question: questionDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a question
 * @route   DELETE /api/admin/questions/:id
 * @access  Protected (Admin)
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const questionDoc = await Question.findById(req.params.id);
    if (!questionDoc) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    await questionDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  updateExam,
  deleteExam,
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
};

