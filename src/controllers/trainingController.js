const Workout = require('../models/Workout');
const User = require('../models/User');     

// Função auxiliar para verificar se o utilizador logado é o trainer do cliente

const isClientOfTrainer = async (trainerId, clientId) => {
    const client = await User.findById(clientId);
    return client && client.trainer && client.trainer.toString() === trainerId.toString();
};

// @desc    Cria um novo plano de treino personalizado

exports.createTrainingPlan = async (req, res) => {
    try {
        const trainerId = req.user._id; // ID do Personal Trainer logado
        const { client, name, frequency, startDate, endDate, weeklyPlan } = req.body;

        // 1. Verificar se o cliente tem um Personal Trainer associado
        const targetClient = await User.findById(client);

        if (!targetClient) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
        }
        
        // Regra de Negócio: Cliente deve ter um Personal Trainer ou estar a ser atribuído
        if (!targetClient.trainer) {
            // Atribuição inicial: Se o cliente não tem trainer, atribuímos o trainer atual
            targetClient.trainer = trainerId;
            await targetClient.save({ validateBeforeSave: false });
        } else if (targetClient.trainer.toString() !== trainerId.toString()) {
             // O cliente pertence a outro trainer
            return res.status(403).json({ success: false, message: 'Não é o Personal Trainer deste cliente. Não pode criar planos.' });
        }
        
        // 2. Desativar qualquer plano ativo anterior
        await Workout.updateMany(
            { client: client, isActive: true }, 
            { $set: { isActive: false } }
        );

        // 3. Criar o novo plano de treino
        const newPlan = await Workout.create({
            client,
            trainer: trainerId,
            name,
            frequency,
            startDate,
            endDate,
            weeklyPlan,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Plano de treino criado e ativado com sucesso.',
            data: newPlan
        });

    } catch (error) {
        // Erro de validação Mongoose (ex: limite de 10 exercícios, enum frequency)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Erro ao criar plano de treino.', error: error.message });
    }
};

// @desc    Obtém planos de treino (com filtros para PT ou apenas o seu para Cliente)

exports.getTrainingPlans = async (req, res) => {
    const user = req.user; // Utilizador logado
    const { clientId, dayOfWeek } = req.query; // Filtros

    let query = {};

    // 1. Definir a query baseada no ROLE do utilizador
    if (user.role === 'client') {
        // O cliente só vê os seus próprios planos ativos
        query = { client: user._id, isActive: true };
    } else if (user.role === 'trainer') {
        // O PT vê os planos dos seus clientes
        query = { trainer: user._id };
        
        // Aplicar filtro por Cliente (se fornecido)
        if (clientId) {
            // Controlo adicional de segurança: só pode filtrar pelos seus clientes
            if (!(await isClientOfTrainer(user._id, clientId))) {
                return res.status(403).json({ success: false, message: 'Acesso negado. O cliente não está na sua lista.' });
            }
            query.client = clientId;
        }
    } else if (user.role === 'admin') {
        // Admin vê todos os planos (pode adicionar mais filtros aqui)
        query = {};
    }

    // 2. Aplicar filtro por Dia da Semana (se fornecido)
    if (dayOfWeek) {
        // Filtra os planos que contêm sessões para o dia da semana especificado
        query['weeklyPlan.dayOfWeek'] = dayOfWeek;
    }

    try {
        const plans = await Workout.find(query)
            .populate('client', 'firstName lastName')
            .populate('trainer', 'firstName lastName')
            .sort('-createdAt'); // Ordenar do mais recente para o mais antigo

        res.status(200).json({
            success: true,
            results: plans.length,
            data: plans
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter planos de treino.', error: error.message });
    }
};

// @desc    Obtém o plano semanal de um cliente (vista calendário)
exports.getActiveWeeklyPlan = async (req, res) => {
    try {
        const plan = await Workout.findOne({ client: req.user._id, isActive: true })
            .populate('trainer', 'firstName lastName');

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Nenhum plano de treino ativo encontrado.' });
        }

        // Simplifica a resposta para o formato de "calendário" se necessário
        res.status(200).json({
            success: true,
            data: {
                name: plan.name,
                startDate: plan.startDate,
                endDate: plan.endDate,
                frequency: plan.frequency,
                weeklyPlan: plan.weeklyPlan
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter plano ativo.', error: error.message });
    }
};