const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registar novo utilizador
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: joaosilva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: joao@email.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: senha123
 *               firstName:
 *                 type: string
 *                 example: João
 *               lastName:
 *                 type: string
 *                 example: Silva
 *               role:
 *                 type: string
 *                 enum: [client, trainer]
 *                 example: client
 *               phone:
 *                 type: string
 *                 example: +351912345678
 *     responses:
 *       201:
 *         description: Utilizador registado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username deve ter pelo menos 3 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
  body('firstName').trim().notEmpty().withMessage('Primeiro nome é obrigatório'),
  body('lastName').trim().notEmpty().withMessage('Último nome é obrigatório'),
  body('role').isIn(['client', 'trainer']).withMessage('Role inválido')
], authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de utilizador
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: joaosilva
 *               password:
 *                 type: string
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username é obrigatório'),
  body('password').notEmpty().withMessage('Password é obrigatório')
], authController.login);

router.post('/login-qr', authController.loginWithQR);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter utilizador atual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', protect, authController.getMe);

// ✅ NOVO: Rotas para Reset Password
/**
 * @swagger
 * /api/auth/verify-user:
 *   post:
 *     summary: Verificar se utilizador existe (Step 1 do Reset Password)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email ou username do utilizador
 *                 example: joaosilva
 *     responses:
 *       200:
 *         description: Utilizador encontrado
 *       404:
 *         description: Utilizador não encontrado
 */
router.post('/verify-user', authController.verifyUser);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Redefinir password (Step 2 do Reset Password)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - newPassword
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email ou username do utilizador
 *                 example: joaosilva
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: Nova password
 *                 example: novasenha123
 *     responses:
 *       200:
 *         description: Password redefinida com sucesso
 *       404:
 *         description: Utilizador não encontrado
 *       400:
 *         description: Dados inválidos
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;