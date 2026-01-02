const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest');
const TrainingPlan = require('../models/TrainingPlan');

// @desc    Obtém todos os utilizadores (Admin apenas)
// Rota: GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        // Query parameters para paginação
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const skip = (page - 1) * limit;

        // Filtros
        const filters = {};

        // Filtro por role
        if (role) {
            filters.role = role;
        }

        // Filtro de pesquisa
        if (search) {
            filters.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        // Buscar usuários com paginação
        const users = await User.find(filters)
            .select('-password -qrCodeSecret')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Contar total
        const totalItems = await User.countDocuments(filters);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            results: users.length,
            data: users,
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
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar utilizadores.',
            error: error.message
        });
    }
};

// @desc    Apagar utilizador (Admin apenas)
// Rota: DELETE /api/admin/users/:userId
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        // LÓGICA DE LIMPEZA baseada no role
        if (user.role === 'trainer') {
            // Remover referência de todos os clientes
            await User.updateMany(
                { trainer: userId },
                { $set: { trainer: null } }
            );

            // Desativar planos de treino
            await TrainingPlan.updateMany(
                { trainer: userId, isActive: true },
                { $set: { isActive: false } }
            );

            // Remover pedidos pendentes
            await TrainerRequest.deleteMany({
                $or: [{ currentTrainer: userId }, { newTrainer: userId }]
            });
        } else if (user.role === 'client') {
            // Desativar planos do cliente
            await TrainingPlan.updateMany(
                { client: userId, isActive: true },
                { $set: { isActive: false } }
            );
        }

        // Apagar o utilizador
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'Utilizador removido com sucesso.'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao apagar utilizador.',
            error: error.message
        });
    }
};

// @desc    Obtém estatísticas do dashboard admin
// Rota: GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeTrainers = await User.countDocuments({ role: 'trainer', isValidated: true });
        const pendingTrainers = await User.countDocuments({ role: 'trainer', isValidated: false });
        // ✅ CORRIGIDO: Só conta pedidos de MUDANÇA (cliente já tem trainer)
        const pendingRequests = await TrainerRequest.countDocuments({
            status: 'pending',
            currentTrainer: { $exists: true, $ne: null }
        });
        const totalClients = await User.countDocuments({ role: 'client' });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                activeTrainers,
                pendingTrainers,
                pendingRequests,
                totalClients
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas.',
            error: error.message
        });
    }
};

