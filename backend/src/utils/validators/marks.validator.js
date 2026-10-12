import Joi from 'joi';

// ─── SINGLE MARK ENTRY SCHEMA ─────────────────────────────────
const singleMarkSchema = Joi.object({
  studentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Student ID is required',
      'string.pattern.base': 'Invalid student ID format',
    }),
  marks: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'any.required': 'Marks value is required',
      'number.min': 'Marks cannot be negative',
      'number.precision': 'Marks can have at most 2 decimal places',
    }),
});

// ─── SAVE MID-TERM MARKS VALIDATOR ───────────────────────────
export const saveMidTermMarksValidator = Joi.object({
  marksData: Joi.array()
    .items(singleMarkSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one student mark entry is required',
      'any.required': 'Marks data is required',
    }),
});

// ─── SAVE FINALS MARKS VALIDATOR ─────────────────────────────
export const saveFinalsMarksValidator = Joi.object({
  marksData: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'any.required': 'Student ID is required',
            'string.pattern.base': 'Invalid student ID format',
          }),
        internalMarks: Joi.number()
          .min(0)
          .precision(2)
          .required()
          .messages({
            'any.required': 'Internal marks are required',
            'number.min': 'Internal marks cannot be negative',
          }),
        finalTermMarks: Joi.number()
          .min(0)
          .precision(2)
          .required()
          .messages({
            'any.required': 'Final term marks are required',
            'number.min': 'Final term marks cannot be negative',
          }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one student mark entry is required',
      'any.required': 'Marks data is required',
    }),
});

// ─── UPDATE SINGLE STUDENT MARKS VALIDATOR ────────────────────
export const updateSingleMarkValidator = Joi.object({
  midTermMarks: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.min': 'Mid-term marks cannot be negative',
    }),
  internalMarks: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.min': 'Internal marks cannot be negative',
    }),
  finalTermMarks: Joi.number()
    .min(0)
    .precision(2)
    .allow(null)
    .messages({
      'number.min': 'Final term marks cannot be negative',
    }),
  remarks: Joi.string().max(200).trim().allow(null, ''),
});

// ─── IMPORT MARKS VALIDATOR ───────────────────────────────────
export const importMarksValidator = Joi.object({
  overwriteExisting: Joi.boolean().default(false),
  phase: Joi.string()
    .valid('midterm', 'finals', 'all')
    .default('all')
    .messages({
      'any.only': 'Phase must be one of: midterm, finals, all',
    }),
});