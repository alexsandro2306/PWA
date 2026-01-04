const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/User');

// @desc    Criar plano de treino
// @route   POST /api/training
// @access  Private (Trainer)
exports.createTrainingPlan = async (req, res) => {
    try {
        const { clientId, weekPlan, startDate, endDate, notes } = req.body;
        const trainerId = req.user._id;

        // Verificar se o cliente existe
        const targetClient = await User.findById(clientId);
        if (!targetClient) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // ✅ LÓGICA DE ASSOCIAÇÃO
        if (!targetClient.trainer) {
            // Cliente SEM trainer → AUTO-ASSOCIAÇÃO na primeira atribuição de plano
            console.log(`✅ Associando cliente ${targetClient.firstName} ao trainer ${req.user.firstName}`);

            targetClient.trainer = trainerId;
            await targetClient.save();

            // Adicionar cliente à lista do trainer
            await User.findByIdAndUpdate(
                trainerId,
                { $addToSet: { clients: clientId } }
            );
        } else if (targetClient.trainer.toString() !== trainerId.toString()) {
            // Cliente JÁ TEM trainer diferente → BLOQUEADO
            return res.status(403).json({
                success: false,
                message: 'Este cliente já está associado a outro Personal Trainer. Solicite uma mudança ao administrador.'
            });
        }
        // Se targetClient.trainer === trainerId → OK, pode criar plano

        // Validar estrutura do plano semanal
        if (!weekPlan || !Array.isArray(weekPlan)) {
            return res.status(400).json({
                success: false,
                message: 'Plano semanal inválido'
            });
        }

        // Validar número de dias (3, 4 ou 5 dias por semana)
        const activeDays = weekPlan.filter(day => day.exercises && day.exercises.length > 0);
        if (activeDays.length < 3 || activeDays.length > 5) {
            return res.status(400).json({
                success: false,
                message: 'O plano deve ter entre 3 e 5 dias de treino por semana'
            });
        }

        // Validar máximo de 10 exercícios por sessão
        for (let day of activeDays) {
            if (day.exercises.length > 10) {
                return res.status(400).json({
                    success: false,
                    message: `Dia ${day.dayOfWeek}: máximo de 10 exercícios por sessão`
                });
            }
        }

        // Criar plano de treino
        const trainingPlan = await TrainingPlan.create({
            trainer: trainerId,
            client: clientId,
            weekPlan,
            startDate,
            endDate,
            notes,
            isActive: true
        });

        await trainingPlan.populate('trainer', 'firstName lastName email');
        await trainingPlan.populate('client', 'firstName lastName email');

        res.status(201).json({
            success: true,
            trainingPlan,
            message: targetClient.trainer.toString() === trainerId.toString()
                ? 'Plano de treino criado com sucesso'
                : 'Plano criado e cliente associado com sucesso'
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

// @desc    Obter todos os planos de treino (filtrado por role)
// @route   GET /api/training
// @access  Private
exports.getTrainingPlans = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'trainer') {
            filter.trainer = req.user._id;
        } else if (req.user.role === 'client') {
            filter.client = req.user._id;
        }

        const trainingPlans = await TrainingPlan.find(filter)
            .populate('trainer', 'firstName lastName email avatar')
            .populate('client', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: trainingPlans.length,
            trainingPlans
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter planos de treino',
            error: error.message
        });
    }
};

// @desc    Obter plano de treino específico
// @route   GET /api/training/:id
// @access  Private
exports.getTrainingPlan = async (req, res) => {
    try {
        const trainingPlan = await TrainingPlan.findById(req.params.id)
            .populate('trainer', 'firstName lastName email avatar')
            .populate('client', 'firstName lastName email avatar');

        if (!trainingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Plano de treino não encontrado'
            });
        }

        // Verificar autorização
        const isTrainer = req.user._id.toString() === trainingPlan.trainer._id.toString();
        const isClient = req.user._id.toString() === trainingPlan.client._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isTrainer && !isClient && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            trainingPlan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter plano de treino',
            error: error.message
        });
    }
};

// @desc    Atualizar plano de treino
// @route   PUT /api/training/:id
// @access  Private (Trainer)
exports.updateTrainingPlan = async (req, res) => {
    try {
        let trainingPlan = await TrainingPlan.findById(req.params.id);

        if (!trainingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Plano de treino não encontrado'
            });
        }

        // Verificar se o trainer é o dono do plano
        if (trainingPlan.trainer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: apenas o trainer responsável pode editar este plano'
            });
        }

        const { weekPlan, startDate, endDate, notes, isActive } = req.body;

        // Validações (se weekPlan for atualizado)
        if (weekPlan) {
            const activeDays = weekPlan.filter(day => day.exercises && day.exercises.length > 0);
            if (activeDays.length < 3 || activeDays.length > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'O plano deve ter entre 3 e 5 dias de treino por semana'
                });
            }

            for (let day of activeDays) {
                if (day.exercises.length > 10) {
                    return res.status(400).json({
                        success: false,
                        message: `Dia ${day.dayOfWeek}: máximo de 10 exercícios por sessão`
                    });
                }
            }
        }

        trainingPlan = await TrainingPlan.findByIdAndUpdate(
            req.params.id,
            { weekPlan, startDate, endDate, notes, isActive },
            { new: true, runValidators: true }
        )
            .populate('trainer', 'firstName lastName email')
            .populate('client', 'firstName lastName email');

        res.json({
            success: true,
            trainingPlan,
            message: 'Plano de treino atualizado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar plano de treino',
            error: error.message
        });
    }
};

// @desc    Eliminar plano de treino
// @route   DELETE /api/training/:id
// @access  Private (Trainer)
exports.deleteTrainingPlan = async (req, res) => {
    try {
        const trainingPlan = await TrainingPlan.findById(req.params.id);

        if (!trainingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Plano de treino não encontrado'
            });
        }

        // Verificar autorização
        if (trainingPlan.trainer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        await trainingPlan.deleteOne();

        res.json({
            success: true,
            message: 'Plano de treino eliminado com sucesso'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar plano de treino',
            error: error.message
        });
    }
};

// @desc    Obter plano ativo do cliente
// @route   GET /api/training/client/:clientId/active
// @access  Private
exports.getActiveTrainingPlan = async (req, res) => {
    try {
        const { clientId } = req.params;

        const trainingPlan = await TrainingPlan.findOne({
            client: clientId,
            isActive: true
        })
            .populate('trainer', 'firstName lastName email avatar')
            .populate('client', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        if (!trainingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum plano ativo encontrado'
            });
        }

        res.json({
            success: true,
            trainingPlan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter plano ativo',
            error: error.message
        });
    }
};