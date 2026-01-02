const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Criar pedido de associação
// @route   POST /api/requests
// @access  Private (Client)
exports.createRequest = async (req, res) => {
    try {
        console.log('\n📥 ========== CRIAR PEDIDO ==========');
        console.log('👤 Cliente:', req.user.email);
        console.log('📦 Body recebido:', req.body);

        // ✅ ACEITA AMBOS OS CAMPOS: 'trainer' OU 'trainerId'
        const trainer = req.body.trainer || req.body.trainerId;
        const { reason } = req.body;
        const clientId = req.user.id;

        console.log('🎯 Trainer ID extraído:', trainer);
        console.log('📝 Motivo:', reason);
        console.log('🆔 Cliente ID:', clientId);

        // Validação de campos obrigatórios
        if (!trainer || !reason) {
            console.log('❌ Campos obrigatórios em falta!');
            return res.status(400).json({
                success: false,
                message: 'Trainer ID e motivo são obrigatórios'
            });
        }

        // ✅ Verificar se o trainer existe E está validado
        const trainerUser = await User.findOne({
            _id: trainer,
            role: 'trainer',
            isValidated: true
        });

        console.log('🔍 Trainer encontrado:', trainerUser ? 'SIM ✅' : 'NÃO ❌');

        if (trainerUser) {
            console.log('📋 Dados do trainer:', {
                id: trainerUser._id,
                nome: `${trainerUser.firstName} ${trainerUser.lastName}`,
                email: trainerUser.email,
                validado: trainerUser.isValidated
            });
        } else {
            // Debug: verificar se o user existe mas não está validado
            const anyUser = await User.findById(trainer);
            if (anyUser) {
                console.log('⚠️ User existe mas:', {
                    role: anyUser.role,
                    validado: anyUser.isValidated
                });
            } else {
                console.log('❌ User não existe na BD!');
            }
        }

        if (!trainerUser) {
            return res.status(400).json({
                success: false,
                message: 'Trainer inválido ou não validado'
            });
        }

        // Verificar se cliente já tem trainer
        const client = await User.findById(clientId);

        console.log('👤 Cliente tem trainer?', client.trainer ? 'SIM' : 'NÃO');

        if (client.trainer) {
            console.log('⚠️ Cliente já tem trainer:', client.trainer);
            return res.status(400).json({
                success: false,
                message: 'Já possui um Personal Trainer associado. Para mudar, contacte o administrador.'
            });
        }

        // Verificar pedido duplicado
        const existingRequest = await Request.findOne({
            client: clientId,
            trainer: trainer,
            status: 'pending'
        });

        if (existingRequest) {
            console.log('⚠️ Pedido duplicado encontrado:', existingRequest._id);
            return res.status(400).json({
                success: false,
                message: 'Já existe um pedido pendente para este trainer'
            });
        }

        console.log('✅ Todas as validações passaram! A criar pedido...');

        // ✅ Criar pedido
        const request = await Request.create({
            client: clientId,
            trainer: trainer,
            reason,
            type: 'association',
            status: 'pending'
        });

        console.log('✅ Pedido criado com sucesso!');
        console.log('🆔 Request ID:', request._id);

        await request.populate([
            { path: 'client', select: 'firstName lastName email username' },
            { path: 'trainer', select: 'firstName lastName email' }
        ]);

        console.log('📋 Pedido completo:', {
            id: request._id,
            cliente: request.client.email,
            trainer: request.trainer.email,
            status: request.status,
            type: request.type
        });
        console.log('========== FIM CRIAR PEDIDO ==========\n');

        res.status(201).json({
            success: true,
            message: 'Pedido enviado com sucesso',
            data: request
        });

    } catch (error) {
        console.error('❌ ERRO AO CRIAR PEDIDO:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pedido',
            error: error.message
        });
    }
};

