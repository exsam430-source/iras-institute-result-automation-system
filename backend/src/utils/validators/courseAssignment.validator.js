import Joi from 'joi';

export const createCourseAssignmentValidator = Joi.object({
  course: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Course is required',
      'string.pattern.base': 'Invalid course ID',
    }),
  teacher: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Teacher is required',
      'string.pattern.base': 'Invalid teacher ID',
    }),
  session: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Session is required',
      'string.pattern.base': 'Invalid session ID',
    }),
  semester: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': 'Semester is required',
      'number.min': 'Semester must be at least 1',
      'number.max': 'Semester cannot exceed 12',
    }),
  institute: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Institute is required',
      'string.pattern.base': 'Invalid institute ID',
    }),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Department is required',
      'string.pattern.base': 'Invalid department ID',
    }),
  program: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Program is required',
      'string.pattern.base': 'Invalid program ID',
    }),
  section: Joi.string()
    .max(5)
    .uppercase()
    .trim()
    .allow(null, '')
    .messages({
      'string.max': 'Section cannot exceed 5 characters',
    }),
  academicYear: Joi.string()
    .pattern(/^\d{4}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Academic year must be a 4-digit year',
    }),
});

export const updateCourseAssignmentValidator = Joi.object({
  teacher: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({ 'string.pattern.base': 'Invalid teacher ID' }),
  section: Joi.string().max(5).uppercase().trim().allow(null, ''),
  academicYear: Joi.string()
    .pattern(/^\d{4}$/)
    .allow(null, ''),
});

export const rejectResultValidator = Joi.object({
  rejectionReason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .trim()
    .messages({
      'any.required': 'Rejection reason is required',
      'string.min': 'Rejection reason must be at least 10 characters',
      'string.max': 'Rejection reason cannot exceed 500 characters',
      'string.empty': 'Rejection reason cannot be empty',
    }),
});