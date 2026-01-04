const express = require('express');
const router = express.Router();

// Middlewares de autenticação
const { protect, authorize } = require('../middlewares/authMiddleware');

// Middleware de upload
const {
    uploadProofImage: uploadProofMiddleware
} = require('../middlewares/uploadMiddleware');

// Controller
const {
    // Training Plans
    createTrainingPlan,
    getTrainingPlans,
    getActivePlan,
    getTrainingPlan,
    updateTrainingPlan,
    deleteTrainingPlan,
    // Workout Logs
    logWorkout,
    getWorkoutLogs,
    getWorkoutLog,
    updateWorkoutLog,
    deleteWorkoutLog,
    getWorkoutStats,
    getClientWorkoutHistory,
    uploadProofImage
} = require('../controllers/workoutController');

/**
 * ========================================
 * TRAINING PLAN ROUTES (NEW)
 * ========================================
 */

// POST /api/workouts - Create training plan (Trainer)
router.post(
    '/',
    protect,
    authorize('trainer'),
    createTrainingPlan
);

// GET /api/workouts - Get all training plans (filtered by role)
router.get(
    '/',
    protect,
    getTrainingPlans
);

// GET /api/workouts/active - Get active plan (Client)
router.get(
    '/active',
    protect,
    authorize('client'),
    getActivePlan
);

// GET /api/workouts/:id - Get specific training plan
router.get(
    '/:id',
    protect,
    getTrainingPlan
);

// PUT /api/workouts/:id - Update training plan (Trainer)
router.put(
    '/:id',
    protect,
    authorize('trainer'),
    updateTrainingPlan
);

// DELETE /api/workouts/:id - Delete training plan (Trainer/Admin)
router.delete(
    '/:id',
    protect,
    authorize('trainer', 'admin'),
    deleteTrainingPlan
);

/**
 * ========================================
 * WORKOUT LOG ROUTES (EXISTING)
 * ========================================
 */

// POST /api/workouts/log - Registar treino (Client)
router.post(
    '/log',
    protect,
    authorize('client'),
    logWorkout
);

// GET /api/workouts/logs - Obter todos os logs (filtrado por role)
router.get(
    '/logs',
    protect,
    getWorkoutLogs
);

// GET /api/workouts/logs/:id - Obter log específico
router.get(
    '/logs/:id',
    protect,
    getWorkoutLog
);

// PUT /api/workouts/logs/:id - Atualizar log (Client)
router.put(
    '/logs/:id',
    protect,
    authorize('client'),
    updateWorkoutLog
);

// DELETE /api/workouts/logs/:id - Eliminar log (Client/Admin)
router.delete(
    '/logs/:id',
    protect,
    deleteWorkoutLog
);

// GET /api/workouts/stats - Estatísticas (Client/Trainer)
router.get(
    '/stats',
    protect,
    getWorkoutStats
);

// GET /api/workouts/client/:clientId/history - Histórico do cliente (Trainer/Admin)
router.get(
    '/client/:clientId/history',
    protect,
    authorize('trainer', 'admin'),
    getClientWorkoutHistory
);

// POST /api/workouts/upload-proof - Upload imagem de prova (Client)
router.post(
    '/upload-proof',
    protect,
    authorize('client'),
    uploadProofMiddleware,
    uploadProofImage
);

module.exports = router;