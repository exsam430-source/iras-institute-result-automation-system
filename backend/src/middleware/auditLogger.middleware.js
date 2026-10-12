import AuditLog from '../models/AuditLog.model.js';

export const auditLog = (action, resource) => async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);

  res.json = async function (body) {
    // Only log successful operations
    if (body.success && req.user) {
      try {
        await AuditLog.create({
          user: req.user._id,
          action,
          resource,
          resourceId: req.params.id || body.data?._id || null,
          newData: req.body || null,
          ipAddress:
            req.ip ||
            req.connection.remoteAddress ||
            req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
        });
      } catch (_err) {
        // Audit log failure should not affect the response
      }
    }
    return originalJson(body);
  };

  next();
};