const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

router.get('/stats', verifyToken, authorizeRole('ADMIN', 'CASHIER'), reportController.getDashboardStats);
router.get('/revenue-chart', verifyToken, authorizeRole('ADMIN', 'CASHIER'), reportController.getRevenueChart);
router.get('/top-selling', verifyToken, authorizeRole('ADMIN', 'CASHIER'), reportController.getTopSelling);

module.exports = router;
