const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/trainers/public:
 *   get:
 *     summary: Lista todos os trainers validados (público)
 *     tags: [Trainers]
 *     responses:
 *       200:
 *         description: Lista de trainers públicos
 */
router.get('/public', async (req, res) => {
    try {
        console.log('📋 Buscando trainers públicos...');

        const trainers = await User.find({
            role: 'trainer',
            isValidated: true
        })
            .select('name surname username email phone createdAt')
            .lean();

        // Contar clientes de cada trainer
        const trainersWithCount = await Promise.all(
            trainers.map(async (trainer) => {
                const clientCount = await User.countDocuments({
                    role: 'client',
                    trainerId: trainer._id
                });
                return { ...trainer, clientCount };
            })
        );

        console.log(`✅ Encontrados ${trainersWithCount.length} trainers públicos`);

        res.json({
            success: true,
            data: trainersWithCount
        });
    } catch (error) {
        console.error('❌ Erro ao buscar trainers públicos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar trainers',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/trainers/pending:
 *   get:
 *     summary: Lista trainers pendentes de validação (Admin)
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de trainers pendentes
 */
router.get('/pending', protect, authorize('admin'), async (req, res) => {
    try {
        const pendingTrainers = await User.find({
            role: 'trainer',
            isValidated: false
        }).select('-password');

        res.json({
            success: true,
            data: pendingTrainers
        });
    } catch (error) {
        console.error('Erro ao buscar trainers pendentes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar trainers pendentes'
        });
    }
});

/**
 * @swagger
 * /api/trainers/{id}/validate:
 *   patch:
 *     summary: Validar um trainer (Admin)
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer validado com sucesso
 */
router.patch('/:id/validate', protect, authorize('admin'), async (req, res) => {
    try {
        const trainer = await User.findById(req.params.id);

        if (!trainer) {
            return res.status(404).json({
                success: false,
                message: 'Trainer não encontrado'
            });
        }

        if (trainer.role !== 'trainer') {
            return res.status(400).json({
                success: false,
                message: 'Utilizador não é um trainer'
            });
        }

        trainer.isValidated = true;
        await trainer.save();

        res.json({
            success: true,
            message: 'Trainer validado com sucesso',
            data: trainer
        });
    } catch (error) {
        console.error('Erro ao validar trainer:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao validar trainer'
        });
    }
});

/**
 * @swagger
 * /api/trainers/{id}/reject:
 *   delete:
 *     summary: Rejeitar um trainer (Admin)
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trainer rejeitado com sucesso
 */
router.delete('/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        const trainer = await User.findById(req.params.id);

        if (!trainer) {
            return res.status(404).json({
                success: false,
                message: 'Trainer não encontrado'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Trainer rejeitado e removido'
        });
    } catch (error) {
        console.error('Erro ao rejeitar trainer:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar trainer'
        });
    }
});

/**
 * @swagger
 * /api/trainers/{id}:
 *   get:
 *     summary: Buscar trainer por ID
 *     tags: [Trainers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do trainer
 */
router.get('/:id', async (req, res) => {
    try {
        console.log('🔍 Buscando trainer por ID:', req.params.id);

        const trainer = await User.findById(req.params.id)
            .select('-password')
            .lean();

        if (!trainer) {
            console.log('❌ Trainer não encontrado');
            return res.status(404).json({
                success: false,
                message: 'Trainer não encontrado'
            });
        }

        if (trainer.role !== 'trainer') {
            console.log('❌ Utilizador não é trainer');
            return res.status(400).json({
                success: false,
                message: 'Utilizador não é um trainer'
            });
        }

        // Contar clientes
        const clientCount = await User.countDocuments({
            role: 'client',
            trainerId: trainer._id
        });

        console.log('✅ Trainer encontrado:', trainer.name);

        res.json({
            success: true,
            data: { ...trainer, clientCount }
        });
    } catch (error) {
        console.error('❌ Erro ao buscar trainer:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar trainer'
        });
    }
});

module.exports = router;