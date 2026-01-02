const User = require('../models/User');
const TrainerRequest = require('../models/TrainerRequest');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const QRCode = require('qrcode');

// @desc    Obtém o perfil do utilizador logado
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('trainer', 'firstName lastName email phone')
            .populate('clients', 'firstName lastName email phone');

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
exports.updateProfile = async (req, res) => {
    const { firstName, lastName, phone, theme, email } = req.body;

    try {
        const user = req.user;

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phone) user.phone = phone;

        if (theme && ['light', 'dark'].includes(theme)) {
            user.theme = theme;
        }

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

// @desc    Change user password
// @route   PATCH /api/users/me/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Por favor forneça a password atual e a nova password'
            });
        }

        // Get user with password field
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Password atual incorreta'
            });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A nova password deve ter pelo menos 6 caracteres'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({
            success: true,
            message: 'Password alterada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao alterar password:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao alterar password',
            error: error.message
        });
    }
};

// @desc    Solicita alteração de Personal Trainer (Apenas Cliente)
exports.requestTrainerChange = async (req, res) => {
    const { newTrainerId, reason } = req.body;

    try {
        const client = req.user;

        if (client.role !== 'client') {
            return res.status(403).json({ success: false, message: 'Apenas clientes podem solicitar a troca de treinador.' });
        }

        const newTrainer = await User.findOne({ _id: newTrainerId, role: 'trainer', isValidated: true });

        if (!newTrainer) {
            return res.status(404).json({ success: false, message: 'Novo Personal Trainer inválido ou não validado.' });
        }

        const existingRequest = await TrainerRequest.findOne({ client: client._id, status: 'pending' });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Já existe um pedido de alteração de treinador pendente.' });
        }

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
exports.getMyClients = async (req, res) => {
    if (req.user.role !== 'trainer') {
        return res.status(403).json({ success: false, message: 'Apenas Personal Trainers podem aceder a esta lista.' });
    }

    try {
        const clients = await User.find({ trainer: req.user._id, role: 'client' })
            .select('-password -qrCodeSecret -clients -trainer');

        res.status(200).json({
            success: true,
            results: clients.length,
            data: clients
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter lista de clientes.', error: error.message });
    }
};

// @desc    Obtém lista pública de trainers validados (SEM AUTENTICAÇÃO)
exports.getValidatedTrainers = async (req, res) => {
    try {
        const trainers = await User.find({
            role: 'trainer',
            isValidated: true
        })
            .select('firstName lastName email avatar bio')
            .lean();

        const trainersWithCount = await Promise.all(
            trainers.map(async (trainer) => {
                const clientCount = await User.countDocuments({
                    trainer: trainer._id,
                    role: 'client'
                });
                return { ...trainer, clientCount };
            })
        );

        res.json({
            success: true,
            results: trainersWithCount.length,
            trainers: trainersWithCount
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar trainers'
        });
    }
};

// @desc    Obtém trainers validados (COM AUTENTICAÇÃO - para uso interno)
exports.getTrainers = async (req, res) => {
    try {
        const trainers = await User.find({
            role: 'trainer',
            isValidated: true
        })
            .select('firstName lastName email avatar bio phone clients')
            .populate('clients', 'firstName lastName email');

        res.json({
            success: true,
            results: trainers.length,
            data: trainers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar trainers',
            error: error.message
        });
    }
};

// @desc    Gerar QR Code
// @route   POST /api/users/me/qrcode/generate
// @access  Private
exports.generateQRCode = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado'
            });
        }

        const secret = crypto.randomBytes(32).toString('hex');
        const qrData = JSON.stringify({
            userId: user._id,
            secret: secret,
            username: user.username
        });

        const qrCodeImage = await QRCode.toDataURL(qrData);

        user.qrCodeSecret = secret;
        user.qrCodeEnabled = true;
        await user.save();

        res.json({
            success: true,
            message: 'QR Code gerado com sucesso',
            qrCode: qrCodeImage
        });

    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar QR Code',
            error: error.message
        });
    }
};

// @desc    Desativar QR Code
// @route   DELETE /api/users/me/qrcode
// @access  Private
exports.disableQRCode = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado'
            });
        }

        user.qrCodeSecret = null;
        user.qrCodeEnabled = false;
        await user.save();

        res.json({
            success: true,
            message: 'QR Code desativado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao desativar QR Code:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar QR Code',
            error: error.message
        });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/profile/:id
// @access  Private
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -qrCodeSecret')
            .populate('trainer', 'firstName lastName avatar');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Erro ao buscar utilizador:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar utilizador',
            error: error.message
        });
    }
};