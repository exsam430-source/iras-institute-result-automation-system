import { GRADING_SCALE, PASSING_PERCENTAGE } from '../utils/constants.js';
import SystemSettings from '../models/SystemSettings.model.js';

// ─── GET ACTIVE GRADING SCALE ─────────────────────────────────
export const getGradingScale = async () => {
  try {
    const settings = await SystemSettings.getSettings();
    return settings.gradingScale || GRADING_SCALE;
  } catch {
    return GRADING_SCALE;
  }
};

// ─── CALCULATE GRADE FROM PERCENTAGE ─────────────────────────
export const calculateGradeFromPercentage = async (percentage) => {
  const gradingScale = await getGradingScale();

  for (const scale of gradingScale) {
    if (
      percentage >= scale.minPercentage &&
      percentage <= scale.maxPercentage
    ) {
      return {
        grade: scale.grade,
        gradePoints: scale.gradePoints,
        description: scale.description,
        isPassed: percentage >= PASSING_PERCENTAGE,
      };
    }
  }

  return {
    grade: 'F',
    gradePoints: 0.0,
    description: 'Fail',
    isPassed: false,
  };
};

// ─── CALCULATE MARKS TOTAL ────────────────────────────────────
export const calculateMarksTotal = (midTerm, internal, finalTerm) => {
  const total =
    (parseFloat(midTerm) || 0) +
    (parseFloat(internal) || 0) +
    (parseFloat(finalTerm) || 0);

  return Math.round(total * 100) / 100;
};

// ─── CALCULATE PERCENTAGE ─────────────────────────────────────
export const calculatePercentage = (obtained, total = 100) => {
  if (!total || total === 0) return 0;
  return Math.round((obtained / total) * 100 * 100) / 100;
};

// ─── CALCULATE QUALITY POINTS ─────────────────────────────────
export const calculateQualityPoints = (gradePoints, creditHours) => {
  return Math.round(gradePoints * creditHours * 100) / 100;
};

// ─── CALCULATE GPA ────────────────────────────────────────────
export const calculateSemesterGPA = (courses) => {
  if (!courses || courses.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCreditHours = 0;

  courses.forEach((course) => {
    if (course.gradePoints !== null && course.creditHours) {
      totalQualityPoints +=
        (parseFloat(course.gradePoints) || 0) *
        (parseFloat(course.creditHours) || 0);
      totalCreditHours += parseFloat(course.creditHours) || 0;
    }
  });

  if (totalCreditHours === 0) return 0;
  return Math.round((totalQualityPoints / totalCreditHours) * 100) / 100;
};

// ─── CALCULATE CUMULATIVE GPA ─────────────────────────────────
export const calculateCumulativeGPA = (semesterRecords) => {
  if (!semesterRecords || semesterRecords.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCreditHours = 0;

  semesterRecords.forEach((record) => {
    totalQualityPoints += parseFloat(record.totalQualityPoints) || 0;
    totalCreditHours += parseFloat(record.totalCreditHoursAttempted) || 0;
  });

  if (totalCreditHours === 0) return 0;
  return Math.round((totalQualityPoints / totalCreditHours) * 100) / 100;
};

// ─── VALIDATE MARKS ───────────────────────────────────────────
export const validateMarks = (marks, maxMarks) => {
  const value = parseFloat(marks);
  if (isNaN(value)) return { valid: false, error: 'Marks must be a number' };
  if (value < 0) return { valid: false, error: 'Marks cannot be negative' };
  if (value > maxMarks) {
    return {
      valid: false,
      error: `Marks cannot exceed ${maxMarks}`,
    };
  }
  return { valid: true, value };
};

// ─── PROCESS COMPLETE MARKS ENTRY ─────────────────────────────
export const processMarksEntry = async (
  midTerm,
  internal,
  finalTerm,
  marksDistribution = { midTerm: 20, internal: 20, finalTerm: 60 }
) => {
  // Validate each component
  const midTermValidation = validateMarks(midTerm, marksDistribution.midTerm);
  const internalValidation = validateMarks(internal, marksDistribution.internal);
  const finalTermValidation = validateMarks(
    finalTerm,
    marksDistribution.finalTerm
  );

  if (!midTermValidation.valid) {
    throw new Error(`Mid-term marks: ${midTermValidation.error}`);
  }
  if (!internalValidation.valid) {
    throw new Error(`Internal marks: ${internalValidation.error}`);
  }
  if (!finalTermValidation.valid) {
    throw new Error(`Final term marks: ${finalTermValidation.error}`);
  }

  const total = calculateMarksTotal(
    midTermValidation.value,
    internalValidation.value,
    finalTermValidation.value
  );

  const totalMarks =
    marksDistribution.midTerm +
    marksDistribution.internal +
    marksDistribution.finalTerm;

  const percentage = calculatePercentage(total, totalMarks);
  const gradeInfo = await calculateGradeFromPercentage(percentage);

  return {
    midTerm: midTermValidation.value,
    internal: internalValidation.value,
    finalTerm: finalTermValidation.value,
    total,
    totalMarks,
    percentage,
    ...gradeInfo,
  };
};

// ─── GET GRADE BADGE COLOR ────────────────────────────────────
export const getGradeBadgeColor = (grade) => {
  const colorMap = {
    A: '#065F46',
    'A-': '#047857',
    'B+': '#1D4ED8',
    B: '#1E40AF',
    'B-': '#1E3A8A',
    'C+': '#92400E',
    C: '#78350F',
    'C-': '#92400E',
    D: '#9A3412',
    F: '#991B1B',
  };
  return colorMap[grade] || '#374151';
};