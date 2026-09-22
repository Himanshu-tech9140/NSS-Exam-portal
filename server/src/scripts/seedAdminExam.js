// Seed script to create an admin exam with 15 MCQs and 5 Subjective questions
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Exam = require('../models/Exam');
const Question = require('../models/Question');

const seedAdminExam = async () => {
  try {
    console.log('[SeedAdminExam] Connecting to DB...');
    await connectDB();

    // Create Exam
    const exam = await Exam.create({
      title: 'Admin Sample Exam',
      description: 'Demo exam with 15 MCQ and 5 Subjective questions for admin testing.',
      duration: 30, // minutes
      totalMarks: 20,
      isActive: true,
    });
    console.log('[SeedAdminExam] Exam created:', exam._id);

    // Helper functions
    const randomInt = (max) => Math.floor(Math.random() * max) + 1;

    // Create 15 MCQ questions
    const mcqPromises = [];
    for (let i = 1; i <= 15; i++) {
      const options = ['Option A', 'Option B', 'Option C', 'Option D'];
      const correct = options[randomInt(4) - 1];
      mcqPromises.push(
        Question.create({
          examId: exam._id,
          type: 'MCQ',
          question: `MCQ Question ${i}: What is the answer to question ${i}?`,
          options,
          correctAnswer: correct,
          marks: 1,
        })
      );
    }

    // Create 5 Subjective questions
    const subPromises = [];
    for (let i = 1; i <= 5; i++) {
      subPromises.push(
        Question.create({
          examId: exam._id,
          type: 'SUBJECTIVE',
          question: `Subjective Question ${i}: Explain concept ${i}.`,
          expectedAnswer: `Expected answer for concept ${i}`,
          importantPoints: [`Key point 1 for ${i}`, `Key point 2 for ${i}`],
          marks: 2,
        })
      );
    }

    await Promise.all([...mcqPromises, ...subPromises]);
    console.log('[SeedAdminExam] Created 15 MCQs and 5 Subjective questions.');
    console.log('[SeedAdminExam] Done.');
    process.exit(0);
  } catch (err) {
    console.error('[SeedAdminExam] Error:', err);
    process.exit(1);
  }
};

seedAdminExam();

