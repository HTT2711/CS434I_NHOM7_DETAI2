const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);

// Admin user management (US02)
router.get('/users', verifyToken, authorizeRole('ADMIN'), authController.getAllUsers);
router.post('/register', verifyToken, authorizeRole('ADMIN'), authController.register);
router.put('/users/:id', verifyToken, authorizeRole('ADMIN'), authController.updateUser);
router.patch('/users/:id/toggle-active', verifyToken, authorizeRole('ADMIN'), authController.toggleUserActive);

module.exports = router;
