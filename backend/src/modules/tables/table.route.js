const express = require('express');
const router = express.Router();
const tableController = require('./table.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

// Public route for customer scanning QR code
router.get('/by-token/:token', tableController.getTableByToken);

// Protected routes for staff
router.get('/', verifyToken, tableController.getAllTables);
router.get('/:id', verifyToken, tableController.getTableById);
router.post('/', verifyToken, authorizeRole('ADMIN'), tableController.createTable);
router.put('/:id', verifyToken, authorizeRole('ADMIN', 'CASHIER'), tableController.updateTable);
router.patch('/:id/status', verifyToken, tableController.updateStatus);
router.delete('/:id', verifyToken, authorizeRole('ADMIN'), tableController.deleteTable);

module.exports = router;
