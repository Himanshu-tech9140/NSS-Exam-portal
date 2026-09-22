const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Generate JWT Token helper
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'nss_recruitment_jwt_secret_key_change_in_production_2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * Common Cookie Options for JWT
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

/**
 * @desc    Register a new student
 * @route   POST /api/auth/student/register
 * @access  Public
 */
const studentRegister = async (req, res, next) => {
  try {
    const { name, rollNumber, password, branch, year } = req.body;

    if (!name || !rollNumber || !password || !branch || !year) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, rollNumber, password, branch, year) are required.',
      });
    }

    const cleanRollNumber = rollNumber.trim().toUpperCase();

    // Check if student already exists
    const existing = await Student.findOne({ rollNumber: cleanRollNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Student with Roll Number ${cleanRollNumber} already exists.`,
      });
    }

    const student = await Student.create({
      name: name.trim(),
      rollNumber: cleanRollNumber,
      password,
      branch: branch.trim(),
      year: Number(year),
    });

    const token = generateToken({
      id: student._id,
      role: 'student',
      rollNumber: student.rollNumber,
      name: student.name,
    });

    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      user: {
        id: student._id,
        role: 'student',
        name: student.name,
        rollNumber: student.rollNumber,
        branch: student.branch,
        year: student.year,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student login with Roll Number and Password
 * @route   POST /api/auth/student/login
 * @access  Public
 */
const studentLogin = async (req, res, next) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both roll number and password.',
      });
    }

    const cleanRoll = rollNumber.trim().toUpperCase();

    // Find student with password field explicitly selected
    const student = await Student.findOne({ rollNumber: cleanRoll }).select('+password');

    if (!student) {
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', { rollNumber: cleanRoll, reason: 'NOT_FOUND' });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No student found with this roll number.',
        message: 'Invalid roll number or password.',
      });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', { rollNumber: cleanRoll, reason: 'BAD_PASSWORD' });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password is incorrect.',
        message: 'Invalid roll number or password.',
      });
    }

    const token = generateToken({
      id: student._id,
      role: 'student',
      rollNumber: student.rollNumber,
      name: student.name,
    });

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: student._id,
        role: 'student',
        name: student.name,
        rollNumber: student.rollNumber,
        branch: student.branch,
        year: student.year,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin login with Username and Password
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    const admin = await Admin.findOne({ username: cleanUsername }).select('+password');

    if (!admin) {
      logSecurityEvent('FAILED_ADMIN_LOGIN', { username: cleanUsername, reason: 'NOT_FOUND' });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Admin user not found.',
        message: 'Invalid username or password.',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      logSecurityEvent('FAILED_ADMIN_LOGIN', { username: cleanUsername, reason: 'BAD_PASSWORD' });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password is incorrect.',
        message: 'Invalid username or password.',
      });
    }

    const token = generateToken({
      id: admin._id,
      role: 'admin',
      username: admin.username,
    });

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully.',
      user: {
        id: admin._id,
        role: 'admin',
        username: admin.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user info
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc    Logout user & clear HTTP-only cookie
 * @route   POST /api/auth/logout
 * @access  Public / Protected
 */
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  studentRegister,
  studentLogin,
  adminLogin,
  getMe,
  logout,
};

