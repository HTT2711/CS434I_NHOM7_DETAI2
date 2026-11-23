const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendError } = require('../utils/response.util');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cs434_nhom_7');

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, fullName: true, role: true },
    });

    if (!user) {
      return sendError(res, 'User not found or token invalid.', 401);
    }

    console.log('[AuthMiddleware] Verified user:', { id: user.id, username: user.username, role: user.role });
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', 401, error.message);
  }
};

module.exports = {
  verifyToken,
};
