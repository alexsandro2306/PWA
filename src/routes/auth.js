const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/auth/register
// @desc    Registar novo utilizador
// @access  Public
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username deve ter pelo menos 3 caracteres'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),
  body('firstName').trim().notEmpty().withMessage('Primeiro nome é obrigatório'),
  body('lastName').trim().notEmpty().withMessage('Último nome é obrigatório'),
  body('role').isIn(['client', 'trainer']).withMessage('Role inválido')
], authController.register);

// @route   POST /api/auth/login
// @desc    Login utilizador
// @access  Public
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username é obrigatório'),
  body('password').notEmpty().withMessage('Password é obrigatório')
], authController.login);

// @route   POST /api/auth/qrcode/generate
// @desc    Gerar QR Code para autenticação
// @access  Private
router.post('/qrcode/generate', protect, authController.generateQRCode);

// @route   POST /api/auth/qrcode/verify
// @desc    Verificar e ativar QR Code
// @access  Private
router.post('/qrcode/verify', protect, authController.verifyQRCode);

// @route   POST /api/auth/qrcode/login
// @desc    Login via QR Code
// @access  Public
router.post('/qrcode/login', authController.loginWithQRCode);

// @route   GET /api/auth/me
// @desc    Obter utilizador atual
// @access  Private
router.get('/me', protect, authController.getMe);

module.exports = router;