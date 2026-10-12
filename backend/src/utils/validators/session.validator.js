import Joi from 'joi';

export const createSessionValidator = Joi.object({
  startYear: Joi.number()
    .integer()
    .min(2000)
    .max(new Date().getFullYear() + 5)
    .required()
    .messages({
      'any.required': 'Start year is required',
      'number.min': 'Start year cannot be before 2000',
    }),
  endYear: Joi.number()
    .integer()
    .min(Joi.ref('startYear'))
    .required()
    .messages({
      'any.required': 'End year is required',
      'number.min': 'End year must be greater than start year',
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
  admissionDate: Joi.date().allow(null, ''),
  isCurrent: Joi.boolean().default(false),
});

export const updateSessionValidator = Joi.object({
  isActive: Joi.boolean(),
  isCurrent: Joi.boolean(),
  admissionDate: Joi.date().allow(null, ''),
  currentSemester: Joi.number().integer().min(1).max(12),
});