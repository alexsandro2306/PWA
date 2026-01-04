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

        // Query parameters para paginação
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Filtro de pesquisa
        const searchFilter = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { surname: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Query base
        const baseQuery = {
            role: 'trainer',
            isValidated: true,
            ...searchFilter
        };

        // Buscar trainers com paginação
        const trainers = await User.find(baseQuery)
            .select('name surname username email phone createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Contar total de documentos
        const totalItems = await User.countDocuments(baseQuery);
        const totalPages = Math.ceil(totalItems / limit);

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

        console.log(`✅ Encontrados ${trainersWithCount.length} trainers (página ${page}/${totalPages})`);

        res.json({
            success: true,
            data: trainersWithCount,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
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
        // Query parameters para paginação
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Buscar trainers pendentes com paginação
        const pendingTrainers = await User.find({
            role: 'trainer',
            isValidated: false
        })
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Contar total
        const totalItems = await User.countDocuments({
            role: 'trainer',
            isValidated: false
        });
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            success: true,
            data: pendingTrainers,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
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
router.put('/:id/validate', protect, authorize('admin'), async (req, res) => {
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
 * /api/trainers/today-alerts:
 *   get:
 *     summary: Obter alertas de treinos de hoje (Trainer)
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas de treinos de hoje
 */
router.get('/today-alerts', protect, authorize('trainer'), async (req, res) => {
    try {
        const trainerId = req.user._id;
        const TrainingPlan = require('../models/TrainingPlan');
        const TrainingLog = require('../models/TrainingLog');

        console.log('📊 Buscando alertas de treinos para trainer:', trainerId);

        // Get all clients of this trainer
        const clients = await User.find({
            role: 'client',
            trainer: trainerId
        }).select('firstName lastName avatar').lean();

        console.log(`👥 Clientes encontrados: ${clients.length}`);

        if (!clients || clients.length === 0) {
            console.log('❌ Nenhum cliente encontrado para este trainer');
            return res.json({
                success: true,
                data: {
                    completed: [],
                    missed: [],
                    notLogged: []
                },
                count: {
                    total: 0,
                    completed: 0,
                    missed: 0,
                    notLogged: 0
                }
            });
        }

        const completed = [];
        const missed = [];

        // Get all training logs for this trainer's clients
        const allLogs = await TrainingLog.find({
            trainerId: trainerId
        })
            .populate('clientId', 'firstName lastName avatar')
            .populate('planId', 'name')
            .sort({ date: -1 })
            .lean();

        console.log(`📝 Total de logs encontrados: ${allLogs.length}`);

        // Process logs
        for (const log of allLogs) {
            if (!log.clientId) continue; // Skip if client was deleted

            const clientData = {
                clientId: log.clientId._id,
                clientName: `${log.clientId.firstName} ${log.clientId.lastName}`,
                clientAvatar: log.clientId.avatar,
                workoutName: log.planId?.name || 'Plano de Treino',
                date: log.date
            };

            if (log.isCompleted) {
                // Client completed the workout
                console.log(`  ✅ ${clientData.clientName} COMPLETOU treino em ${new Date(log.date).toLocaleDateString('pt-PT')}`);
                completed.push({
                    ...clientData,
                    completedAt: log.createdAt || log.date
                });
            } else {
                // Client marked as not completed
                console.log(`  ⚠️ ${clientData.clientName} NÃO COMPLETOU treino em ${new Date(log.date).toLocaleDateString('pt-PT')}`);
                missed.push({
                    ...clientData,
                    reason: log.reason || 'Sem justificação',
                    loggedAt: log.createdAt || log.date
                });
            }
        }

        const totalCount = completed.length + missed.length;

        console.log(`✅ Alertas processados: ${totalCount} total (${completed.length} concluídos, ${missed.length} não concluídos)`);

        res.json({
            success: true,
            data: {
                completed,
                missed,
                notLogged: [] // Removemos a lógica de "não registados" pois agora mostramos todos os logs
            },
            count: {
                total: totalCount,
                completed: completed.length,
                missed: missed.length,
                notLogged: 0
            }
        });
    } catch (error) {
        console.error('❌ Erro ao buscar alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar alertas',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/trainers/today-alerts:
 *   delete:
 *     summary: Eliminar todos os alertas de treinos (Trainer)
 *     tags: [Trainers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alertas eliminados com sucesso
 */
router.delete('/today-alerts', protect, authorize('trainer'), async (req, res) => {
    try {
        const trainerId = req.user._id;
        const TrainingLog = require('../models/TrainingLog');

        console.log('🗑️ Eliminando todos os alertas para trainer:', trainerId);

        // Delete all training logs for this trainer
        const result = await TrainingLog.deleteMany({
            trainerId: trainerId
        });

        console.log(`✅ ${result.deletedCount} alertas eliminados`);

        res.json({
            success: true,
            message: 'Todos os alertas foram eliminados',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('❌ Erro ao eliminar alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar alertas',
            error: error.message
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