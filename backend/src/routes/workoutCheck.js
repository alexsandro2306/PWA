const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { triggerMissedWorkoutsCheck, triggerTodayWorkoutsCheck } = require('../services/workoutCheckService');

// Rota manual para verificar treinos de hoje (apenas admin/trainer)
router.post(
    '/check-today',
    protect,
    authorize('admin', 'trainer'),
    triggerTodayWorkoutsCheck
);

// Rota manual para verificar treinos não respondidos de ontem (apenas admin/trainer)
router.post(
    '/check-missed',
    protect,
    authorize('admin', 'trainer'),
    triggerMissedWorkoutsCheck
);

module.exports = router;
