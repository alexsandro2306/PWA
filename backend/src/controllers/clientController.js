const TrainingPlan = require('../models/TrainingPlan'); 
const TrainingLog = require('../models/TrainingLog');
const User = require('../models/User'); 

// @desc    Obtém o plano de treino semanal ATIVO do cliente
// [REQUISITO: O cliente deve poder consultar o seu plano numa vista do estilo calendário]
exports.getActiveWorkoutPlan = async (req, res) => {
    const clientId = req.user._id;

    try {
        const plan = await TrainingPlan.findOne({ client: clientId, isActive: true }) 
            .populate('trainer', 'firstName lastName email phone'); 

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Nenhum plano de treino ativo encontrado para este cliente.' });
        }

        const clientView = {
            planId: plan._id,
            name: plan.name,
            frequency: plan.frequency,
            startDate: plan.startDate,
            endDate: plan.endDate,
            trainer: plan.trainer,
            weeklyPlan: plan.weeklyPlan
        };

        res.status(200).json({
            success: true,
            data: clientView
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter plano de treino ativo.', error: error.message });
    }
};

// @desc    Obtém o histórico de registos de treino do cliente (Logs de cumprimento)
// Rota: GET /api/v1/client/logs
exports.getTrainingLogsHistory = async (req, res) => {
    const clientId = req.user._id;
    const { startDate, endDate } = req.query; 

    let query = { client: clientId };
    
    if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    try {
        const logs = await TrainingLog.find(query)
            .sort({ date: -1 }) 
            .populate('workoutPlan', 'name'); 

        res.status(200).json({
            success: true,
            results: logs.length,
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter histórico de logs.', error: error.message });
    }
};


// @desc    Obtém detalhes de um exercício específico do plano ativo (instruções, vídeo)
// Rota: GET /api/v1/client/workout/exercise/:sessionId/:exerciseId
exports.getExerciseDetails = async (req, res) => {
    const clientId = req.user._id;
    const { sessionId, exerciseId } = req.params; 

    try {
        const activePlan = await TrainingPlan.findOne({ client: clientId, isActive: true }); 

        if (!activePlan) {
            return res.status(404).json({ success: false, message: 'Nenhum plano ativo encontrado.' });
        }

        // Assumimos que weeklyPlan é um array de dayWorkoutSchema
        const session = activePlan.weeklyPlan.find(s => s._id.toString() === sessionId);
        
        if (!session) {
            return res.status(404).json({ success: false, message: 'Sessão de treino não encontrada no plano ativo.' });
        }
        
        // Assumimos que exercises é um array de exerciseSchema
        const exerciseDetail = session.exercises.find(e => e._id.toString() === exerciseId);

        if (!exerciseDetail) {
            return res.status(404).json({ success: false, message: 'Detalhe do exercício não encontrado na sessão.' });
        }

        res.status(200).json({
            success: true,
            data: exerciseDetail
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter detalhes do exercício.', error: error.message });
    }
};