const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllStudents,
} = require('../controllers/adminController');
const {
  createExam,
  getExams,
  updateExam,
  deleteExam,
  createQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/adminExamController');
const {
  getEvaluations,
  getEvaluationById,
  retryEvaluation,
  overrideEvaluation,
} = require('../controllers/adminEvaluationController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateExamInput, validateQuestionInput } = require('../middleware/validator');

// All admin routes are protected and require admin role
router.use(verifyToken, requireAdmin);

// Dashboard & student overview
router.get('/dashboard', getAdminDashboard);
router.get('/students', getAllStudents);

// Exam Management
router.post('/exams', validateExamInput, createExam);
router.get('/exams', getExams);
router.put('/exams/:id', validateExamInput, updateExam);
router.delete('/exams/:id', deleteExam);

// Question Management
router.post('/questions', validateQuestionInput, createQuestion);
router.get('/questions/:examId', getQuestionsByExam);
router.put('/questions/:id', validateQuestionInput, updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// Subjective Evaluations Management (Phase 5)
router.get('/evaluations', getEvaluations);
router.get('/evaluations/:evaluationId', getEvaluationById);
router.post('/evaluations/:evaluationId/retry', retryEvaluation);
router.patch('/evaluations/:evaluationId/override', overrideEvaluation);

module.exports = router;
