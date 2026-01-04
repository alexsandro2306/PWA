const TrainingLog = require('../models/TrainingLog');
const User = require('../models/User');
const mongoose = require('mongoose');

// Função de controlo de relação (simplificada, deveria vir do middleware)
const checkClientTrainerRelationship = async (trainerId, clientId) => {
    const client = await User.findById(clientId);
    return client && client.trainer && client.trainer.toString() === trainerId.toString();
};

// @desc    [REQUISITO: Dashboard com gráfico de treinos concluídos por semana/mês]
// Gera dados do dashboard para um cliente específico

exports.getDashboardData = async (req, res) => {
    const user = req.user;
    let targetClientId = req.params.clientId;

    // Se a rota for /me, o cliente é o alvo
    if (req.originalUrl.endsWith('/me')) {
        targetClientId = user._id;
    } else {
        // Se a rota for /:clientId, garantir que o PT tem permissão
        if (user.role === 'trainer' && !(await checkClientTrainerRelationship(user._id, targetClientId))) {
            return res.status(403).json({ success: false, message: 'Acesso negado. Não é o Personal Trainer deste cliente.' });
        }
    }

    try {
        const targetClientIdObj = new mongoose.Types.ObjectId(targetClientId);

        // 1. Estatísticas Gerais (KPIs)
        const totalCompleted = await TrainingLog.countDocuments({
            clientId: targetClientIdObj,
            isCompleted: true
        });

        const totalMissed = await TrainingLog.countDocuments({
            clientId: targetClientIdObj,
            isCompleted: false
        });

        const totalTotal = totalCompleted + totalMissed;
        const completionRate = totalTotal > 0 ? Math.round((totalCompleted / totalTotal) * 100) : 0;


        // 2. Gráfico: Treinos Concluídos por Mês (últimos 12 meses)
        const today = new Date();
        const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));

        const monthlyAggregation = await TrainingLog.aggregate([
            {
                $match: {
                    clientId: targetClientIdObj,
                    isCompleted: true, // Apenas concluídos para o gráfico de evolução
                    date: { $gte: oneYearAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Formatar para o frontend (Ex: { name: 'Jan', treinos: 12 })
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        const monthlyStats = monthlyAggregation.map(item => ({
            name: monthNames[item._id.month - 1],
            treinos: item.count,
            year: item._id.year, // opcional, útil se precisar ordenar
            monthIndex: item._id.month // opcional
        }));

        res.status(200).json({
            success: true,
            data: {
                clientId: targetClientId,
                totalWorkouts: totalCompleted,
                missedWorkouts: totalMissed,
                completionRate: `${completionRate}%`,
                statsByMonth: monthlyStats
            }
        });

    } catch (error) {
        console.error('Erro dashboard:', error);
        res.status(500).json({ success: false, message: 'Erro ao gerar dados do dashboard.', error: error.message });
    }
};