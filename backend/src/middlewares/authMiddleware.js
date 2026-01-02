const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Proteger rotas - requer autenticação
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, token não encontrado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Utilizador não encontrado' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Não autorizado, token inválido' });
  }
};

// Restringir por role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} não tem permissão para aceder este recurso`
      });
    }
    next();
  };
};

// Verificar se trainer está validado
exports.validateTrainer = (req, res, next) => {
  if (req.user.role === 'trainer' && !req.user.isValidated) {
    return res.status(403).json({
      message: 'Personal trainer precisa ser validado pelo administrador'
    });
  }
  next();
};

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Headers:', req.headers.authorization);

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ Token não encontrado');
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária'
      });
    }

    console.log('🔍 Token recebido:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido, userId:', decoded.userId);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      console.log('❌ User não encontrado:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Utilizador não encontrado'
      });
    }

    console.log('✅ User autenticado:', user.firstName, user.role);

    req.user = user;
    req.user.id = user._id;
    next();
  } catch (error) {
    console.error('❌ Erro no auth middleware:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};