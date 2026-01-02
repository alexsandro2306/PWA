const WorkoutLog = require('../models/WorkoutLog');
const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/User');

// ========================================
// TRAINING PLAN MANAGEMENT (NEW)
// ========================================

// @desc    Create training plan
// @route   POST /api/workouts
// @access  Private (Trainer)
exports.createTrainingPlan = async (req, res) => {
    try {
        const { client, name, frequency, startDate, endDate, weeklyPlan } = req.body;

        // Verify client exists
        const clientUser = await User.findById(client);
        if (!clientUser) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verify trainer is associated with client
        if (clientUser.trainer?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Não tens permissão para criar planos para este cliente'
            });
        }

        // Deactivate existing active plans
        await TrainingPlan.updateMany(
            { client, isActive: true },
            { isActive: false }
        );

        // Create new plan
        const trainingPlan = await TrainingPlan.create({
            client,
            trainer: req.user._id,
            name,
            frequency,
            startDate,
            endDate,
            weeklyPlan,
            isActive: true
        });

        await trainingPlan.populate('client', 'firstName lastName email');
        await trainingPlan.populate('trainer', 'firstName lastName email');

        // ✅ SEND NOTIFICATION TO CLIENT
        const Notification = require('../models/Notification');
        await Notification.createNotification({
            recipient: client,
            sender: req.user._id,
            type: 'plan_created',
            title: '🎯 Novo Plano de Treino!',
            message: `O teu trainer criou um novo plano: "${name}". Frequência: ${frequency}x/semana`,
            link: '/client'
        });

        res.status(201).json({
            success: true,
            data: trainingPlan,
            message: 'Plano de treino criado com sucesso!'
        });

    } catch (error) {
        console.error('❌ Erro ao criar plano:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar plano de treino',
            error: error.message
        });
    }
};

// @desc    Get all training plans (filtered by role)
// @route   GET /api/workouts
// @access  Private
exports.getTrainingPlans = async (req, res) => {
    try {
        const { clientId } = req.query;
        let filter = {};

        if (req.user.role === 'client') {
            filter.client = req.user._id;
        } else if (req.user.role === 'trainer') {
            if (clientId) {
                // Verify trainer has access to this client
                const client = await User.findById(clientId);
                if (!client || client.trainer?.toString() !== req.user._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Acesso negado'
                    });
                }
                filter.client = clientId;
            } else {
                filter.trainer = req.user._id;
            }
        }

        const plans = await TrainingPlan.find(filter)
            .populate('client', 'firstName lastName email avatar')
            .populate('trainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: plans.length,
            data: plans
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter planos',
            error: error.message
        });
    }
};

// @desc    Get active training plan
// @route   GET /api/workouts/active
// @access  Private (Client)
exports.getActivePlan = async (req, res) => {
    try {
        const plan = await TrainingPlan.findActiveByClient(req.user._id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum plano ativo encontrado'
            });
        }

        res.json({
            success: true,
            data: plan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter plano ativo',
            error: error.message
        });
    }
};

// @desc    Get specific training plan
// @route   GET /api/workouts/:id
// @access  Private
exports.getTrainingPlan = async (req, res) => {
    try {
        const plan = await TrainingPlan.findById(req.params.id)
            .populate('client', 'firstName lastName email avatar')
            .populate('trainer', 'firstName lastName email avatar');

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plano não encontrado'
            });
        }

        // Verify authorization
        const isClient = req.user._id.toString() === plan.client._id.toString();
        const isTrainer = req.user._id.toString() === plan.trainer._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isClient && !isTrainer && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            data: plan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter plano',
            error: error.message
        });
    }
};

