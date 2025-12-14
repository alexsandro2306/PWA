const User = require('../models/User');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');

// Gerar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Registar novo utilizador
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, firstName, lastName, role, phone } = req.body;

  try {
    // Verificar se utilizador já existe
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'Utilizador já existe' });
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
      isValidated: role === 'client' ? true : false // Clientes validados automaticamente
    });

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
        isValidated: user.isValidated
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registar utilizador', error: error.message });
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
        theme: user.theme
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
};

// @desc    Gerar QR Code
exports.generateQRCode = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `FitnessPlatform (${req.user.username})`
    });

    req.user.qrCodeSecret = secret.base32;
    await req.user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode: qrCodeUrl,
      secret: secret.base32
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar QR Code', error: error.message });
  }
};

// @desc    Verificar QR Code
exports.verifyQRCode = async (req, res) => {
  const { token } = req.body;

  try {
    const verified = speakeasy.totp.verify({
      secret: req.user.qrCodeSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      req.user.qrCodeEnabled = true;
      await req.user.save();

      res.json({
        success: true,
        message: 'QR Code ativado com sucesso'
      });
    } else {
      res.status(400).json({ message: 'Token inválido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar QR Code', error: error.message });
  }
};

// @desc    Login com QR Code
exports.loginWithQRCode = async (req, res) => {
  const { username, token } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user || !user.qrCodeEnabled) {
      return res.status(401).json({ message: 'QR Code não configurado para este utilizador' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.qrCodeSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const authToken = generateToken(user._id);

    res.json({
      success: true,
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isValidated: user.isValidated,
        theme: user.theme
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login com QR Code', error: error.message });
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
    res.status(500).json({ message: 'Erro ao obter utilizador', error: error.message });
  }
};