const { body } = require('express-validator');
const { USER_ROLES } = require('../utils/userConstants');

// Regras de validação para o Registo de Utilizador
exports.validateRegistration = [
    body('username')
        .notEmpty().withMessage('Username é obrigatório')
        .isLength({ min: 3 }).withMessage('Username deve ter pelo menos 3 caracteres'),
        
    body('email')
        .isEmail().withMessage('Email inválido'),

    body('password')
        .isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres'),

    body('firstName').notEmpty().withMessage('Nome é obrigatório'),
    body('lastName').notEmpty().withMessage('Apelido é obrigatório'),
    
    body('role')
        .optional()
        .isIn(Object.values(USER_ROLES)).withMessage('Role inválido')
];

// Regras de validação para o Login
exports.validateLogin = [
    body('username').notEmpty().withMessage('Username é obrigatório'),
    body('password').notEmpty().withMessage('Password é obrigatória')
];

// Middleware para verificar o resultado da validação
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Erro de validação',
            errors: errors.array() 
        });
    }
    next();
};