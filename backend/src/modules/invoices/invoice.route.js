const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

router.post('/', verifyToken, authorizeRole('ADMIN', 'CASHIER'), invoiceController.createInvoice);
router.post('/merge-tables', verifyToken, authorizeRole('ADMIN', 'CASHIER'), invoiceController.mergeTables);
router.post('/split-bill', verifyToken, authorizeRole('ADMIN', 'CASHIER'), invoiceController.splitBill);

router.get('/', verifyToken, invoiceController.getInvoices);
router.get('/order/:orderId', invoiceController.getInvoiceByOrderId);
router.get('/:id', verifyToken, invoiceController.getInvoiceById);

module.exports = router;
