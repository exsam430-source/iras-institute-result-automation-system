import { GRADING_SCALE } from './constants.js';

// Calculate grade from percentage
export const calculateGrade = (percentage) => {
  for (const scale of GRADING_SCALE) {
    if (percentage >= scale.minPercentage && percentage <= scale.maxPercentage) {
      return {
        grade: scale.grade,
        gradePoints: scale.gradePoints,
        description: scale.description,
      };
    }
  }
  return { grade: 'F', gradePoints: 0.0, description: 'Fail' };
};

// Calculate GPA
export const calculateGPA = (courses) => {
  if (!courses || courses.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCreditHours = 0;

  courses.forEach((c) => {
    totalQualityPoints += c.qualityPoints || 0;
    totalCreditHours += c.creditHours || 0;
  });

  if (totalCreditHours === 0) return 0;
  return Math.round((totalQualityPoints / totalCreditHours) * 100) / 100;
};

// Calculate CGPA
export const calculateCGPA = (semesterResults) => {
  if (!semesterResults || semesterResults.length === 0) return 0;

  let totalQualityPoints = 0;
  let totalCreditHours = 0;

  semesterResults.forEach((sem) => {
    totalQualityPoints += sem.totalQualityPoints || 0;
    totalCreditHours += sem.totalCreditHours || 0;
  });

  if (totalCreditHours === 0) return 0;
  return Math.round((totalQualityPoints / totalCreditHours) * 100) / 100;
};

// Format full name
export const getFullName = (firstName, lastName) => {
  return `${firstName} ${lastName}`.trim();
};

// Generate pagination meta
export const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// Parse sort string to MongoDB sort object
export const parseSortString = (sortStr) => {
  if (!sortStr) return { createdAt: -1 };

  const sortObj = {};
  const fields = sortStr.split(',');

  fields.forEach((field) => {
    if (field.startsWith('-')) {
      sortObj[field.slice(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  return sortObj;
};

// Sanitize query for MongoDB
export const buildFilterQuery = (query, allowedFields) => {
  const filter = {};
  allowedFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
  });
  return filter;
};

// Check if percentage is passing
export const isPassing = (percentage) => {
  return percentage >= 45;
};

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Generate random OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Validate Pakistani CNIC format
export const validateCNIC = (cnic) => {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};

// Validate Pakistani phone number
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+92|0)?3[0-9]{9}$/;
  return phoneRegex.test(phone);
};

// Deep clone object
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Pick specific fields from object
export const pick = (obj, fields) => {
  return fields.reduce((acc, field) => {
    if (obj[field] !== undefined) acc[field] = obj[field];
    return acc;
  }, {});
};

// Omit specific fields from object
export const omit = (obj, fields) => {
  const result = { ...obj };
  fields.forEach((field) => delete result[field]);
  return result;
};