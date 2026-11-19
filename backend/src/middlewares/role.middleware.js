const { sendError } = require('../utils/response.util');

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user ? req.user.role : 'none'}`,
        403
      );
    }
    next();
  };
};

module.exports = {
  authorizeRole,
};