// @desc    Update training plan
// @route   PUT /api/workouts/:id
// @access  Private (Trainer)
exports.updateTrainingPlan = async (req, res) => {
    try {
        let plan = await TrainingPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plano não encontrado'
            });
        }

        // Verify trainer owns this plan
        if (plan.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: apenas o trainer responsável pode editar'
            });
        }

        const { name, frequency, startDate, endDate, weeklyPlan, isActive } = req.body;

        plan = await TrainingPlan.findByIdAndUpdate(
            req.params.id,
            { name, frequency, startDate, endDate, weeklyPlan, isActive },
            { new: true, runValidators: true }
        )
            .populate('client', 'firstName lastName email')
            .populate('trainer', 'firstName lastName email');

        res.json({
            success: true,
            data: plan,
            message: 'Plano atualizado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar plano',
            error: error.message
        });
    }
};

// @desc    Delete training plan
// @route   DELETE /api/workouts/:id
// @access  Private (Trainer/Admin)
exports.deleteTrainingPlan = async (req, res) => {
    try {
        const plan = await TrainingPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plano não encontrado'
            });
        }

        // Verify authorization
        const isTrainer = plan.trainer.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isTrainer && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await plan.deleteOne();

        res.json({
            success: true,
            message: 'Plano eliminado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar plano',
            error: error.message
        });
    }
};

// ========================================
// WORKOUT LOGS (EXISTING)
// ========================================

// @desc    Registar conclusão de treino
// @route   POST /api/workouts/log
// @access  Private (Client)
exports.logWorkout = async (req, res) => {
    try {
        const {
            trainingPlanId,
            dayOfWeek,
            exercises,
            completed,
            notes,
            proofImage,
            missedReason
        } = req.body;

        const clientId = req.user._id;

        // Verificar se o plano existe e pertence ao cliente
        const trainingPlan = await TrainingPlan.findById(trainingPlanId);
        if (!trainingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Plano de treino não encontrado'
            });
        }

        if (trainingPlan.client.toString() !== clientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: este plano não pertence a ti'
            });
        }

        // Se não completou, razão é obrigatória
        if (!completed && !missedReason) {
            return res.status(400).json({
                success: false,
                message: 'Razão obrigatória para treinos não concluídos'
            });
        }

        // Criar log de workout
        const workoutLog = await WorkoutLog.create({
            client: clientId,
            trainer: trainingPlan.trainer,
            trainingPlan: trainingPlanId,
            dayOfWeek,
            exercises,
            completed,
            notes,
            proofImage,
            missedReason
        });

        await workoutLog.populate('client', 'firstName lastName email');
        await workoutLog.populate('trainer', 'firstName lastName email');

        res.status(201).json({
            success: true,
            workoutLog,
            message: completed
                ? 'Treino registado com sucesso!'
                : 'Falta registada. Continua a esforçar-te!'
        });

    } catch (error) {
        console.error('❌ Erro ao registar workout:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao registar treino',
            error: error.message
        });
    }
};

// @desc    Obter logs de workout (filtrado por role)
// @route   GET /api/workouts/logs
// @access  Private
exports.getWorkoutLogs = async (req, res) => {
    try {
        const { startDate, endDate, completed } = req.query;
        let filter = {};

        // Filtrar por role
        if (req.user.role === 'client') {
            filter.client = req.user._id;
        } else if (req.user.role === 'trainer') {
            filter.trainer = req.user._id;
        }

        // Filtros opcionais
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (completed !== undefined) {
            filter.completed = completed === 'true';
        }

        const workoutLogs = await WorkoutLog.find(filter)
            .populate('client', 'firstName lastName email avatar')
            .populate('trainer', 'firstName lastName email avatar')
            .populate('trainingPlan', 'weekPlan')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: workoutLogs.length,
            workoutLogs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter logs de treino',
            error: error.message
        });
    }
};

// @desc    Obter log específico
// @route   GET /api/workouts/logs/:id
// @access  Private
exports.getWorkoutLog = async (req, res) => {
    try {
        const workoutLog = await WorkoutLog.findById(req.params.id)
            .populate('client', 'firstName lastName email avatar')
            .populate('trainer', 'firstName lastName email avatar')
            .populate('trainingPlan');

        if (!workoutLog) {
            return res.status(404).json({
                success: false,
                message: 'Log não encontrado'
            });
        }

        // Verificar autorização
        const isClient = req.user._id.toString() === workoutLog.client._id.toString();
        const isTrainer = req.user._id.toString() === workoutLog.trainer._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isClient && !isTrainer && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            workoutLog
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter log',
            error: error.message
        });
    }
};

