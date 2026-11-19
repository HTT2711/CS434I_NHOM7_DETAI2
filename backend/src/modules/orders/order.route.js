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

// Staff routes
router.get('/', verifyToken, orderController.getOrders);
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);
router.patch('/items/:itemId/status', verifyToken, orderController.updateOrderItemStatus);

module.exports = router;
