const express = require('express');
const router = express.Router();
const {
  getActiveExam,
  startExam,
  getSession,
  getSessionQuestions,
  saveAnswer,
  submitExam,
  recordViolationAndTerminate,
  heartbeat,
  getResult,
} = require('../controllers/examController');
const { verifyToken, requireStudent } = require('../middleware/auth');
const { validateAnswerSubmission } = require('../middleware/validator');

// All student exam routes require authentication and student role
router.use(verifyToken, requireStudent);

router.get('/active', getActiveExam);
router.post('/:examId/start', startExam);
router.get('/session', getSession);
router.get('/session/questions', getSessionQuestions);
router.post('/session/answer', saveAnswer);
router.post('/session/answer', validateAnswerSubmission, saveAnswer);
router.post('/session/submit', submitExam);
router.post('/session/violation', recordViolationAndTerminate);
router.post('/session/heartbeat', heartbeat);
router.get('/session/result', getResult);

module.exports = router;
