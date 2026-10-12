import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldPromoteAssignmentStatus,
  buildSubmissionValidationResult,
} from '../src/utils/marksWorkflow.utils.js';

test('promotes assignment status only for fully successful saves', () => {
  assert.equal(
    shouldPromoteAssignmentStatus({ updatedCount: 3, totalCount: 3, failedCount: 0 }),
    true
  );

  assert.equal(
    shouldPromoteAssignmentStatus({ updatedCount: 2, totalCount: 3, failedCount: 1 }),
    false
  );

  assert.equal(
    shouldPromoteAssignmentStatus({ updatedCount: 0, totalCount: 3, failedCount: 0 }),
    false
  );
});

test('buildSubmissionValidationResult flags missing and incomplete marks', () => {
  const result = buildSubmissionValidationResult({
    activeEnrolledStudentIds: ['s1', 's2', 's3'],
    existingMarkStudentIds: ['s1', 's2'],
    incompleteMarkCount: 1,
  });

  assert.equal(result.canSubmit, false);
  assert.equal(result.missingCount, 1);
  assert.equal(result.incompleteCount, 1);
  assert.equal(result.totalBlockedCount, 2);
});
