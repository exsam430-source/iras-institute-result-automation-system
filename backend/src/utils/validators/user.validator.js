import Joi from 'joi';
import { ROLES } from '../constants.js';
import { DEGREE_TYPES } from '../constants.js';

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])[A-Za-z\d@$!%*?&#^()_+=\-]{8,}$/;

const addressSchema = Joi.object({
  street: Joi.string().max(200).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  district: Joi.string().max(100).allow(null, ''),
  province: Joi.string().max(100).allow(null, ''),
  country: Joi.string().max(100).allow(null, ''),
}).allow(null);

// ─── CREATE USER VALIDATOR ────────────────────────────────────
export const createUserValidator = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .max(64)
    .pattern(passwordPattern)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required()
    .messages({
      'any.only': `Role must be one of: ${Object.values(ROLES).join(', ')}`,
      'any.required': 'Role is required',
    }),
  institute: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid institute ID',
    }),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid department ID',
    }),
  phone: Joi.string()
    .pattern(/^(\+92|0)?3[0-9]{9}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid Pakistani phone number',
    }),
  cnic: Joi.string()
    .pattern(/^\d{5}-\d{7}-\d{1}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'CNIC must be in format XXXXX-XXXXXXX-X',
    }),
  gender: Joi.string().valid('male', 'female').allow(null, ''),
  dateOfBirth: Joi.date().max('now').allow(null, ''),
  address: addressSchema,
  mustChangePassword: Joi.boolean().default(false),
});

// ─── CREATE STUDENT VALIDATOR ─────────────────────────────────
export const createStudentValidator = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().required(),
  lastName: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .trim(),
  password: Joi.string().min(8).max(64).pattern(passwordPattern).required(),
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
    }),
  program: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Program is required',
    }),
  session: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Session is required',
    }),
  fatherName: Joi.string().min(2).max(100).trim().required().messages({
    'any.required': 'Father name is required',
  }),
  fatherCnic: Joi.string()
    .pattern(/^\d{5}-\d{7}-\d{1}$/)
    .allow(null, ''),
  guardianPhone: Joi.string()
    .pattern(/^(\+92|0)?3[0-9]{9}$/)
    .allow(null, ''),
  phone: Joi.string()
    .pattern(/^(\+92|0)?3[0-9]{9}$/)
    .allow(null, ''),
  cnic: Joi.string()
    .pattern(/^\d{5}-\d{7}-\d{1}$/)
    .allow(null, ''),
  gender: Joi.string().valid('male', 'female').allow(null, ''),
  dateOfBirth: Joi.date().max('now').allow(null, ''),
  bloodGroup: Joi.string()
    .valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    .allow(null, ''),
  address: addressSchema,
  admissionDate: Joi.date().allow(null, ''),
  admissionType: Joi.string()
    .valid('regular', 'lateral', 'transfer')
    .default('regular'),
  mustChangePassword: Joi.boolean().default(true),
});

// ─── UPDATE USER VALIDATOR ────────────────────────────────────
export const updateUserValidator = Joi.object({
  firstName: Joi.string().min(2).max(50).trim(),
  lastName: Joi.string().min(2).max(50).trim(),
  phone: Joi.string()
    .pattern(/^(\+92|0)?3[0-9]{9}$/)
    .allow(null, ''),
  cnic: Joi.string()
    .pattern(/^\d{5}-\d{7}-\d{1}$/)
    .allow(null, ''),
  gender: Joi.string().valid('male', 'female').allow(null, ''),
  dateOfBirth: Joi.date().max('now').allow(null, ''),
  address: addressSchema,
  institute: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, ''),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null, ''),
  isActive: Joi.boolean(),
  mustChangePassword: Joi.boolean(),
});