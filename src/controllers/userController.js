const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest'); // Para listar pedidos

// @desc    Obtém o perfil do utilizador logado
// [REQUISITO: Perfis de utilizador com informações pessoais e histórico dos treinos]
// Rota: GET /api/v1/users/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('trainer', 'firstName lastName email phone') // Dados do Personal Trainer
            .populate('clients', 'firstName lastName email phone'); // Lista de clientes (se for PT/Admin)

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter utilizador.', error: error.message });
    }
};

// @desc    Atualiza o perfil do utilizador logado
// Rota: PATCH /api/v1/users/me
exports.updateProfile = async (req, res) => {
    // Campos permitidos para atualização pelo próprio utilizador
    const { firstName, lastName, phone, theme, email } = req.body; 

    try {
        const user = req.user; 
        
        // Atualizar campos básicos
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;

        // [REQUISITO: Suporte a tema escuro e tema claro]
        if (theme && ['light', 'dark'].includes(theme)) {
            user.theme = theme;
        }

        // NOTA: A alteração de email e password deve ser tratada com rotas separadas e validação rigorosa
        // if (email) user.email = email; // (Requer lógica de confirmação de email)

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phone: updatedUser.phone,
                theme: updatedUser.theme
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar perfil', error: error.message });
    }
};


// @desc    Solicita alteração de Personal Trainer (Apenas Cliente)
// [REQUISITO: A alteração de personal trainer já atribuído carece de um pedido autorizado pelo administrador.]
// Rota: POST /api/v1/users/request-trainer-change
exports.requestTrainerChange = async (req, res) => {
    const { newTrainerId, reason } = req.body;
    
    try {
        const client = req.user; 

        if (client.role !== 'client') {
            return res.status(403).json({ success: false, message: 'Apenas clientes podem solicitar a troca de treinador.' });
        }

        // 1. Verificar se o novo treinador existe e é válido
        const newTrainer = await User.findOne({ _id: newTrainerId, role: 'trainer', isValidated: true });
        
        if (!newTrainer) {
            return res.status(404).json({ success: false, message: 'Novo Personal Trainer inválido ou não validado.' });
        }
        
        // 2. Verificar se já existe um pedido pendente
        const existingRequest = await TrainerRequest.findOne({ client: client._id, status: 'pending' });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Já existe um pedido de alteração de treinador pendente.' });
        }
        
        // 3. Criar o pedido de alteração
        const request = await TrainerRequest.create({
            client: client._id,
            currentTrainer: client.trainer,
            newTrainer: newTrainerId,
            reason: reason,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Pedido de alteração de treinador enviado para aprovação do administrador.',
            data: request
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao solicitar alteração de treinador', error: error.message });
    }
};

// @desc    Obtém a lista de clientes do Personal Trainer
// Rota: GET /api/v1/users/my-clients
exports.getMyClients = async (req, res) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ success: false, message: 'Apenas Personal Trainers podem aceder a esta lista.' });
    }

    try {
        // Encontra todos os utilizadores onde o campo 'trainer' é o ID do utilizador logado
        const clients = await User.find({ trainer: req.user._id, role: 'client' })
            .select('-password -qrCodeSecret -clients -trainer'); // Excluir campos sensíveis/desnecessários

        res.status(200).json({
            success: true,
            results: clients.length,
            data: clients
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter lista de clientes.', error: error.message });
    }
};