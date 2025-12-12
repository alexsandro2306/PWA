const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const trainingController = require('../controllers/trainingController');
const clientController = require('../controllers/clientController');

/**
 * @swagger
 * /api/workouts:
 *   post:
 *     summary: Criar novo plano de treino (Trainer)
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client
 *               - name
 *               - frequency
 *               - startDate
 *               - endDate
 *               - weeklyPlan
 *             properties:
 *               client:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               name:
 *                 type: string
 *                 example: Plano Hipertrofia - Janeiro
 *               frequency:
 *                 type: string
 *                 enum: [2x, 3x, 4x, 5x, 6x]
 *                 example: 4x
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-31
 *               weeklyPlan:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     exercises:
 *                       type: array
 *     responses:
 *       201:
 *         description: Plano criado
 *       403:
 *         description: Apenas trainers
 */
router.post('/', protect, authorize('trainer'), trainingController.createTrainingPlan);

/**
 * @swagger
 * /api/workouts:
 *   get:
 *     summary: Listar planos de treino
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *     responses:
 *       200:
 *         description: Lista de planos
 */
router.get('/', protect, trainingController.getTrainingPlans);

/**
 * @swagger
 * /api/workouts/active:
 *   get:
 *     summary: Ver plano ativo (Cliente)
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plano semanal ativo
 *       403:
 *         description: Apenas clientes
 */
router.get('/active', protect, authorize('client'), trainingController.getActiveWeeklyPlan);

router.get('/client/active', protect, authorize('client'), clientController.getActiveWorkoutPlan);
router.get('/client/logs', protect, authorize('client'), clientController.getTrainingLogsHistory);
router.get('/client/exercise/:sessionId/:exerciseId', protect, authorize('client'), clientController.getExerciseDetails);

module.exports = router;
