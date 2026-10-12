import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS, ROLES } from '../utils/constants.js';

// ─── RESTRICT TO ROLES MIDDLEWARE ─────────────────────────────
export const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Please login first.')
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`
        )
      );
    }

    next();
  };
};

// ─── ROLE SHORTCUTS ───────────────────────────────────────────
export const adminOnly = restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN);

export const adminAndHod = restrictTo(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.HOD
);

export const teacherOnly = restrictTo(ROLES.TEACHER);

export const studentOnly = restrictTo(ROLES.STUDENT);

export const staffOnly = restrictTo(
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.HOD,
  ROLES.TEACHER
);

export const allRoles = restrictTo(...Object.values(ROLES));

// ─── DEPARTMENT OWNERSHIP CHECK ───────────────────────────────
export const checkDepartmentOwnership = (paramField = 'departmentId') => {
  return (req, _res, next) => {
    if (
      req.user.role === ROLES.SUPER_ADMIN ||
      req.user.role === ROLES.ADMIN
    ) {
      return next();
    }

    const deptId = req.params[paramField] || req.body.department;

    if (
      req.user.department &&
      deptId &&
      req.user.department._id.toString() !== deptId.toString()
    ) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          'You can only access resources within your own department.'
        )
      );
    }

    next();
  };
};

// ─── SELF OR ADMIN CHECK ──────────────────────────────────────
export const selfOrAdmin = (req, _res, next) => {
  if (
    req.user.role === ROLES.SUPER_ADMIN ||
    req.user.role === ROLES.ADMIN ||
    req.user._id.toString() === req.params.id
  ) {
    return next();
  }

  return next(
    new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'You can only access your own resources.'
    )
  );
};