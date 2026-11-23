const { sendError } = require('../utils/response.util');

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: [${allowedRoles.join(', ')}]. Quyền hiện tại: ${req.user ? req.user.role : 'chưa đăng nhập'}`,
        403
      );
    }
    next();
  };
};

module.exports = {
  authorizeRole,
};
