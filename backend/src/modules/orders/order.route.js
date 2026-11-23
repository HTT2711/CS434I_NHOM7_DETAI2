const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Optional auth middleware for customer self-ordering vs staff ordering
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cs434_nhom_7');
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, fullName: true, role: true },
      });
      if (user) req.user = user;
    } catch {
      // Ignore token failure for optional route
    }
  }
  next();
};

// Customer / Table route to create order
router.post('/', optionalAuth, orderController.createOrder);

// Customer or Staff route to view order status
router.get('/:id', orderController.getOrderById);
router.post('/items/:itemId/cancel', optionalAuth, orderController.cancelOrderItem);

// Middleware: Nhân viên cần token để xem toàn bộ đơn, nhưng khách hàng tra cứu theo tableId được phép xem
const allowCustomerOrStaff = (req, res, next) => {
  if (req.query.tableId) {
    return optionalAuth(req, res, next);
  }
  return verifyToken(req, res, next);
};

// Staff or customer table routes
router.get('/', allowCustomerOrStaff, orderController.getOrders);
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);
router.post('/:id/confirm', verifyToken, orderController.confirmOrder);
router.post('/:id/cancel', optionalAuth, orderController.cancelOrder);
router.patch('/items/:itemId/status', verifyToken, orderController.updateOrderItemStatus);

module.exports = router;
