const Student = require('../models/Student');

/**
 * @desc    Get admin dashboard metrics and overview
 * @route   GET /api/admin/dashboard
 * @access  Protected (Admin only)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();

    // Aggregation: Count by branch
    const branchDistribution = await Student.aggregate([
      {
        $group: {
          _id: '$branch',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Aggregation: Count by year
    const yearDistribution = await Student.aggregate([
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fetch latest 5 registered candidates
    const recentCandidates = await Student.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalStudents,
          branchesCount: branchDistribution.length,
        },
        branchDistribution,
        yearDistribution,
        recentCandidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of all registered students
 * @route   GET /api/admin/students
 * @access  Protected (Admin only)
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { branch, year, search } = req.query;

    const query = {};

    if (branch) {
      query.branch = branch;
    }

    if (year) {
      query.year = Number(year);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { rollNumber: regex }, { branch: regex }];
    }

    const students = await Student.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getAllStudents,
};

