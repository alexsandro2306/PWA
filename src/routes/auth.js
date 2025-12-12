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

/**
 * @swagger
 * /api/auth/qrcode/generate:
 *   post:
 *     summary: Gerar QR Code para autenticação de dois fatores
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR Code gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 qrCodeURL:
 *                   type: string
 *                 secret:
 *                   type: string
 *       401:
 *         description: Não autorizado
 */
router.post('/qrcode/generate', protect, authController.generateQRCode);

/**
 * @swagger
 * /api/auth/qrcode/verify:
 *   post:
 *     summary: Verificar e ativar QR Code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: QR Code verificado e ativado
 *       401:
 *         description: Token inválido
 */
router.post('/qrcode/verify', protect, authController.verifyQRCode);

/**
 * @swagger
 * /api/auth/qrcode/login:
 *   post:
 *     summary: Login via QR Code (autenticação de dois fatores)
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
 *               - token
 *             properties:
 *               username:
 *                 type: string
 *                 example: joaosilva
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       401:
 *         description: Token ou credenciais inválidas
 */
router.post('/qrcode/login', authController.loginWithQRCode);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter utilizador autenticado atual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do utilizador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autorizado
 */
router.get('/me', protect, authController.getMe);

module.exports = router;