// @desc    Listar pedidos do cliente
// @route   GET /api/requests/my
// @access  Private (Client)
exports.getMyRequests = async (req, res) => {
    try {
        console.log('\n📋 ========== LISTAR MEUS PEDIDOS (CLIENTE) ==========');
        console.log('👤 Cliente:', req.user.email);
        console.log('🆔 Cliente ID:', req.user.id);

        const requests = await Request.find({ client: req.user.id })
            .populate('trainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        console.log('📊 Pedidos encontrados:', requests.length);
        console.log('========== FIM LISTAR MEUS PEDIDOS ==========\n');

        res.json({
            success: true,
            results: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('❌ ERRO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pedidos',
            error: error.message
        });
    }
};

// @desc    Listar pedidos pendentes (Admin/Trainer)
// @route   GET /api/requests
// @access  Private (Admin/Trainer)
exports.getAllRequests = async (req, res) => {
    try {
        console.log('\n🔍 ========== LISTAR TODOS OS PEDIDOS ==========');
        console.log('👤 User:', req.user.email);
        console.log('🎭 Role:', req.user.role);
        console.log('🆔 User ID:', req.user.id);

        const filter = { status: 'pending' };

        // 🔥 Se for trainer, ver pedidos enviados PARA ELE
        if (req.user.role === 'trainer') {
            filter.trainer = req.user.id;
            console.log('🎯 É trainer! Filtro aplicado:', JSON.stringify(filter));
        } else {
            console.log('👑 É admin! A ver todos os pedidos pendentes');
        }

        console.log('🔎 A procurar na BD com filtro:', JSON.stringify(filter));

        const requests = await Request.find(filter)
            .populate('client', 'firstName lastName email username avatar')
            .populate('trainer', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        console.log('📊 Pedidos encontrados:', requests.length);

        if (requests.length > 0) {
            console.log('\n📋 Detalhes dos pedidos:');
            requests.forEach((req, index) => {
                console.log(`\n  Pedido ${index + 1}:`);
                console.log('    ID:', req._id);
                console.log('    Cliente:', req.client?.email || 'N/A');
                console.log('    Trainer:', req.trainer?.email || 'N/A');
                console.log('    Status:', req.status);
                console.log('    Type:', req.type);
                console.log('    Motivo:', req.reason?.substring(0, 50) + '...');
            });
        } else {
            console.log('❌ Nenhum pedido encontrado!');
            console.log('🔍 Vamos verificar se existem pedidos na BD...');

            // Debug: verificar se existem pedidos sem filtro
            const allRequests = await Request.find({});
            console.log('📊 Total de pedidos na BD (sem filtro):', allRequests.length);

            if (allRequests.length > 0) {
                console.log('\n⚠️ Existem pedidos mas não correspondem ao filtro!');
                console.log('Primeiros 3 pedidos na BD:');
                allRequests.slice(0, 3).forEach(req => {
                    console.log('  -', {
                        id: req._id,
                        trainer: req.trainer,
                        status: req.status,
                        type: req.type
                    });
                });
            }
        }

        console.log('========== FIM LISTAR PEDIDOS ==========\n');

        res.json({
            success: true,
            results: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('❌ ERRO AO LISTAR PEDIDOS:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pedidos',
            error: error.message
        });
    }
};

// @desc    Aceitar pedido (Trainer)
// @route   PATCH /api/requests/:id/accept
// @access  Private (Trainer)
exports.acceptRequest = async (req, res) => {
    try {
        console.log('\n✅ ========== ACEITAR PEDIDO ==========');
        console.log('👤 Trainer:', req.user.email);
        console.log('🆔 Request ID:', req.params.id);

        const request = await Request.findById(req.params.id)
            .populate('client')
            .populate('trainer');

        if (!request) {
            console.log('❌ Pedido não encontrado!');
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        console.log('📋 Pedido encontrado:', {
            cliente: request.client.email,
            trainer: request.trainer.email,
            status: request.status
        });

        // ✅ Verificar se é o trainer correto
        if (request.trainer._id.toString() !== req.user.id) {
            console.log('❌ Trainer não autorizado!');
            console.log('   Trainer do pedido:', request.trainer._id);
            console.log('   Trainer atual:', req.user.id);
            return res.status(403).json({
                success: false,
                message: 'Não autorizado a aceitar este pedido'
            });
        }

        if (request.status !== 'pending') {
            console.log('⚠️ Pedido já foi processado! Status:', request.status);
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        console.log('✅ A associar cliente ao trainer...');

        // ✅ Associar cliente ao trainer
        await User.findByIdAndUpdate(request.client._id, {
            trainer: request.trainer._id
        });

        console.log('✅ Cliente associado ao trainer!');

        // ✅ Adicionar cliente à lista do trainer
        await User.findByIdAndUpdate(request.trainer._id, {
            $addToSet: { clients: request.client._id }
        });

        console.log('✅ Cliente adicionado à lista do trainer!');

        // ✅ Atualizar status do pedido
        request.status = 'accepted';
        await request.save();

        console.log('✅ Status do pedido atualizado para: accepted');
        console.log('========== FIM ACEITAR PEDIDO ==========\n');

        res.json({
            success: true,
            message: 'Pedido aceite com sucesso',
            data: request
        });

    } catch (error) {
        console.error('❌ ERRO AO ACEITAR PEDIDO:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pedido',
            error: error.message
        });
    }
};

// @desc    Rejeitar pedido (Trainer)
// @route   PATCH /api/requests/:id/reject
// @access  Private (Trainer)
exports.rejectRequest = async (req, res) => {
    try {
        console.log('\n❌ ========== REJEITAR PEDIDO ==========');
        console.log('👤 Trainer:', req.user.email);
        console.log('🆔 Request ID:', req.params.id);

        const request = await Request.findById(req.params.id);

        if (!request) {
            console.log('❌ Pedido não encontrado!');
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // ✅ Verificar se é o trainer correto
        if (request.trainer.toString() !== req.user.id) {
            console.log('❌ Trainer não autorizado!');
            return res.status(403).json({
                success: false,
                message: 'Não autorizado a rejeitar este pedido'
            });
        }

        if (request.status !== 'pending') {
            console.log('⚠️ Pedido já foi processado! Status:', request.status);
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        request.status = 'rejected';
        await request.save();

        console.log('✅ Pedido rejeitado com sucesso!');
        console.log('========== FIM REJEITAR PEDIDO ==========\n');

        res.json({
            success: true,
            message: 'Pedido rejeitado',
            data: request
        });

    } catch (error) {
        console.error('❌ ERRO AO REJEITAR PEDIDO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pedido',
            error: error.message
        });
    }
};

// @desc    Apagar pedido
// @route   DELETE /api/requests/:id
// @access  Private (Admin/Owner)
exports.deleteRequest = async (req, res) => {
    try {
        console.log('\n🗑️ ========== APAGAR PEDIDO ==========');
        console.log('👤 User:', req.user.email);
        console.log('🆔 Request ID:', req.params.id);

        const request = await Request.findById(req.params.id);

        if (!request) {
            console.log('❌ Pedido não encontrado!');
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Apenas admin ou o próprio cliente pode apagar
        if (req.user.role !== 'admin' && request.client.toString() !== req.user.id) {
            console.log('❌ Não autorizado!');
            return res.status(403).json({
                success: false,
                message: 'Não autorizado'
            });
        }

        await request.deleteOne();

        console.log('✅ Pedido removido com sucesso!');
        console.log('========== FIM APAGAR PEDIDO ==========\n');

        res.json({
            success: true,
            message: 'Pedido removido'
        });

    } catch (error) {
        console.error('❌ ERRO AO APAGAR PEDIDO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover pedido',
            error: error.message
        });
    }
};