// @desc    Atualizar log de workout
// @route   PUT /api/workouts/logs/:id
// @access  Private (Client)
exports.updateWorkoutLog = async (req, res) => {
    try {
        let workoutLog = await WorkoutLog.findById(req.params.id);

        if (!workoutLog) {
            return res.status(404).json({
                success: false,
                message: 'Log não encontrado'
            });
        }

        // Verificar se é o cliente dono do log
        if (workoutLog.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: apenas podes editar os teus logs'
            });
        }

        const { exercises, completed, notes, proofImage, missedReason } = req.body;

        // Validação
        if (!completed && !missedReason) {
            return res.status(400).json({
                success: false,
                message: 'Razão obrigatória para treinos não concluídos'
            });
        }

        workoutLog = await WorkoutLog.findByIdAndUpdate(
            req.params.id,
            { exercises, completed, notes, proofImage, missedReason },
            { new: true, runValidators: true }
        )
            .populate('client', 'firstName lastName email')
            .populate('trainer', 'firstName lastName email');

        res.json({
            success: true,
            workoutLog,
            message: 'Log atualizado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar log',
            error: error.message
        });
    }
};

// @desc    Eliminar log
// @route   DELETE /api/workouts/logs/:id
// @access  Private (Client/Admin)
exports.deleteWorkoutLog = async (req, res) => {
    try {
        const workoutLog = await WorkoutLog.findById(req.params.id);

        if (!workoutLog) {
            return res.status(404).json({
                success: false,
                message: 'Log não encontrado'
            });
        }

        // Verificar autorização
        const isOwner = workoutLog.client.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await workoutLog.deleteOne();

        res.json({
            success: true,
            message: 'Log eliminado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar log',
            error: error.message
        });
    }
};

// @desc    Obter estatísticas de treinos
// @route   GET /api/workouts/stats
// @access  Private
exports.getWorkoutStats = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let userId = req.user._id;
        let filter = {};

        // Filtrar por role
        if (req.user.role === 'client') {
            filter.client = userId;
        } else if (req.user.role === 'trainer') {
            filter.trainer = userId;
        }

        // Período
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        filter.date = { $gte: startDate };

        // Agregação
        const stats = await WorkoutLog.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    completedWorkouts: {
                        $sum: { $cond: ['$completed', 1, 0] }
                    },
                    missedWorkouts: {
                        $sum: { $cond: ['$completed', 0, 1] }
                    }
                }
            }
        ]);

        // Workouts por semana
        const weeklyStats = await WorkoutLog.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { $week: '$date' },
                    count: { $sum: 1 },
                    completed: { $sum: { $cond: ['$completed', 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            period,
            stats: stats[0] || { totalWorkouts: 0, completedWorkouts: 0, missedWorkouts: 0 },
            weeklyStats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas',
            error: error.message
        });
    }
};

// @desc    Obter histórico de treinos do cliente
// @route   GET /api/workouts/client/:clientId/history
// @access  Private (Trainer/Admin)
exports.getClientWorkoutHistory = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { limit = 20 } = req.query;

        // Verificar autorização
        const client = await User.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        const isTrainer = client.trainer?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isTrainer && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const workoutLogs = await WorkoutLog.find({ client: clientId })
            .populate('trainingPlan', 'weekPlan')
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: workoutLogs.length,
            workoutLogs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter histórico',
            error: error.message
        });
    }
};

// @desc    Upload de imagem de prova
// @route   POST /api/workouts/upload-proof
// @access  Private (Client)
exports.uploadProofImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhuma imagem enviada'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            imageUrl,
            message: 'Imagem enviada com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer upload',
            error: error.message
        });
    }
};