const User = require('../models/User');

/**
 * Middleware para verificar se o Personal Trainer tem relação com o Cliente
 * Protege rotas onde o PT tenta aceder dados de clientes que não são seus
 */
exports.checkTrainerClientRelation = async (req, res, next) => {
    try {
        const trainerId = req.user._id;

        // Obter clientId dos params ou body
        const clientId = req.params.clientId || req.body.client || req.body.clientId;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID do cliente não fornecido'
            });
        }

        // Buscar cliente
        const client = await User.findById(clientId);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar se o trainer logado é o trainer do cliente
        if (!client.trainer || client.trainer.toString() !== trainerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Não é o Personal Trainer deste cliente.'
            });
        }

        // Disponibilizar o cliente para o controller
        req.targetClient = client;

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar relação trainer-cliente',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar se o Cliente pertence ao Trainer
 * (Versão simplificada para uso em queries)
 */
exports.verifyTrainerAccess = async (req, res, next) => {
    try {
        const trainerId = req.user._id;
        const clientId = req.params.clientId;

        const client = await User.findOne({ _id: clientId, trainer: trainerId });

        if (!client) {
            return res.status(403).json({
                success: false,
                message: 'Cliente não encontrado ou não pertence a este trainer'
            });
        }

        req.targetClient = client;
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar acesso',
            error: error.message
        });
    }
};