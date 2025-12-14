const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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
 *         description: ID do trainer
 *     responses:
 *       200:
 *         description: Trainer validado
 *       403:
 *         description: Apenas admins
 *       404:
 *         description: Trainer não encontrado
 */
router.patch('/trainers/:trainerId/validate', protect, authorize('admin'), adminController.validateTrainer);

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
 *       204:
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
 *                 example: approve
 *     responses:
 *       200:
 *         description: Pedido processado
 *       400:
 *         description: Ação inválida
 *       403:
 *         description: Apenas admins
 */
router.patch('/requests/:requestId', protect, authorize('admin'), adminController.handleTrainerChangeRequest);

module.exports = router;
