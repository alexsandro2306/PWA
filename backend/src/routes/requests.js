const express = require('express');
const router = express.Router();
const TrainerRequest = require('../models/TrainerRequest');
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ✅ LOGS DE DEBUG
router.use((req, res, next) => {
    console.log('\n🛣️ ========== REQUEST ROUTES ==========');
    console.log('📍 Método:', req.method);
    console.log('📍 URL:', req.originalUrl);
    console.log('📍 Body:', req.body);
    console.log('========================================\n');
    next();
});

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Cliente envia pedido para ser treinado
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, authorize('client'), async (req, res) => {
    try {
        console.log('\n📥 ========== CRIAR PEDIDO ==========');
        console.log('👤 Cliente:', req.user.email);
        console.log('🆔 Cliente ID:', req.user._id);

        const trainerId = req.body.trainer || req.body.trainerId;
        const { reason } = req.body;

        console.log('🎯 Trainer ID recebido:', trainerId);
        console.log('📝 Motivo:', reason);

        // Verificar se o trainer existe e está validado
        const trainer = await User.findById(trainerId);

        console.log('🔍 Trainer encontrado:', trainer ? 'SIM ✅' : 'NÃO ❌');

        if (trainer) {
            console.log('📋 Trainer:', {
                id: trainer._id,
                nome: `${trainer.name} ${trainer.surname}`,
                role: trainer.role,
                validado: trainer.isValidated
            });
        }

        if (!trainer || trainer.role !== 'trainer' || !trainer.isValidated) {
            console.log('❌ Trainer inválido ou não validado!');
            return res.status(400).json({
                success: false,
                message: 'Trainer inválido ou não validado'
            });
        }

        // Verificar se já tem um pedido pendente para este trainer
        const existingRequest = await TrainerRequest.findOne({
            client: req.user._id,
            newTrainer: trainerId,
            status: 'pending'
        });

        if (existingRequest) {
            console.log('⚠️ Pedido duplicado!');
            return res.status(400).json({
                success: false,
                message: 'Já tens um pedido pendente para este trainer'
            });
        }

        console.log('✅ Validações OK! A criar pedido...');

        // Criar pedido
        const request = await TrainerRequest.create({
            client: req.user._id,
            currentTrainer: req.user.trainerId || null,
            newTrainer: trainerId,
            reason: reason || 'Quero ser treinado por este trainer',
            status: 'pending'
        });

        console.log('✅ Pedido criado!');
        console.log('🆔 Request ID:', request._id);

        const populatedRequest = await TrainerRequest.findById(request._id)
            .populate('client', 'name surname email username')
            .populate('newTrainer', 'name surname email');

        console.log('========== FIM CRIAR PEDIDO ==========\n');

        res.status(201).json({
            success: true,
            message: 'Pedido enviado com sucesso',
            data: populatedRequest
        });
    } catch (error) {
        console.error('❌ ERRO AO CRIAR PEDIDO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar pedido',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/requests/trainer:
 *   get:
 *     summary: Trainer vê pedidos dirigidos a ele
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trainer', protect, authorize('trainer'), async (req, res) => {
    try {
        console.log('\n🔍 ========== LISTAR PEDIDOS (TRAINER) ==========');
        console.log('👤 Trainer:', req.user.email);
        console.log('🆔 Trainer ID:', req.user._id);

        const requests = await TrainerRequest.find({
            newTrainer: req.user._id,
            status: 'pending'
        })
            .populate('client', 'name surname email username phone')
            .populate('currentTrainer', 'name surname')
            .sort({ createdAt: -1 });

        console.log('📊 Pedidos encontrados:', requests.length);

        if (requests.length > 0) {
            console.log('\n📋 Detalhes dos pedidos:');
            requests.forEach((req, index) => {
                console.log(`\n  Pedido ${index + 1}:`);
                console.log('    ID:', req._id);
                console.log('    Cliente:', req.client?.email || 'N/A');
                console.log('    Status:', req.status);
            });
        } else {
            console.log('❌ Nenhum pedido pendente!');

            // Debug: ver todos os pedidos
            const allRequests = await TrainerRequest.find({});
            console.log('📊 Total na BD:', allRequests.length);

            if (allRequests.length > 0) {
                console.log('⚠️ Existem pedidos mas não para este trainer!');
                console.log('Primeiro pedido na BD:');
                console.log('  newTrainer:', allRequests[0].newTrainer);
                console.log('  Trainer atual:', req.user._id);
                console.log('  São iguais?', allRequests[0].newTrainer.toString() === req.user._id.toString());
            }
        }

        console.log('========== FIM LISTAR PEDIDOS ==========\n');

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('❌ ERRO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos'
        });
    }
});

