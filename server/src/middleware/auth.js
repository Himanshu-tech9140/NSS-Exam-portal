const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

/**
 * Middleware to verify JWT token from HTTP-only cookie
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback support for Authorization Bearer header if provided
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'nss_recruitment_jwt_secret_key_change_in_production_2026'
    );

    // Verify user still exists in DB
    if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id).select('-password');
      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Student account associated with this token no longer exists.',
        });
      }
      req.user = {
        id: student._id.toString(),
        role: 'student',
        name: student.name,
        rollNumber: student.rollNumber,
        branch: student.branch,
        year: student.year,
      };
    } else if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin account associated with this token no longer exists.',
        });
      }
      req.user = {
        id: admin._id.toString(),
        role: 'admin',
        username: admin.username,
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role in token payload.',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

/**
 * Middleware to restrict route access by role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] only.`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireStudent: requireRole('student'),
  requireAdmin: requireRole('admin'),
};

