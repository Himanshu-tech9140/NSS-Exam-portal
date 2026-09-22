const Student = require('../models/Student');

/**
 * @desc    Get student dashboard details
 * @route   GET /api/student/dashboard
 * @access  Protected (Student only)
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        student,
        applicationStatus: 'Verified & Registered',
        recruitmentStage: 'Phase 1 - Candidate Portal Access Active',
        testInfo: {
          status: 'Upcoming',
          message: 'The online aptitude and technical screening test will be unlocked during Phase 2 testing window.',
          guidelines: [
            'Ensure you have a stable internet connection.',
            'Keep your Student ID card and Roll Number handy for verification.',
            'Do not refresh or navigate away from the test window once started (Phase 2).',
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
};

