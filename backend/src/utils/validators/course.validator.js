import Joi from 'joi';
import { COURSE_TYPES, COURSE_CATEGORIES } from '../constants.js';

export const createCourseValidator = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Course name must be at least 2 characters',
    'any.required': 'Course name is required',
  }),
  code: Joi.string().max(20).trim().uppercase().required().messages({
    'any.required': 'Course code is required',
  }),
  creditHours: Joi.number()
    .integer()
    .min(1)
    .max(6)
    .required()
    .messages({
      'any.required': 'Credit hours is required',
      'number.min': 'Credit hours must be at least 1',
      'number.max': 'Credit hours cannot exceed 6',
    }),
  type: Joi.string()
    .valid(...COURSE_TYPES)
    .default('theory')
    .messages({
      'any.only': `Type must be one of: ${COURSE_TYPES.join(', ')}`,
    }),
  category: Joi.string()
    .valid(...COURSE_CATEGORIES)
    .default('core')
    .messages({
      'any.only': `Category must be one of: ${COURSE_CATEGORIES.join(', ')}`,
    }),
  program: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Program is required',
      'string.pattern.base': 'Invalid program ID',
    }),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'any.required': 'Department is required' }),
  institute: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'any.required': 'Institute is required' }),
  semester: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': 'Semester is required',
      'number.min': 'Semester must be at least 1',
    }),
  prerequisites: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .default([]),
  description: Joi.string().max(1000).trim().allow(null, ''),
  marksDistribution: Joi.object({
    midTerm: Joi.number().integer().min(0).default(20),
    internal: Joi.number().integer().min(0).default(20),
    finalTerm: Joi.number().integer().min(0).default(60),
  }).default({ midTerm: 20, internal: 20, finalTerm: 60 }),
});

export const updateCourseValidator = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  creditHours: Joi.number().integer().min(1).max(6),
  type: Joi.string().valid(...COURSE_TYPES),
  category: Joi.string().valid(...COURSE_CATEGORIES),
  semester: Joi.number().integer().min(1).max(12),
  prerequisites: Joi.array().items(
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
  ),
  description: Joi.string().max(1000).trim().allow(null, ''),
  marksDistribution: Joi.object({
    midTerm: Joi.number().integer().min(0),
    internal: Joi.number().integer().min(0),
    finalTerm: Joi.number().integer().min(0),
  }),
  isActive: Joi.boolean(),
});

export const bulkCreateCoursesValidator = Joi.object({
  courses: Joi.array()
    .items(createCourseValidator)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one course is required',
      'array.max': 'Cannot create more than 50 courses at once',
      'any.required': 'Courses array is required',
    }),
});