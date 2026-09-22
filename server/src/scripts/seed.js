require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');
const Answer = require('../models/Answer');
const connectDB = require('../config/db');

const seedData = async (shouldClose = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to MongoDB...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing demo users and exam data...');
    await Student.deleteMany({
      rollNumber: { $in: ['2024NSS001', '2024NSS002', '2024NSS003'] },
    });
    await Admin.deleteMany({ username: 'admin' });
    await ExamSession.deleteMany({});
    await Answer.deleteMany({});
    await Question.deleteMany({});
    await Exam.deleteMany({});

    console.log('[Seed] Creating default Admin...');
    const admin = await Admin.create({
      username: 'admin',
      password: 'AdminPassword123',
    });
    console.log(`[Seed] Admin created: ${admin.username} (Password: AdminPassword123)`);

    console.log('[Seed] Creating sample Student...');
    const student = await Student.create({
      name: 'Rahul Sharma',
      rollNumber: '2024NSS001',
      password: 'StudentPassword123',
      branch: 'Computer Science and Engineering',
      year: 1,
    });
    console.log(`[Seed] Student created: ${student.name} (${student.rollNumber})`);

    console.log('[Seed] Creating NSS Recruitment Exam...');
    const exam = await Exam.create({
      title: 'NSS Annual Recruitment Screening Test 2026',
      description:
        'Official online screening test for entry into the National Service Scheme volunteer team. Contains 15 Multiple Choice Questions and 5 Subjective Questions designed to assess knowledge, problem-solving, and community spirit.',
      duration: 20, // 20 minutes
      totalMarks: 20,
      isActive: true,
    });
    console.log(`[Seed] Exam created: "${exam.title}" (Duration: ${exam.duration} mins)`);

    console.log('[Seed] Adding 15 MCQ Questions...');
    const mcqs = [
      {
        question: 'What is the official motto of the National Service Scheme (NSS)?',
        options: ['Service Before Self', 'Not Me But You', 'Unity and Discipline', 'Truth Alone Triumphs'],
        correctAnswer: 'Not Me But You',
        marks: 1,
      },
      {
        question: 'In which year was the National Service Scheme (NSS) officially launched?',
        options: ['1947', '1969', '1975', '1982'],
        correctAnswer: '1969',
        marks: 1,
      },
      {
        question: 'The launch of NSS in 1969 commemorated the birth centenary of which historic leader?',
        options: ['Jawaharlal Nehru', 'Dr. B.R. Ambedkar', 'Mahatma Gandhi', 'Subhas Chandra Bose'],
        correctAnswer: 'Mahatma Gandhi',
        marks: 1,
      },
      {
        question: 'What does the giant wheel in the NSS badge/symbol represent?',
        options: ['The Konark Sun Temple Wheel', 'The Ashoka Chakra', 'Industrial Progress Wheel', 'The Ship Navigation Wheel'],
        correctAnswer: 'The Konark Sun Temple Wheel',
        marks: 1,
      },
      {
        question: 'Which ministry of the Government of India oversees the NSS program?',
        options: [
          'Ministry of Education',
          'Ministry of Youth Affairs and Sports',
          'Ministry of Social Justice and Empowerment',
          'Ministry of Home Affairs',
        ],
        correctAnswer: 'Ministry of Youth Affairs and Sports',
        marks: 1,
      },
      {
        question: 'On which date is National NSS Day celebrated across India each year?',
        options: ['August 15', 'September 24', 'October 2', 'January 12'],
        correctAnswer: 'September 24',
        marks: 1,
      },
      {
        question: 'What are the primary colors featured in the NSS badge?',
        options: ['Navy Blue and Red', 'Green and Saffron', 'Black and Gold', 'Sky Blue and White'],
        correctAnswer: 'Navy Blue and Red',
        marks: 1,
      },
      {
        question: 'How many hours of regular community service are expected from an NSS volunteer in a single academic year?',
        options: ['60 hours', '120 hours', '200 hours', '240 hours'],
        correctAnswer: '120 hours',
        marks: 1,
      },
      {
        question: 'What is the typical duration of an NSS Special Rural Camping Program?',
        options: ['3 days', '7 days', '14 days', '30 days'],
        correctAnswer: '7 days',
        marks: 1,
      },
      {
        question: 'When organizing a voluntary blood donation camp, what is the minimum recommended rest period for a donor before resuming heavy activity?',
        options: ['10 to 15 minutes', '2 hours', '6 hours', '24 hours'],
        correctAnswer: '10 to 15 minutes',
        marks: 1,
      },
      {
        question: 'During a natural disaster relief drive, which of the following actions should be prioritized first?',
        options: [
          'Immediate first aid and emergency evacuation',
          'Long-term road reconstruction',
          'Holding press briefings',
          'Collecting survey statistics',
        ],
        correctAnswer: 'Immediate first aid and emergency evacuation',
        marks: 1,
      },
      {
        question: 'Which of the following activities is NOT typically a part of NSS regular initiatives?',
        options: [
          'Tree plantation and environmental drives',
          'Commercial profit generation',
          'Adult literacy and education camps',
          'Health and hygiene awareness rallies',
        ],
        correctAnswer: 'Commercial profit generation',
        marks: 1,
      },
      {
        question: 'What does the red color in the NSS badge symbolize?',
        options: ['Sacrifice and lively active energy', 'Peace and harmony', 'Wealth and prosperity', 'Intellectual learning'],
        correctAnswer: 'Sacrifice and lively active energy',
        marks: 1,
      },
      {
        question: 'If an NSS team is planning an energy conservation drive on campus, what is the most effective initial step?',
        options: [
          'Conducting an energy audit and raising student awareness',
          'Cutting off power supplies abruptly',
          'Replacing all appliances with zero budget',
          'Waiting for government intervention',
        ],
        correctAnswer: 'Conducting an energy audit and raising student awareness',
        marks: 1,
      },
      {
        question: 'A community volunteer notices that local elderly citizens need help registering for digital health services. What is the best community-oriented response?',
        options: [
          'Conducting a free weekend digital helpdesk camp in the community hall',
          'Ignoring it as a personal family matter',
          'Advising them to purchase expensive computers',
          'Filing a formal complaint with the municipality',
        ],
        correctAnswer: 'Conducting a free weekend digital helpdesk camp in the community hall',
        marks: 1,
      },
    ];

    for (const mcq of mcqs) {
      await Question.create({
        examId: exam._id,
        type: 'MCQ',
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer,
        marks: mcq.marks,
      });
    }
    console.log(`[Seed] Successfully added ${mcqs.length} MCQs.`);

    console.log('[Seed] Adding 5 Subjective Questions...');
    const subjectives = [
      {
        question:
          'Explain the significance of the NSS motto "Not Me But You" and describe how you plan to practice this value in your campus and community life.',
        expectedAnswer:
          'Candidate should articulate selflessness, empathy, prioritisation of collective social welfare over individual pride, and concrete participation in social causes.',
        importantPoints: ['Selfless service', 'Empathy', 'Community first', 'Humility', 'Inclusive mindset'],
        marks: 1,
      },
      {
        question:
          'Propose an innovative social awareness campaign you would like to initiate in your college. Outline its objective, target audience, and execution plan.',
        expectedAnswer:
          'Clear objective (e.g., e-waste recycling, mental health, blood donation), realistic student mobilization, permissions, timeline, and measurable outcome.',
        importantPoints: ['Clear objective', 'Feasible execution', 'Student mobilization', 'Impact measurement'],
        marks: 1,
      },
      {
        question:
          'During a rural outreach camp, villagers appear hesitant to adopt waste segregation and sanitation guidelines. How would you empathize, communicate, and convince them?',
        expectedAnswer:
          'Respectful dialogue, street plays (Nukkad Natak), engaging local youth and elders, hands-on demonstrations, and focusing on health benefits for children.',
        importantPoints: ['Respectful dialogue', 'Community engagement', 'Demonstrative learning', 'Health benefits'],
        marks: 1,
      },
      {
        question:
          'Two student volunteers in your team have a strong interpersonal conflict during a time-sensitive relief donation collection. How would you resolve it constructively?',
        expectedAnswer:
          'Immediate de-escalation, reminding both members of the shared humanitarian mission, clear division of tasks based on strengths, and impartial mediation.',
        importantPoints: ['De-escalation', 'Mission refocus', 'Task reallocation', 'Impartial mediation'],
        marks: 1,
      },
      {
        question:
          'What unique strengths, technical skills, or personal values do you possess that will contribute to the growth and success of the NSS unit?',
        expectedAnswer:
          'Honest self-appraisal citing relevant skills such as graphic design, public speaking, logistics management, first aid, or persistent dedication.',
        importantPoints: ['Relevant practical skill', 'Commitment', 'Team collaboration', 'Reliability'],
        marks: 1,
      },
    ];

    for (const sub of subjectives) {
      await Question.create({
        examId: exam._id,
        type: 'SUBJECTIVE',
        question: sub.question,
        expectedAnswer: sub.expectedAnswer,
        importantPoints: sub.importantPoints,
        marks: sub.marks,
      });
    }
    console.log(`[Seed] Successfully added ${subjectives.length} Subjective questions.`);

    console.log('\n======================================================');
    console.log(' SEEDING COMPLETE FOR NSS RECRUITMENT PORTAL');
    console.log('------------------------------------------------------');
    console.log(' Exam Title: ' + exam.title);
    console.log(' Total Questions: 20 (15 MCQs + 5 Subjective)');
    console.log(' Duration: 20 Minutes');
    console.log('------------------------------------------------------');
    console.log(' Admin Login:   admin / AdminPassword123');
    console.log(' Student Login: 2024NSS001 / StudentPassword123');
    console.log('======================================================\n');

    if (shouldClose) {
      await mongoose.connection.close();
      process.exit(0);
    }
    return { admin, student, exam };
  } catch (error) {
    console.error(`[Seed Error]: ${error.message}`);
    if (shouldClose) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
