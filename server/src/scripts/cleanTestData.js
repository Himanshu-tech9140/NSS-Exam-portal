require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const ExamSession = require('../models/ExamSession');
const Answer = require('../models/Answer');
const ExamResult = require('../models/ExamResult');
const SubjectiveEvaluation = require('../models/SubjectiveEvaluation');

const cleanTestData = async () => {
  try {
    console.log('[Clean] Connecting to database...');
    await connectDB();

    console.log('[Clean] Removing all registered students...');
    const studentsRes = await Student.deleteMany({});

    console.log('[Clean] Removing all exam sessions and student answers...');
    const sessionsRes = await ExamSession.deleteMany({});
    const answersRes = await Answer.deleteMany({});

    console.log('[Clean] Removing all leaderboard results and AI evaluations...');
    const resultsRes = await ExamResult.deleteMany({});
    const evalsRes = await SubjectiveEvaluation.deleteMany({});

    console.log('------------------------------------------------------');
    console.log(`✓ Students deleted: ${studentsRes.deletedCount}`);
    console.log(`✓ Exam sessions deleted: ${sessionsRes.deletedCount}`);
    console.log(`✓ Answers deleted: ${answersRes.deletedCount}`);
    console.log(`✓ Exam results deleted: ${resultsRes.deletedCount}`);
    console.log(`✓ AI evaluations deleted: ${evalsRes.deletedCount}`);
    console.log('✓ Admin account and Exam Questions are PRESERVED.');
    console.log('------------------------------------------------------');
    console.log('Database is clean and ready for real student registrations!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Clean Error]:', error.message);
    process.exit(1);
  }
};

cleanTestData();
