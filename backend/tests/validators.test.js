import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveMidTermMarksValidator,
  saveFinalsMarksValidator,
  updateSingleMarkValidator,
} from '../src/utils/validators/marks.validator.js';
import {
  createCourseAssignmentValidator,
  rejectResultValidator,
} from '../src/utils/validators/courseAssignment.validator.js';

test('mid-term validator rejects negative or malformed values', () => {
  const malformed = saveMidTermMarksValidator.validate({
    marksData: [{ studentId: 'not-a-valid-id', marks: -1 }],
  });

  assert.ok(malformed.error);
  assert.match(malformed.error.message, /Invalid student ID format|Marks cannot be negative/);
});

test('finals validator rejects incomplete payloads', () => {
  const invalid = saveFinalsMarksValidator.validate({
    marksData: [{ studentId: '507f1f77bcf86cd799439011', internalMarks: 20 }],
  });

  assert.ok(invalid.error);
  assert.match(invalid.error.message, /Final term marks are required/);
});

test('single-mark update validator rejects negative marks', () => {
  const invalid = updateSingleMarkValidator.validate({ midTermMarks: -1 });

  assert.ok(invalid.error);
  assert.match(invalid.error.message, /Mid-term marks cannot be negative/);
});

test('course assignment validator blocks invalid semester and oversized section', () => {
  const invalid = createCourseAssignmentValidator.validate({
    course: '507f1f77bcf86cd799439011',
    teacher: '507f1f77bcf86cd799439011',
    session: '507f1f77bcf86cd799439011',
    semester: 13,
    institute: '507f1f77bcf86cd799439011',
    department: '507f1f77bcf86cd799439011',
    program: '507f1f77bcf86cd799439011',
    section: 'ABCDEF',
  });

  assert.ok(invalid.error);
  assert.match(invalid.error.message, /Semester cannot exceed 12|Section cannot exceed 5 characters/);
});

test('reject-result validator requires a meaningful reason', () => {
  const invalid = rejectResultValidator.validate({ rejectionReason: 'bad' });

  assert.ok(invalid.error);
  assert.match(invalid.error.message, /Rejection reason must be at least 10 characters/);
});
