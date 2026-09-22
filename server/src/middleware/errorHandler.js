const { logSecurityEvent } = require('../utils/securityLogger');

const errorHandler = (err, req, res, next) => {
  // Always log full error details securely on the server
  console.error('[SERVER ERROR DETAILS]:', err);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Something went wrong. Please try again.';

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }
  // Handle Mongoose Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Resource';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }
  // Handle CastError (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Requested resource was not found with the provided identifier.';
  }
  // Mask internal 500 database / system errors from students in non-development modes
  else if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong. Please try again.';
  }

  // Log potential security-related errors
  if (statusCode === 403 || statusCode === 401) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      user: req.user?.id || 'anonymous',
      message: err.message,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(process.env.NODE_ENV === 'development' && statusCode !== 500 && { details: err.message }),
  });
};

module.exports = errorHandler;
