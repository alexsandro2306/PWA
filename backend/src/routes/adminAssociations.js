const express = require('express');
const router = express.Router();
const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ✅ GET /admin/associations - Ver todas as associações ativas
router.get('/associations', protect, authorize('admin'), async (req, res) => {
    try {
        // Buscar todos os clientes que têm trainer
        const clients = await User.find({
            role: 'client',
            trainer: { $exists: true, $ne: null }
        })
            .populate('trainer', 'firstName lastName email avatar')
            .select('firstName lastName email avatar trainer createdAt');

        // Formatar dados
        const associations = clients.map(client => ({
            _id: client._id,
            client: {
                _id: client._id,
                firstName: client.firstName,
                lastName: client.lastName,
                email: client.email,
                avatar: client.avatar
            },
            trainer: {
                _id: client.trainer._id,
                firstName: client.trainer.firstName,
                lastName: client.trainer.lastName,
                email: client.trainer.email,
                avatar: client.trainer.avatar,
                clientCount: 0 // Será calculado abaixo
            },
            associatedAt: client.createdAt
        }));

        // Contar clientes de cada trainer
        for (let assoc of associations) {
            const count = await User.countDocuments({
                role: 'client',
                trainer: assoc.trainer._id
            });
            assoc.trainer.clientCount = count;
        }

        res.json({
            success: true,
            count: associations.length,
            associations
        });
    } catch (error) {
        console.error('Erro ao buscar associações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar associações'
        });
    }
});

// ✅ GET /admin/requests/history - Ver histórico de pedidos
router.get('/requests/history', protect, authorize('admin'), async (req, res) => {
    try {
        const requests = await TrainerRequest.find({})
            .populate('client', 'firstName lastName email avatar')
            .populate('newTrainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 })
            .limit(100); // Últimos 100 pedidos

        res.json({
            success: true,
            count: requests.length,
            requests: requests.map(req => ({
                _id: req._id,
                client: req.client,
                trainer: req.newTrainer,
                reason: req.reason,
                status: req.status,
                createdAt: req.createdAt,
                handledAt: req.handledAt
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico de pedidos'
        });
    }
});

// ✅ DELETE /admin/associations/:clientId - Remover associação
router.delete('/associations/:clientId', protect, authorize('admin'), async (req, res) => {
    try {
        const { clientId } = req.params;

        // Buscar cliente
        const client = await User.findById(clientId);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        if (!client.trainer) {
            return res.status(400).json({
                success: false,
                message: 'Cliente não tem trainer associado'
            });
        }

        // Guardar ID do trainer para remover cliente da lista
        const trainerId = client.trainer;

        // Remover associação
        client.trainer = null;
        await client.save();

        // Remover cliente da lista do trainer (se o modelo tiver array de clients)
        await User.findByIdAndUpdate(trainerId, {
            $pull: { clients: clientId }
        });

        res.json({
            success: true,
            message: 'Associação removida com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover associação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover associação'
        });
    }
});

module.exports = router;