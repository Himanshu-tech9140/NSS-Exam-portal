const express = require('express');
const router = express.Router();
const { getStudentDashboard } = require('../controllers/studentController');
const { verifyToken, requireStudent } = require('../middleware/auth');

// All student routes are protected and require student role
router.use(verifyToken, requireStudent);

router.get('/dashboard', getStudentDashboard);

module.exports = router;

