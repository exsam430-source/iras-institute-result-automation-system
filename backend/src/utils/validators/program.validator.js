import Joi from 'joi';
import { DEGREE_TYPES } from '../constants.js';

export const createProgramValidator = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Program name must be at least 2 characters',
    'any.required': 'Program name is required',
  }),
  code: Joi.string()
    .min(2)
    .max(15)
    .trim()
    .uppercase()
    .required()
    .messages({
      'any.required': 'Program code is required',
    }),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Department is required',
      'string.pattern.base': 'Invalid department ID',
    }),
  institute: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Institute is required',
      'string.pattern.base': 'Invalid institute ID',
    }),
  degreeType: Joi.string()
    .valid(...DEGREE_TYPES)
    .required()
    .messages({
      'any.only': `Degree type must be one of: ${DEGREE_TYPES.join(', ')}`,
      'any.required': 'Degree type is required',
    }),
  totalSemesters: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': 'Total semesters is required',
      'number.min': 'Total semesters must be at least 1',
      'number.max': 'Total semesters cannot exceed 12',
    }),
  totalCreditHours: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'any.required': 'Total credit hours is required',
    }),
  description: Joi.string().max(1000).trim().allow(null, ''),
  eligibility: Joi.string().max(500).trim().allow(null, ''),
  duration: Joi.string().max(100).trim().allow(null, ''),
});

export const updateProgramValidator = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  totalSemesters: Joi.number().integer().min(1).max(12),
  totalCreditHours: Joi.number().integer().min(1),
  description: Joi.string().max(1000).trim().allow(null, ''),
  eligibility: Joi.string().max(500).trim().allow(null, ''),
  duration: Joi.string().max(100).trim().allow(null, ''),
  isActive: Joi.boolean(),
});