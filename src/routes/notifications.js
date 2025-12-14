const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

// @route   GET /api/notifications
// @desc    Obter notificações do utilizador
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Socket.IO será usado para notificações em tempo real
        // Esta rota pode servir para obter histórico de notificações

        // Por agora, retorna lista vazia - implementação completa 
        // depende de lógica de armazenamento de notificações
        res.json({
            success: true,
            data: [],
            message: 'Notificações em tempo real via Socket.IO'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter notificações',
            error: error.message
        });
    }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Marcar notificação como lida
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
    try {
        // Implementação futura para marcar notificação como lida
        res.json({
            success: true,
            message: 'Notificação marcada como lida'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar notificação',
            error: error.message
        });
    }
});

module.exports = router;
