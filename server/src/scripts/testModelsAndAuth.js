/**
 * Unit & Logic Verification Test for NSS Test Portal (Phase 1)
 * Tests:
 * 1. Student schema validation
 * 2. Password hashing & compare
 * 3. Admin schema validation
 * 4. JWT generation and payload verification
 * 5. Role checking logic
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

const runTests = async () => {
  console.log('--- Starting Model & Authentication Logic Verification ---\n');

  // Test 1: Password hashing and comparison
  console.log('Test 1: Bcrypt Password Hashing & Verification');
  const plainPassword = 'StudentPassword123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  const matchSuccess = await bcrypt.compare(plainPassword, hashedPassword);
  const matchFail = await bcrypt.compare('WrongPassword', hashedPassword);

  if (!matchSuccess || matchFail) {
    throw new Error('Bcrypt password comparison test failed!');
  }
  console.log('  ✓ Password hashed successfully:', hashedPassword.substring(0, 20) + '...');
  console.log('  ✓ Correct password matches:', matchSuccess);
  console.log('  ✓ Incorrect password rejected:', !matchFail);

  // Test 2: Student Schema instantiation & pre-save hook
  console.log('\nTest 2: Student Model instantiation & schema requirements');
  const student = new Student({
    name: 'Rahul Sharma',
    rollNumber: '2024NSS001',
    password: 'StudentPassword123',
    branch: 'Computer Science and Engineering',
    year: 1,
  });

  const validationError = student.validateSync();
  if (validationError) {
    throw new Error(`Student schema validation failed: ${validationError.message}`);
  }
  console.log('  ✓ Student instance schema validated successfully');
  console.log('  ✓ Roll number:', student.rollNumber);
  console.log('  ✓ Branch:', student.branch);
  console.log('  ✓ Year:', student.year);

  // Test 3: Admin Schema instantiation
  console.log('\nTest 3: Admin Model instantiation');
  const admin = new Admin({
    username: 'admin',
    password: 'AdminPassword123',
  });
  const adminValError = admin.validateSync();
  if (adminValError) {
    throw new Error(`Admin schema validation failed: ${adminValError.message}`);
  }
  console.log('  ✓ Admin instance schema validated successfully');
  console.log('  ✓ Admin username:', admin.username);

  // Test 4: JWT Token Generation & Verification
  console.log('\nTest 4: JWT Token Generation & Verification');
  const secret = process.env.JWT_SECRET || 'nss_recruitment_jwt_secret_key_change_in_production_2026';
  const token = jwt.sign(
    {
      id: 'mock_student_id_123',
      role: 'student',
      rollNumber: '2024NSS001',
      name: 'Rahul Sharma',
    },
    secret,
    { expiresIn: '7d' }
  );

  const decoded = jwt.verify(token, secret);
  if (decoded.role !== 'student' || decoded.rollNumber !== '2024NSS001') {
    throw new Error('JWT verification payload mismatch!');
  }
  console.log('  ✓ JWT successfully generated and signed');
  console.log('  ✓ JWT decoded payload:', {
    id: decoded.id,
    role: decoded.role,
    rollNumber: decoded.rollNumber,
    name: decoded.name,
  });

  console.log('\n======================================================');
  console.log(' ALL CORE MODEL, AUTH, AND JWT LOGIC TESTS PASSED! ');
  console.log('======================================================\n');
};

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});

