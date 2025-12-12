const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest');
const TrainingPlan = require('../models/TrainingPlan'); // Necessário para a gestão de PTs

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


// @desc    [REQUISITO: validar os personal trainers]
// Valida a conta de um Personal Trainer
// Rota: PATCH /api/v1/admin/trainers/:trainerId/validate
exports.validateTrainer = async (req, res) => {
    const { trainerId } = req.params;

    try {
        const trainer = await User.findOneAndUpdate(
            { _id: trainerId, role: 'trainer', isValidated: false },
            { $set: { isValidated: true } },
            { new: true } // Retorna o documento atualizado
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
// Rota: GET /api/v1/admin/requests/pending
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await TrainerRequest.find({ status: 'pending' })
            .populate('client', 'firstName lastName email')
            .populate('currentTrainer', 'firstName lastName')
            .populate('newTrainer', 'firstName lastName');

        res.status(200).json({
            success: true,
            results: requests.length,
            data: requests
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar pedidos pendentes.', error: error.message });
    }
};


// @desc    [REQUISITO: aceitar pedidos de alteração de treinador]
// Aprova ou rejeita um pedido de alteração de treinador
// Rota: PATCH /api/v1/admin/requests/:requestId
exports.handleTrainerChangeRequest = async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body; // Deve ser 'approve' ou 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Ação inválida. Use "approve" ou "reject".' });
    }

    try {
        const request = await TrainerRequest.findById(requestId);

        if (!request || request.status !== 'pending') {
            return res.status(404).json({ success: false, message: 'Pedido não encontrado ou já processado.' });
        }

        if (action === 'approve') {
            const client = await User.findById(request.client);

            if (!client) {
                // Caso o cliente tenha sido apagado entretanto
                return res.status(404).json({ success: false, message: 'Cliente associado ao pedido não encontrado.' });
            }

            // 1. [CRÍTICO] Atualiza o campo 'trainer' do Cliente
            // Remove o cliente da lista do trainer antigo
            if (client.trainer) {
                await User.findByIdAndUpdate(client.trainer, { $pull: { clients: client._id } });
            }

            // Atribui o novo trainer
            client.trainer = request.newTrainer;
            await client.save({ validateBeforeSave: false });

            // Adiciona o cliente à lista do novo trainer
            await User.findByIdAndUpdate(request.newTrainer, { $addToSet: { clients: client._id } });

            // 2. Atualiza o status do pedido
            request.status = 'approved';

        } else if (action === 'reject') {
            request.status = 'rejected';
        }

        request.adminHandledBy = req.user._id; // ID do Admin logado
        request.handledAt = Date.now();
        await request.save();

        res.status(200).json({
            success: true,
            message: `Pedido ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.`,
            data: request
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao processar o pedido de alteração.', error: error.message });
    }
};


// @desc    [REQUISITO: Adicionar/remover personal trainers (remover)]
// Remove um Personal Trainer
// Rota: DELETE /api/v1/admin/trainers/:trainerId
exports.deleteTrainer = async (req, res) => {
    const { trainerId } = req.params;

    try {
        const trainer = await User.findOneAndDelete({ _id: trainerId, role: 'trainer' });

        if (!trainer) {
            return res.status(404).json({ success: false, message: 'Personal Trainer não encontrado.' });
        }

        // LÓGICA DE LIMPEZA CRÍTICA:
        // 1. Remover a referência do trainer de todos os seus clientes
        await User.updateMany({ trainer: trainerId }, { $set: { trainer: null } });

        // 2. Desativar todos os planos de treino criados por este trainer
        await TrainingPlan.updateMany({ trainer: trainerId, isActive: true }, { $set: { isActive: false } });

        // 3. Remover pedidos de alteração pendentes envolvendo este trainer
        await TrainerRequest.deleteMany({ $or: [{ currentTrainer: trainerId }, { newTrainer: trainerId }] });

        res.status(204).json({ success: true, data: null }); // 204 No Content para deleção bem sucedida

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao apagar Personal Trainer.', error: error.message });
    }
};