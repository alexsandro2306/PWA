const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const logController = require('../controllers/logController');
const dashboardController = require('../controllers/dashboardContoller');

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obter perfil do utilizador logado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do utilizador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 */
router.get('/me', protect, userController.getMe);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Atualizar perfil do utilizador
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: João
 *               lastName:
 *                 type: string
 *                 example: Silva
 *               phone:
 *                 type: string
 *                 example: +351912345678
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *                 example: dark
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 */
router.patch('/me', protect, userController.updateProfile);

// @route   POST /api/users/request-trainer-change
// @desc    Solicitar alteração de Personal Trainer (apenas Cliente)
// @access  Private (Client)
router.post('/request-trainer-change', protect, authorize('client'), userController.requestTrainerChange);

/**
 * @swagger
 * /api/users/my-clients:
 *   get:
 *     summary: Ver lista de clientes do Personal Trainer
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Apenas trainers podem aceder
 */
router.get('/my-clients', protect, authorize('trainer'), userController.getMyClients);

// @route   POST /api/users/logs
// @desc    Cliente regista cumprimento de treino
// @access  Private (Client)
router.post('/logs', protect, authorize('client'), logController.createTrainingLog);

// @route   GET /api/users/logs/:clientId
// @desc    Obter logs de treino de um cliente (para PT)
// @access  Private (Trainer)
router.get('/logs/:clientId', protect, authorize('trainer'), logController.getClientLogs);

// @route   GET /api/users/dashboard/me
// @desc    Obter dados do dashboard do cliente logado
// @access  Private (Client)
router.get('/dashboard/me', protect, authorize('client'), dashboardController.getDashboardData);

// @route   GET /api/users/dashboard/:clientId
// @desc    Obter dados do dashboard de um cliente (para PT)
// @access  Private (Trainer)
router.get('/dashboard/:clientId', protect, authorize('trainer'), dashboardController.getDashboardData);

module.exports = router;
