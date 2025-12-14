const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const messageController = require('../controllers/messageController');

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Enviar mensagem
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               content:
 *                 type: string
 *                 example: Olá! Como estão os treinos?
 *     responses:
 *       201:
 *         description: Mensagem enviada
 *       400:
 *         description: Dados inválidos
 */
router.post('/send', protect, messageController.sendMessage);

/**
 * @swagger
 * /api/messages/unread:
 *   get:
 *     summary: Ver mensagens não lidas
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mensagens não lidas
 */
router.get('/unread', protect, messageController.getUnreadMessages);

/**
 * @swagger
 * /api/messages/{interlocutorId}:
 *   get:
 *     summary: Ver conversação com utilizador
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interlocutorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do outro utilizador
 *     responses:
 *       200:
 *         description: Histórico de conversação
 */
router.get('/:interlocutorId', protect, messageController.getConversation);

/**
 * @swagger
 * /api/messages/alert:
 *   post:
 *     summary: Enviar alerta de treino (Trainer)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *               content:
 *                 type: string
 *                 example: Treino de hoje não foi cumprido!
 *     responses:
 *       201:
 *         description: Alerta enviado
 *       403:
 *         description: Apenas trainers
 */
router.post('/alert', protect, authorize('trainer'), messageController.sendTrainingAlert);

module.exports = router;
