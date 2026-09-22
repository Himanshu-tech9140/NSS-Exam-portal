const express = require('express');
const router = express.Router();
const {
  studentRegister,
  studentLogin,
  adminLogin,
  getMe,
  logout,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateStudentLogin, validateStudentRegister } = require('../middleware/validator');

// Public auth endpoints – validation middleware is applied
router.post('/student/register', validateStudentRegister, studentRegister);
router.post('/student/login',    validateStudentLogin,    studentLogin);
router.post('/admin/login', adminLogin);
router.post('/logout', logout);

// Protected session check endpoint
router.get('/me', verifyToken, getMe);

module.exports = router;

