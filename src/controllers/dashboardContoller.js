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
        // Pipeline de Agregação para Treinos Concluídos por Mês (últimos 12 meses)
        const today = new Date();
        const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));

        // 

        const monthlyStats = await TrainingLog.aggregate([
            {
                $match: {
                    client: new mongoose.Types.ObjectId(targetClientId),
                    isCompleted: true,
                    date: { $gte: oneYearAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    totalCompleted: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        // (Lógica para Estatísticas Semanais similarmente implementada aqui)

        res.status(200).json({
            success: true,
            data: {
                clientId: targetClientId,
                statsByMonth: monthlyStats,
                // statsByWeek: weeklyStats
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar dados do dashboard.', error: error.message });
    }
};