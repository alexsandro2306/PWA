const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Listar todos os utilizadores
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de utilizadores
 *       403:
 *         description: Apenas admins
 */
router.get('/users', protect, authorize('admin'), adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Apagar utilizador
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilizador removido
 *       403:
 *         description: Apenas admins
 */
router.delete('/users/:userId', protect, authorize('admin'), adminController.deleteUser);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Obter estatísticas do dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do sistema
 *       403:
 *         description: Apenas admins
 */
router.get('/stats', protect, authorize('admin'), adminController.getAdminStats);

/**
 * @swagger
 * /api/admin/trainers/pending:
 *   get:
 *     summary: Listar trainers pendentes de validação
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de trainers pendentes
 *       403:
 *         description: Apenas admins
 */
router.get('/trainers/pending', protect, authorize('admin'), adminController.getPendingTrainers);

/**
 * @swagger
 * /api/admin/trainers/{trainerId}/validate:
 *   patch:
 *     summary: Validar Personal Trainer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trainerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer validado
 *       403:
 *         description: Apenas admins
 */
router.put('/trainers/:trainerId/validate', protect, authorize('admin'), adminController.validateTrainer);

/**
 * @swagger
 * /api/admin/trainers/{trainerId}:
 *   delete:
 *     summary: Remover Personal Trainer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trainerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer removido
 *       403:
 *         description: Apenas admins
 */
router.delete('/trainers/:trainerId', protect, authorize('admin'), adminController.deleteTrainer);

/**
 * @swagger
 * /api/admin/requests/pending:
 *   get:
 *     summary: Listar pedidos de mudança de trainer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos pendentes
 *       403:
 *         description: Apenas admins
 */
router.get('/requests/pending', protect, authorize('admin'), adminController.getPendingRequests);

/**
 * @swagger
 * /api/admin/requests/{requestId}:
 *   patch:
 *     summary: Aprovar/rejeitar pedido de mudança
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: Pedido processado
 *       403:
 *         description: Apenas admins
 */
router.put('/requests/:requestId', protect, authorize('admin'), adminController.handleTrainerChangeRequest);

module.exports = router;