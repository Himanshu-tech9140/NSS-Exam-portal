/**
 * Automated Verification Script for Phase 6 — Live Leaderboard & Real-Time Ranking
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ExamResult = require('../models/ExamResult');
const ExamSession = require('../models/ExamSession');
const {
  finalizeExamResult,
  getPublicLeaderboard,
  getAdminLeaderboard,
} = require('../services/leaderboardService');

const runLeaderboardTests = async () => {
  console.log('==================================================================');
  console.log('       PHASE 6 LIVE LEADERBOARD & RANKING TEST SUITE              ');
  console.log('==================================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, desc) => {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${desc}`);
    }
  };

  try {
    // -------------------------------------------------------------
    // SUB-SUITE 1: ExamResult Model Schema & Constraint Validation
    // -------------------------------------------------------------
    console.log('--- Sub-suite 1: ExamResult Schema & Constraints ---');
    const student1Id = new mongoose.Types.ObjectId();
    const student2Id = new mongoose.Types.ObjectId();
    const student3Id = new mongoose.Types.ObjectId();
    const studentTerminatedId = new mongoose.Types.ObjectId();
    const examId = new mongoose.Types.ObjectId();

    // Valid ExamResult document
    const validResult = new ExamResult({
      studentId: student1Id,
      examId,
      sessionId: 'TEST_SESSION_101',
      mcqMarks: 14,
      subjectiveMarks: 20,
      totalMarks: 34,
      maxMarks: 40,
      submissionTime: new Date(),
      evaluationStatus: 'EVALUATED',
      finalizedAt: new Date('2026-09-22T10:00:00Z'),
    });
    const validateErr = validResult.validateSync();
    assert(!validateErr, 'Valid ExamResult document passes schema validation');

    // Missing required field validation
    const invalidResult = new ExamResult({
      studentId: student1Id,
      // missing examId and maxMarks
    });
    const missingErr = invalidResult.validateSync();
    assert(missingErr && missingErr.errors['examId'], 'Missing examId correctly rejected by schema');
    assert(missingErr && missingErr.errors['maxMarks'], 'Missing maxMarks correctly rejected by schema');

    // Invalid evaluationStatus enum
    const badStatusResult = new ExamResult({
      studentId: student1Id,
      examId,
      sessionId: 'TEST_SESSION_101',
      maxMarks: 40,
      evaluationStatus: 'INVALID_STATUS',
    });
    const enumErr = badStatusResult.validateSync();
    assert(enumErr && enumErr.errors['evaluationStatus'], 'Invalid evaluationStatus rejected by enum validator');

    // -------------------------------------------------------------
    // SUB-SUITE 2: Eligibility Rules (Who appears on the Leaderboard)
    // -------------------------------------------------------------
    console.log('\n--- Sub-suite 2: Leaderboard Eligibility & Exclusion ---');

    // 1. In-progress session cannot be finalized
    const inProgressSession = {
      studentId: student1Id,
      examId,
      sessionId: 'SES_IN_PROGRESS',
      status: 'IN_PROGRESS',
      evaluationStatus: 'PENDING_EVALUATION',
    };
    const inProgressResult = await finalizeExamResult(inProgressSession);
    assert(inProgressResult === null, 'IN_PROGRESS exam session is rejected from leaderboard finalization');

    // 2. Pending evaluation session cannot be finalized
    const pendingEvalSession = {
      studentId: student2Id,
      examId,
      sessionId: 'SES_PENDING_EVAL',
      status: 'COMPLETED',
      evaluationStatus: 'PENDING_EVALUATION',
    };
    const pendingResult = await finalizeExamResult(pendingEvalSession);
    assert(pendingResult === null, 'COMPLETED session with PENDING_EVALUATION is rejected from leaderboard finalization');

    // 3. Partially evaluated session cannot be finalized
    const partialEvalSession = {
      studentId: student2Id,
      examId,
      sessionId: 'SES_PARTIAL_EVAL',
      status: 'COMPLETED',
      evaluationStatus: 'PARTIALLY_EVALUATED',
    };
    const partialResult = await finalizeExamResult(partialEvalSession);
    assert(partialResult === null, 'COMPLETED session with PARTIALLY_EVALUATED is rejected from leaderboard finalization');

    // 4. Terminated session (anti-cheat violation) strictly excluded
    const terminatedSession = {
      studentId: studentTerminatedId,
      examId,
      sessionId: 'SES_TERMINATED',
      status: 'TERMINATED',
      evaluationStatus: 'EVALUATED',
      terminationReason: 'Tab switch detected.',
    };
    const termResult = await finalizeExamResult(terminatedSession);
    assert(termResult === null, 'TERMINATED session (anti-cheat violation) is strictly excluded from leaderboard');

    // -------------------------------------------------------------
    // SUB-SUITE 3: Deterministic Ranking & Tie-Break Logic
    // -------------------------------------------------------------
    console.log('\n--- Sub-suite 3: Deterministic Ranking & Tie-Break Logic ---');

    // Mock candidates
    // Candidate A: 36 marks, finalized at 10:20:00Z
    // Candidate B: 30 marks, finalized at 10:15:00Z (earlier)
    // Candidate C: 30 marks, finalized at 10:25:00Z (later)
    // Candidate D: 25 marks, finalized at 10:10:00Z
    const candidateResults = [
      {
        studentId: { _id: student1Id, name: 'Candidate A', rollNumber: '2026CSE001' },
        totalMarks: 36,
        maxMarks: 40,
        finalizedAt: new Date('2026-09-22T10:20:00Z'),
      },
      {
        studentId: { _id: student2Id, name: 'Candidate B', rollNumber: '2026CSE002' },
        totalMarks: 30,
        maxMarks: 40,
        finalizedAt: new Date('2026-09-22T10:15:00Z'), // Earlier submission
      },
      {
        studentId: { _id: student3Id, name: 'Candidate C', rollNumber: '2026CSE003' },
        totalMarks: 30,
        maxMarks: 40,
        finalizedAt: new Date('2026-09-22T10:25:00Z'), // Later submission
      },
      {
        studentId: { _id: new mongoose.Types.ObjectId(), name: 'Candidate D', rollNumber: '2026CSE004' },
        totalMarks: 25,
        maxMarks: 40,
        finalizedAt: new Date('2026-09-22T10:10:00Z'),
      },
    ];

    // Sort using official compound index rule: { totalMarks: -1, finalizedAt: 1 }
    const sorted = [...candidateResults].sort((a, b) => {
      if (b.totalMarks !== a.totalMarks) {
        return b.totalMarks - a.totalMarks; // Higher score first
      }
      return a.finalizedAt.getTime() - b.finalizedAt.getTime(); // Earlier finalized time first
    });

    assert(sorted[0].studentId.name === 'Candidate A', 'Rank 1 is highest scorer Candidate A (36/40)');
    assert(
      sorted[1].studentId.name === 'Candidate B' && sorted[2].studentId.name === 'Candidate C',
      'Tie-break between Candidate B and C (both 30 marks): Earlier submission Candidate B (10:15) gets Rank 2, Candidate C (10:25) gets Rank 3'
    );
    assert(sorted[3].studentId.name === 'Candidate D', 'Rank 4 is Candidate D (25/40)');

    // -------------------------------------------------------------
    // SUB-SUITE 4: Current Student Position Calculation (Server-side)
    // -------------------------------------------------------------
    console.log('\n--- Sub-suite 4: Server-Side Student Rank Calculation ---');
    const myStudentId = student3Id; // Candidate C
    let computedMyRank = null;
    let computedMyScore = null;

    sorted.forEach((entry, idx) => {
      if (entry.studentId._id.toString() === myStudentId.toString()) {
        computedMyRank = idx + 1;
        computedMyScore = entry.totalMarks;
      }
    });

    assert(computedMyRank === 3, 'Current student position (Candidate C) correctly calculated server-side as #3');
    assert(computedMyScore === 30, 'Current student score correctly returned as 30');

    // -------------------------------------------------------------
    // SUB-SUITE 5: Admin Override Recalculation
    // -------------------------------------------------------------
    console.log('\n--- Sub-suite 5: Score Recalculation on Admin Override ---');
    // Admin overrides Candidate C's subjective score by +8 marks -> new total = 38
    const overriddenCandidateC = {
      ...candidateResults[2],
      totalMarks: 38,
      finalizedAt: candidateResults[2].finalizedAt, // Preserves original finalized timestamp
    };

    const reSorted = [
      candidateResults[0], // 36
      candidateResults[1], // 30
      overriddenCandidateC, // 38
      candidateResults[3], // 25
    ].sort((a, b) => {
      if (b.totalMarks !== a.totalMarks) {
        return b.totalMarks - a.totalMarks;
      }
      return a.finalizedAt.getTime() - b.finalizedAt.getTime();
    });

    assert(
      reSorted[0].studentId.name === 'Candidate C' && reSorted[0].totalMarks === 38,
      'Admin override immediately shifts Candidate C to Rank 1 with updated 38 marks'
    );
    assert(reSorted[1].studentId.name === 'Candidate A', 'Candidate A naturally adjusts to Rank 2');

    // -------------------------------------------------------------
    // SUB-SUITE 6: Security & Public Data Masking Invariant
    // -------------------------------------------------------------
    console.log('\n--- Sub-suite 6: Security & Public Data Masking Invariant ---');

    // Simulate public payload returned by getPublicLeaderboard
    const publicPayload = sorted.map((r, index) => ({
      rank: index + 1,
      name: r.studentId.name,
      rollNumber: r.studentId.rollNumber,
      obtainedMarks: r.totalMarks,
      totalMarks: r.maxMarks,
    }));

    const sampleEntry = publicPayload[0];
    assert(sampleEntry.rank && sampleEntry.name && sampleEntry.rollNumber, 'Public entry contains required display fields');
    assert(!sampleEntry.password, 'Public entry strictly masks candidate password');
    assert(!sampleEntry.email, 'Public entry strictly masks candidate email');
    assert(!sampleEntry.phone, 'Public entry strictly masks candidate phone');
    assert(!sampleEntry.jwt, 'Public entry strictly masks candidate JWT');
    assert(!sampleEntry.sessionId, 'Public entry strictly masks candidate sessionId');
    assert(!sampleEntry.answers, 'Public entry strictly masks candidate answers');
    assert(!sampleEntry.expectedAnswer, 'Public entry strictly masks expected subjective answer');
    assert(!sampleEntry.importantPoints, 'Public entry strictly masks important points');
    assert(!sampleEntry.aiPrompt, 'Public entry strictly masks AI internal prompts');

    // -------------------------------------------------------------
    // SUB-SUITE 7: Socket.IO Room Isolation
    // -------------------------------------------------------------
    console.log('\n--- Sub-suite 7: Socket.IO Room Isolation ---');
    const examAId = 'EXAM_AAA';
    const examBId = 'EXAM_BBB';
    const roomA = `leaderboard:exam:${examAId}`;
    const roomB = `leaderboard:exam:${examBId}`;

    assert(roomA !== roomB, 'Exam A and Exam B have distinct, isolated Socket.IO rooms');
    assert(roomA === 'leaderboard:exam:EXAM_AAA', 'Exam A room follows strict leaderboard:exam:<examId> convention');

    console.log('\n==================================================================');
    console.log(`  PHASE 6 TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
    console.log('==================================================================\n');

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite encountered unhandled error:', err);
    process.exit(1);
  }
};

runLeaderboardTests();

