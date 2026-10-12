export const shouldPromoteAssignmentStatus = ({ updatedCount, totalCount, failedCount }) => {
  if (!Number.isInteger(updatedCount) || !Number.isInteger(totalCount)) {
    return false;
  }

  return updatedCount > 0 && updatedCount === totalCount && failedCount === 0;
};

export const buildSubmissionValidationResult = ({
  activeEnrolledStudentIds = [],
  existingMarkStudentIds = [],
  incompleteMarkCount = 0,
}) => {
  const enrolledSet = new Set(activeEnrolledStudentIds);
  const marksSet = new Set(existingMarkStudentIds);
  const missingStudents = [...enrolledSet].filter((studentId) => !marksSet.has(studentId));

  return {
    canSubmit: missingStudents.length === 0 && incompleteMarkCount === 0,
    missingCount: missingStudents.length,
    incompleteCount: incompleteMarkCount,
    totalBlockedCount: missingStudents.length + incompleteMarkCount,
    missingStudents,
  };
};
