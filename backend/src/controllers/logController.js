const TrainingLog = require('../models/TrainingLog');
const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;

// ✅ CRIAR LOG DE TREINO (com upload de imagem)
exports.createTrainingLog = async (req, res) => {
    try {
        const { planId, workoutId, date, isCompleted, reason } = req.body;
        const clientId = req.user._id || req.user.id;

        console.log('📝 Criando log de treino:', { planId, workoutId, date, isCompleted, reason, clientId });

        // Validações
        if (!planId || workoutId === undefined || !date) {
            return res.status(400).json({
                success: false,
                message: 'planId, workoutId e date são obrigatórios'
            });
        }

        // Verificar se plano existe e pertence ao cliente
        const plan = await TrainingPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plano de treino não encontrado'
            });
        }

        if (plan.client.toString() !== clientId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Este plano não pertence a você'
            });
        }

        // Verificar se já existe log para esta data
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        const existingLog = await TrainingLog.findOne({
            clientId,
            planId,
            workoutId,
            date: {
                $gte: dateObj,
                $lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingLog) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um registo para esta data'
            });
        }

        // Processar imagem de prova (se enviada)
        let proofImagePath = null;
        if (req.file) {
            proofImagePath = `/uploads/proofs/${req.file.filename}`;
        }

        // Criar log
        const log = await TrainingLog.create({
            clientId,
            trainerId: plan.trainer,
            planId,
            workoutId,
            date: dateObj,
            isCompleted: isCompleted === 'true' || isCompleted === true || isCompleted === 1,
            reason: isCompleted ? '' : reason || '',
            proofImage: proofImagePath
        });


        // ✅ Log criado com sucesso
        // Nota: Os alertas de treino aparecem no modal "Alertas de Hoje" do trainer
        // através do endpoint /trainers/today-alerts, não precisamos criar notificações aqui

        res.status(201).json({
            success: true,
            message: 'Registo criado com sucesso',
            data: log
        });

    } catch (error) {
        console.error('Erro ao criar log de treino:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar registo de treino',
            error: error.message
        });
    }
};

// ✅ BUSCAR LOGS DO CLIENTE (com filtro por mês/ano)
exports.getClientLogs = async (req, res) => {
    try {
        const clientId = req.user._id || req.user.id;
        const { year, month, startDate, endDate } = req.query;

        let filter = { clientId };

        // Filtro por mês/ano
        if (year && month) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);

            filter.date = {
                $gte: start,
                $lte: end
            };
        }
        // Ou filtro por período customizado
        else if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const logs = await TrainingLog.find(filter)
            .populate('planId', 'name')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error('Erro ao buscar logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar registos'
        });
    }
};

// ✅ BUSCAR ESTATÍSTICAS DO CLIENTE
exports.getClientStats = async (req, res) => {
    try {
        const clientId = req.user._id || req.user.id;
        const { year, month } = req.query;

        let dateFilter = {};
        if (year && month) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            dateFilter = { date: { $gte: start, $lte: end } };
        }

        const [completed, missed, total] = await Promise.all([
            TrainingLog.countDocuments({
                clientId,
                isCompleted: true,
                ...dateFilter
            }),
            TrainingLog.countDocuments({
                clientId,
                isCompleted: false,
                ...dateFilter
            }),
            TrainingLog.countDocuments({
                clientId,
                ...dateFilter
            })
        ]);

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                total,
                completed,
                missed,
                completionRate
            }
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas'
        });
    }
};