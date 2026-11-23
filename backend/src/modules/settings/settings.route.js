const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { authorizeRole } = require('../../middlewares/role.middleware');

// Public or authenticated get settings
router.get('/', settingsController.getSettings);

// Admin only update settings
router.put('/', verifyToken, authorizeRole('ADMIN'), settingsController.updateSettings);

module.exports = router;
