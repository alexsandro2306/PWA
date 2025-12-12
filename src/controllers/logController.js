const TrainingLog = require('../models/TrainingLog');
const Workout = require('../models/Workout');
const User = require('../models/User');

// @desc    [REQUISITO: O cliente deve registar por dia se cumpriu ou não o treino definido]
// Cliente regista o cumprimento de um treino para uma data específica
// Rota: POST /api/v1/logs
exports.createTrainingLog = async (req, res) => {
    const clientId = req.user._id;
    // Removi a necessidade de enviar a data em formato específico, assumindo que é ISO string
    const { date, isCompleted, reasonNotCompleted, proofImageURL } = req.body; 

    // 1. Encontrar o plano ativo do cliente
    const activePlan = await Workout.findOne({ client: clientId, isActive: true });

    if (!activePlan) {
        return res.status(400).json({ success: false, message: 'Nenhum plano de treino ativo para registar.' });
    }

    const logDate = new Date(date);
    const dayOfWeek = logDate.getDay(); 
    
    // Verificação de segurança: garantir que o cliente está a registar para um dia com treino agendado
    const hasScheduledSession = activePlan.weeklyPlan.some(session => session.dayOfWeek === dayOfWeek);

    // NOTA: Esta verificação é opcional, mas ajuda a manter a integridade dos dados
    if (!hasScheduledSession) {
        // return res.status(400).json({ success: false, message: 'Não há treino agendado para esta data no seu plano ativo.' });
    }


    try {
        // Criar ou atualizar o log
        const log = await TrainingLog.create({
            client: clientId,
            trainer: activePlan.trainer,
            date: logDate,
            isCompleted,
            reasonNotCompleted: isCompleted ? null : reasonNotCompleted,
            proofImageURL: isCompleted ? proofImageURL : null,
            workoutPlan: activePlan._id,
            dayOfWeek: dayOfWeek
        });

        res.status(201).json({
            success: true,
            message: 'Registo de treino criado com sucesso.',
            data: log
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Já existe um registo de treino para esta data. Use PATCH para atualizar.' });
        }
        res.status(500).json({ success: false, message: 'Erro ao registar treino.', error: error.message });
    }
};

// @desc    Obtém logs de treino de um cliente específico (útil para o PT)
exports.getClientLogs = async (req, res) => {
    const { clientId } = req.params;
    const { from, to } = req.query; 

    // Assumimos que o middleware já verificou a relação Trainer/Client
    
    let query = { client: clientId };
    if (from && to) {
        query.date = { $gte: new Date(from), $lte: new Date(to) };
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
        res.status(500).json({ success: false, message: 'Erro ao obter logs de treino.', error: error.message });
    }
};