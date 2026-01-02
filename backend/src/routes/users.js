const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkTrainerClientRelation } = require('../middlewares/relationshipMiddleware');
const userController = require('../controllers/userController');
const logController = require('../controllers/logController');
const dashboardController = require('../controllers/dashboardContoller');

// Public routes
router.get('/trainers/public', userController.getValidatedTrainers);

// Protected routes
router.get('/trainers', protect, userController.getTrainers);

router.get('/me', protect, userController.getMe);
router.get('/profile/:id', protect, userController.getUserById); // ✅ NOVA ROTA
router.patch('/me', protect, userController.updateProfile);

// QR Code routes
router.post('/me/qrcode/generate', protect, userController.generateQRCode);
router.delete('/me/qrcode', protect, userController.disableQRCode);

// Password change
router.patch('/me/change-password', protect, userController.changePassword);

// Trainer change request
router.post('/request-trainer-change', protect, authorize('client'), userController.requestTrainerChange);

// Clients management
router.get('/my-clients', protect, authorize('trainer'), userController.getMyClients);

// LOGS ROUTES
router.post('/logs', protect, authorize('client'), logController.createTrainingLog);

router.get('/logs/me', protect, authorize('client'), logController.getClientLogs);

router.get('/logs/:clientId',
    protect,
    authorize('trainer'),
    checkTrainerClientRelation,
    logController.getClientLogs
);

// DASHBOARD ROUTES
router.get('/dashboard/me', protect, authorize('client'), dashboardController.getDashboardData);

router.get('/dashboard/:clientId',
    protect,
    authorize('trainer'),
    checkTrainerClientRelation,
    dashboardController.getDashboardData
);

module.exports = router;