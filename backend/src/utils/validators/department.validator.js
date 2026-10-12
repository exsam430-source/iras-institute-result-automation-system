import Joi from 'joi';

export const createDepartmentValidator = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Department name must be at least 2 characters',
    'string.max': 'Department name cannot exceed 100 characters',
    'any.required': 'Department name is required',
  }),
  code: Joi.string()
    .min(2)
    .max(10)
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .messages({
      'string.min': 'Code must be at least 2 characters',
      'string.max': 'Code cannot exceed 10 characters',
      'string.pattern.base': 'Code must contain only uppercase letters and numbers',
      'any.required': 'Department code is required',
    }),
  institute: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Institute is required',
      'string.pattern.base': 'Invalid institute ID',
    }),
  description: Joi.string().max(1000).trim().allow(null, ''),
  vision: Joi.string().max(500).trim().allow(null, ''),
  mission: Joi.string().max(500).trim().allow(null, ''),
  hod: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({ 'string.pattern.base': 'Invalid HoD ID' }),
  establishedYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .allow(null),
  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .allow(null, ''),
  contactPhone: Joi.string().max(20).trim().allow(null, ''),
});

export const updateDepartmentValidator = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  description: Joi.string().max(1000).trim().allow(null, ''),
  vision: Joi.string().max(500).trim().allow(null, ''),
  mission: Joi.string().max(500).trim().allow(null, ''),
  establishedYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .allow(null),
  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .allow(null, ''),
  contactPhone: Joi.string().max(20).trim().allow(null, ''),
  isActive: Joi.boolean(),
});

export const assignHodValidator = Joi.object({
  hodId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'HoD ID is required',
      'string.pattern.base': 'Invalid HoD ID',
    }),
});