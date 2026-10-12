import Joi from 'joi';

// ─── LOGIN VALIDATOR ──────────────────────────────────────────
export const loginValidator = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

// ─── CHANGE PASSWORD VALIDATOR ────────────────────────────────
export const changePasswordValidator = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password cannot be empty',
  }),
  newPassword: Joi.string()
    .min(8)
    .max(64)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])[A-Za-z\d@$!%*?&#^()_+=\-]{8,}$/
    )
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.max': 'New password cannot exceed 64 characters',
      'string.pattern.base':
        'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required',
      'string.empty': 'Confirm password cannot be empty',
    }),
});

// ─── FORGOT PASSWORD VALIDATOR ────────────────────────────────
export const forgotPasswordValidator = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),
});

// ─── RESET PASSWORD VALIDATOR ─────────────────────────────────
export const resetPasswordValidator = Joi.object({
  password: Joi.string()
    .min(8)
    .max(64)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-])[A-Za-z\d@$!%*?&#^()_+=\-]{8,}$/
    )
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 64 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required',
      'string.empty': 'Confirm password cannot be empty',
    }),
});

// ─── UPDATE PROFILE VALIDATOR ─────────────────────────────────
export const updateProfileValidator = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().messages({
    'string.min': 'First name must be at least 2 characters',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(2).max(50).trim().messages({
    'string.min': 'Last name must be at least 2 characters',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  phone: Joi.string()
    .pattern(/^(\+92|0)?3[0-9]{9}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid Pakistani phone number',
    }),
  gender: Joi.string().valid('male', 'female').allow(null, ''),
  dateOfBirth: Joi.date().max('now').allow(null, '').messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  address: Joi.object({
    street: Joi.string().max(200).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    district: Joi.string().max(100).allow(null, ''),
    province: Joi.string().max(100).allow(null, ''),
    country: Joi.string().max(100).allow(null, ''),
  }).allow(null),
  cnic: Joi.string()
    .pattern(/^\d{5}-\d{7}-\d{1}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'CNIC must be in format XXXXX-XXXXXXX-X',
    }),
});