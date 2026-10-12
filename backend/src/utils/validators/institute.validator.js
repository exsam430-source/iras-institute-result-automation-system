import Joi from 'joi';

export const createInstituteValidator = Joi.object({
  name: Joi.string().min(3).max(100).trim().required().messages({
    'string.min': 'Institute name must be at least 3 characters',
    'string.max': 'Institute name cannot exceed 100 characters',
    'any.required': 'Institute name is required',
    'string.empty': 'Institute name cannot be empty',
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
      'any.required': 'Institute code is required',
    }),
  shortName: Joi.string().max(50).trim().allow(null, ''),
  description: Joi.string().max(1000).trim().allow(null, ''),
  vision: Joi.string().max(500).trim().allow(null, ''),
  mission: Joi.string().max(500).trim().allow(null, ''),
  director: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({ 'string.pattern.base': 'Invalid director ID' }),
  establishedYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .allow(null)
    .messages({
      'number.min': 'Established year cannot be before 1900',
      'number.max': 'Established year cannot be in the future',
    }),
  location: Joi.object({
    building: Joi.string().max(100).allow(null, ''),
    floor: Joi.string().max(50).allow(null, ''),
    campus: Joi.string().max(100).allow(null, ''),
  }).allow(null),
  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .allow(null, ''),
  contactPhone: Joi.string().max(20).trim().allow(null, ''),
  website: Joi.string().uri().max(200).allow(null, '').messages({
    'string.uri': 'Please provide a valid website URL',
  }),
});

export const updateInstituteValidator = Joi.object({
  name: Joi.string().min(3).max(100).trim(),
  shortName: Joi.string().max(50).trim().allow(null, ''),
  description: Joi.string().max(1000).trim().allow(null, ''),
  vision: Joi.string().max(500).trim().allow(null, ''),
  mission: Joi.string().max(500).trim().allow(null, ''),
  director: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, ''),
  establishedYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .allow(null),
  location: Joi.object({
    building: Joi.string().max(100).allow(null, ''),
    floor: Joi.string().max(50).allow(null, ''),
    campus: Joi.string().max(100).allow(null, ''),
  }).allow(null),
  contactEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .allow(null, ''),
  contactPhone: Joi.string().max(20).trim().allow(null, ''),
  website: Joi.string().uri().max(200).allow(null, ''),
  isActive: Joi.boolean(),
});

export const assignDirectorValidator = Joi.object({
  directorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Director ID is required',
      'string.pattern.base': 'Invalid director ID',
    }),
});