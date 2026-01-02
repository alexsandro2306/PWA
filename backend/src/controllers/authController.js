const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Gerar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Registar novo utilizador
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    username,
    email,
    password,
    firstName,
    lastName,
    role,
    phone,
    trainer
  } = req.body;

  try {
    // Verificar se utilizador já existe
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Utilizador já existe' });
    }

    // Validação: Se trainer for passado, verificar se existe e é válido
    if (trainer) {
      const trainerExists = await User.findOne({
        _id: trainer,
        role: 'trainer',
        isValidated: true
      });

      if (!trainerExists) {
        return res.status(400).json({
          success: false,
          message: 'Personal Trainer inválido ou não validado.'
        });
      }
    }

    // Criar novo utilizador
    user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      trainer: trainer || null,
      isValidated: role === 'client' ? true : false // Clientes validados automaticamente
    });

    // Se foi associado a um trainer, adicionar cliente à lista do trainer
    if (trainer) {
      await User.findByIdAndUpdate(
        trainer,
        { $addToSet: { clients: user._id } }
      );
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isValidated: user.isValidated,
        trainer: user.trainer
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao registar utilizador',
      error: error.message
    });
  }
};

// @desc    Login utilizador
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isValidated: user.isValidated,
        theme: user.theme,
        trainer: user.trainer
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
      error: error.message
    });
  }
};

// @desc    Obter utilizador atual
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('trainer', 'firstName lastName email')
      .populate('clients', 'firstName lastName email');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter utilizador',
      error: error.message
    });
  }
};

// ✅ NOVO: Verificar se utilizador existe (Step 1 do Reset Password)
// @desc    Verificar se utilizador existe
// @route   POST /api/auth/verify-user
// @access  Public
exports.verifyUser = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Por favor forneça email ou username'
      });
    }

    // Procurar por email ou username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Utilizador encontrado'
    });

  } catch (error) {
    console.error('Erro ao verificar utilizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar utilizador',
      error: error.message
    });
  }
};

// ✅ NOVO: Reset password (Step 2 do Reset Password)
// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;

    if (!identifier || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Por favor forneça todos os campos'
      });
    }

    // Validar password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A password deve ter pelo menos 6 caracteres'
      });
    }

    // Procurar utilizador
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    // ✅ CORRIGIDO: Deixar o modelo fazer o hash automaticamente
    // Não fazer hash aqui para evitar hash duplo
    user.password = newPassword;

    await user.save();

    res.json({
      success: true,
      message: 'Password redefinida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao redefinir password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir password',
      error: error.message
    });
  }
};

// @desc    Login com QR Code
// @route   POST /api/auth/login-qr
// @access  Public
exports.loginWithQR = async (req, res) => {
  try {
    const { userId, secret } = req.body;

    if (!userId || !secret) {
      return res.status(400).json({
        success: false,
        message: 'Dados do QR Code inválidos'
      });
    }

    const user = await User.findById(userId).select('+qrCodeSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    if (!user.qrCodeEnabled || !user.qrCodeSecret) {
      return res.status(400).json({
        success: false,
        message: 'QR Code não está ativado'
      });
    }

    if (user.qrCodeSecret !== secret) {
      return res.status(401).json({
        success: false,
        message: 'QR Code inválido'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isValidated: user.isValidated,
        theme: user.theme,
        trainer: user.trainer
      }
    });

  } catch (error) {
    console.error('Erro no login com QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login com QR Code',
      error: error.message
    });
  }
};