// @desc    Obtém todos os Personal Trainers pendentes de validação
exports.getPendingTrainers = async (req, res) => {
    try {
        const trainers = await User.find({ role: 'trainer', isValidated: false });

        res.status(200).json({
            success: true,
            results: trainers.length,
            data: trainers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar Personal Trainers pendentes.', error: error.message });
    }
};

// @desc    Valida a conta de um Personal Trainer
// Rota: PATCH /api/admin/trainers/:trainerId/validate
exports.validateTrainer = async (req, res) => {
    const { trainerId } = req.params;

    try {
        const trainer = await User.findOneAndUpdate(
            { _id: trainerId, role: 'trainer', isValidated: false },
            { $set: { isValidated: true } },
            { new: true }
        );

        if (!trainer) {
            return res.status(404).json({ success: false, message: 'Personal Trainer não encontrado ou já validado.' });
        }

        res.status(200).json({
            success: true,
            message: `Personal Trainer ${trainer.firstName} validado com sucesso.`,
            data: trainer
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao validar Personal Trainer.', error: error.message });
    }
};

// @desc    Obtém todos os pedidos pendentes de alteração de treinador
// Rota: GET /api/admin/requests/pending
exports.getPendingRequests = async (req, res) => {
    try {
        // Query parameters para paginação
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // ✅ CORRIGIDO: Só mostra pedidos de MUDANÇA (cliente já tem trainer)
        const requests = await TrainerRequest.find({
            status: 'pending',
            currentTrainer: { $exists: true, $ne: null } // ← Cliente já tem trainer
        })
            .populate('client', 'firstName lastName email')
            .populate('currentTrainer', 'firstName lastName')
            .populate('newTrainer', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Contar total
        const totalItems = await TrainerRequest.countDocuments({
            status: 'pending',
            currentTrainer: { $exists: true, $ne: null }
        });
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            results: requests.length,
            data: requests,
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
        res.status(500).json({ success: false, message: 'Erro ao buscar pedidos pendentes.', error: error.message });
    }
};

// @desc    Aprova ou rejeita um pedido de alteração de treinador
// @route   PATCH /api/admin/requests/:requestId
exports.handleTrainerChangeRequest = async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Ação inválida. Use "approve" ou "reject".' });
    }

    try {
        const request = await TrainerRequest.findById(requestId)
            .populate('client', 'firstName lastName')
            .populate('newTrainer', 'firstName lastName');

        if (!request || request.status !== 'pending') {
            return res.status(404).json({ success: false, message: 'Pedido não encontrado ou já processado.' });
        }

        if (action === 'approve') {
            const client = await User.findById(request.client._id || request.client);

            if (!client) {
                return res.status(404).json({ success: false, message: 'Cliente associado ao pedido não encontrado.' });
            }

            // Atualiza o campo 'trainer' do Cliente
            if (client.trainer) {
                await User.findByIdAndUpdate(client.trainer, { $pull: { clients: client._id } });
            }

            client.trainer = request.newTrainer._id || request.newTrainer;
            await client.save({ validateBeforeSave: false });

            await User.findByIdAndUpdate(request.newTrainer._id || request.newTrainer, { $addToSet: { clients: client._id } });

            request.status = 'approved';

            // ✅ CRIAR NOTIFICAÇÃO DE APROVAÇÃO
            const Notification = require('../models/Notification');
            const trainerName = request.newTrainer.firstName + ' ' + request.newTrainer.lastName;
            await Notification.createNotification({
                recipient: client._id,
                sender: req.user._id,
                type: 'request',
                title: '✅ Pedido de Mudança Aprovado',
                message: `O seu pedido para mudar para o trainer ${trainerName} foi aprovado!`,
                link: '/profile'
            });

        } else if (action === 'reject') {
            request.status = 'rejected';

            // ✅ CRIAR NOTIFICAÇÃO DE REJEIÇÃO
            const Notification = require('../models/Notification');
            const clientName = request.client.firstName || 'Cliente';
            await Notification.createNotification({
                recipient: request.client._id || request.client,
                sender: req.user._id,
                type: 'request',
                title: '❌ Pedido de Mudança Rejeitado',
                message: 'O seu pedido de mudança de trainer foi rejeitado pelo administrador.',
                link: '/profile'
            });
        }

        request.adminHandledBy = req.user._id;
        request.handledAt = Date.now();
        await request.save();

        res.status(200).json({
            success: true,
            message: `Pedido ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.`,
            data: request
        });

    } catch (error) {
        console.error('Erro ao processar pedido:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar o pedido de alteração.', error: error.message });
    }
};

// @desc    Remove um Personal Trainer
// Rota: DELETE /api/admin/trainers/:trainerId
exports.deleteTrainer = async (req, res) => {
    const { trainerId } = req.params;

    try {
        const trainer = await User.findOneAndDelete({ _id: trainerId, role: 'trainer' });

        if (!trainer) {
            return res.status(404).json({ success: false, message: 'Personal Trainer não encontrado.' });
        }

        // LÓGICA DE LIMPEZA
        await User.updateMany({ trainer: trainerId }, { $set: { trainer: null } });
        await TrainingPlan.updateMany({ trainer: trainerId, isActive: true }, { $set: { isActive: false } });
        await TrainerRequest.deleteMany({ $or: [{ currentTrainer: trainerId }, { newTrainer: trainerId }] });

        res.status(200).json({ success: true, message: 'Trainer removido com sucesso.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao apagar Personal Trainer.', error: error.message });
    }
};