/**
 * @swagger
 * /api/requests/{id}/accept:
 *   patch:
 *     summary: Trainer aceita pedido de cliente
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/accept', protect, authorize('trainer'), async (req, res) => {
    try {
        console.log('\n✅ ========== ACEITAR PEDIDO ==========');
        console.log('👤 Trainer:', req.user.email);
        console.log('🆔 Request ID:', req.params.id);

        const request = await TrainerRequest.findById(req.params.id);

        if (!request) {
            console.log('❌ Pedido não encontrado!');
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        console.log('📋 Pedido encontrado!');

        // Verificar se o pedido é para este trainer
        if (request.newTrainer.toString() !== req.user._id.toString()) {
            console.log('❌ Pedido não é para este trainer!');
            return res.status(403).json({
                success: false,
                message: 'Este pedido não é para ti'
            });
        }

        if (request.status !== 'pending') {
            console.log('⚠️ Pedido já processado!');
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        console.log('✅ A aceitar pedido...');

        // Aceitar pedido
        request.status = 'approved';
        request.handledAt = new Date();
        await request.save();

        console.log('✅ A associar cliente ao trainer...');

        // Atualizar cliente com o novo trainer
        await User.findByIdAndUpdate(request.client, {
            trainer: req.user._id
        });

        console.log('✅ Cliente associado!');

        const populatedRequest = await TrainerRequest.findById(request._id)
            .populate('client', 'name surname email username')
            .populate('newTrainer', 'name surname');

        console.log('========== FIM ACEITAR PEDIDO ==========\n');

        res.json({
            success: true,
            message: 'Pedido aceite! Cliente adicionado à tua lista',
            data: populatedRequest
        });
    } catch (error) {
        console.error('❌ ERRO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao aceitar pedido'
        });
    }
});

/**
 * @swagger
 * /api/requests/{id}/reject:
 *   delete:
 *     summary: Trainer rejeita pedido de cliente
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/reject', protect, authorize('trainer'), async (req, res) => {
    try {
        console.log('\n❌ ========== REJEITAR PEDIDO ==========');
        console.log('👤 Trainer:', req.user.email);
        console.log('🆔 Request ID:', req.params.id);

        const request = await TrainerRequest.findById(req.params.id);

        if (!request) {
            console.log('❌ Pedido não encontrado!');
            return res.status(404).json({
                success: false,
                message: 'Pedido não encontrado'
            });
        }

        // Verificar se o pedido é para este trainer
        if (request.newTrainer.toString() !== req.user._id.toString()) {
            console.log('❌ Pedido não é para este trainer!');
            return res.status(403).json({
                success: false,
                message: 'Este pedido não é para ti'
            });
        }

        if (request.status !== 'pending') {
            console.log('⚠️ Pedido já processado!');
            return res.status(400).json({
                success: false,
                message: 'Este pedido já foi processado'
            });
        }

        console.log('✅ A rejeitar pedido...');

        // Rejeitar
        request.status = 'rejected';
        request.handledAt = new Date();
        await request.save();

        console.log('✅ Pedido rejeitado!');
        console.log('========== FIM REJEITAR PEDIDO ==========\n');

        res.json({
            success: true,
            message: 'Pedido rejeitado'
        });
    } catch (error) {
        console.error('❌ ERRO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar pedido'
        });
    }
});

/**
 * @swagger
 * /api/requests/client:
 *   get:
 *     summary: Cliente vê seus próprios pedidos
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/client', protect, authorize('client'), async (req, res) => {
    try {
        console.log('\n📋 ========== LISTAR PEDIDOS (CLIENTE) ==========');
        console.log('👤 Cliente:', req.user.email);

        const requests = await TrainerRequest.find({
            client: req.user._id
        })
            .populate('newTrainer', 'name surname email')
            .populate('currentTrainer', 'name surname')
            .sort({ createdAt: -1 });

        console.log('📊 Pedidos encontrados:', requests.length);
        console.log('========== FIM LISTAR PEDIDOS ==========\n');

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('❌ ERRO:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pedidos'
        });
    }
});

module.exports = router;