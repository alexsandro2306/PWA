const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkTrainerClientRelation } = require('../middlewares/relationshipMiddleware'); // ← NOVO
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

/**
 * @swagger
 * /api/users/request-trainer-change:
 *   post:
 *     summary: Solicitar alteração de Personal Trainer (Cliente)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newTrainerId
 *               - reason
 *             properties:
 *               newTrainerId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *               reason:
 *                 type: string
 *                 example: Horários incompatíveis
 *     responses:
 *       201:
 *         description: Pedido enviado com sucesso
 *       403:
 *         description: Apenas clientes podem solicitar
 */
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

/**
 * @swagger
 * /api/users/logs:
 *   post:
 *     summary: Cliente regista cumprimento de treino
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - isCompleted
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-15
 *               isCompleted:
 *                 type: boolean
 *                 example: true
 *               reasonNotCompleted:
 *                 type: string
 *                 example: Indisposição
 *               proofImageURL:
 *                 type: string
 *                 example: /uploads/proofs/proof-123.jpg
 *     responses:
 *       201:
 *         description: Log criado com sucesso
 *       403:
 *         description: Apenas clientes
 */
router.post('/logs', protect, authorize('client'), logController.createTrainingLog);

/**
 * @swagger
 * /api/users/logs/{clientId}:
 *   get:
 *     summary: Obter logs de treino de um cliente (Trainer)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *     responses:
 *       200:
 *         description: Lista de logs
 *       403:
 *         description: Apenas trainer do cliente pode aceder
 */
router.get('/logs/:clientId',
    protect,
    authorize('trainer'),
    checkTrainerClientRelation, // ← NOVO MIDDLEWARE
    logController.getClientLogs
);

/**
 * @swagger
 * /api/users/dashboard/me:
 *   get:
 *     summary: Dashboard do cliente logado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                     statsByMonth:
 *                       type: array
 *       403:
 *         description: Apenas clientes
 */
router.get('/dashboard/me', protect, authorize('client'), dashboardController.getDashboardData);

/**
 * @swagger
 * /api/users/dashboard/{clientId}:
 *   get:
 *     summary: Dashboard de um cliente (Trainer)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do dashboard do cliente
 *       403:
 *         description: Apenas trainer do cliente pode aceder
 */
router.get('/dashboard/:clientId',
    protect,
    authorize('trainer'),
    checkTrainerClientRelation, // ← NOVO MIDDLEWARE
    dashboardController.getDashboardData
);

module.exports = router;