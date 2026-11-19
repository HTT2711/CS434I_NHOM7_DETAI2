const express = require('express');
const router = express.Router();
const menuController = require('./menu.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

// Public endpoints for customers
router.get('/categories', menuController.getCategories);
router.get('/items', menuController.getAllMenuItems);
router.get('/items/:id', menuController.getMenuItemById);

// Admin Category endpoints (US03)
router.post('/categories', verifyToken, authorizeRole('ADMIN'), menuController.createCategory);
router.put('/categories/:id', verifyToken, authorizeRole('ADMIN'), menuController.updateCategory);
router.delete('/categories/:id', verifyToken, authorizeRole('ADMIN'), menuController.deleteCategory);

// Admin Menu Item endpoints (US04)
router.post('/items', verifyToken, authorizeRole('ADMIN'), menuController.createMenuItem);
router.put('/items/:id', verifyToken, authorizeRole('ADMIN'), menuController.updateMenuItem);
router.patch('/items/:id/toggle-selling', verifyToken, authorizeRole('ADMIN'), menuController.toggleSelling);
router.delete('/items/:id', verifyToken, authorizeRole('ADMIN'), menuController.deleteMenuItem);

// Kitchen Stock endpoint (US11: Còn hàng / Tạm hết món)
router.patch('/items/:id/toggle-stock', verifyToken, authorizeRole('ADMIN', 'KITCHEN'), menuController.toggleStock);

module.exports = router;
