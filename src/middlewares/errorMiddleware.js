// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
    // Definir status e mensagem padrão
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Erro interno do servidor';

    // --- 1. Erros Específicos do Mongoose ---

    // Erro de Validação (Ex: campo obrigatório em falta, falha na validação do schema)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        // Mapeia todos os erros de validação em uma string legível
        message = Object.values(err.errors).map(val => val.message).join('. ');
    }

    // Erro de Chave Duplicada (Ex: username ou email já existe)
    if (err.code === 11000) {
        statusCode = 400;
        // Captura o campo que causou a duplicação
        const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
        message = `Valor duplicado: ${value}. Por favor, use outro valor.`;
    }
    
    // Erro de ID Inválido (Ex: um ID de cliente passado na URL não está no formato ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Recurso não encontrado. ID inválido: ${err.value}`;
    }

    // --- 2. Erros de Autenticação JWT ---

    // Token JWT inválido
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido. Faça login novamente.';
    }
    
    // Token JWT expirado
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado. Faça login novamente.';
    }


    // --- 3. Enviar Resposta ---
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        // Incluir o stack trace apenas em ambiente de desenvolvimento
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

// Middleware para lidar com rotas não encontradas (404)
const notFound = (req, res, next) => {
    const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error); // Passa para o errorHandler
};

module.exports = { errorHandler, notFound };