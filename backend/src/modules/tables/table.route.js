const express = require('express');
const router = express.Router();
const tableController = require('./table.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

// Public routes for customer scanning QR code & viewing table info
router.get('/by-token/:token', tableController.getTableByToken);
router.get('/token/:token', tableController.getTableByToken);
router.get('/:id', tableController.getTableById);

// Protected routes for staff
router.get('/', verifyToken, tableController.getAllTables);
router.post('/', verifyToken, authorizeRole('ADMIN'), tableController.createTable);
router.put('/:id', verifyToken, authorizeRole('ADMIN', 'CASHIER'), tableController.updateTable);
router.patch('/:id/status', verifyToken, tableController.updateStatus);
router.post('/:id/regenerate-qr', verifyToken, authorizeRole('ADMIN', 'CASHIER'), tableController.regenerateQr);
router.delete('/:id', verifyToken, authorizeRole('ADMIN'), tableController.deleteTable);

module.exports = router;
