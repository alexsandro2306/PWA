const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ✅ NOVA função: Permite comunicação mais liberal
const checkRelationship = async (senderId, receiverId) => {
    // 1. Verificar se ambos os utilizadores existem
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) return false;

    // 2. NOVA REGRA: Permite comunicação entre:
    //    - Cliente e Trainer (mesmo sem associação aceite)
    //    - Admin com qualquer um
    //    - Trainer com Cliente (mesmo que não seja o seu cliente)

    const isAdmin = sender.role === 'admin' || receiver.role === 'admin';
    const isTrainerAndClient =
        (sender.role === 'trainer' && receiver.role === 'client') ||
        (sender.role === 'client' && receiver.role === 'trainer');

    // Permite se for Admin OU se for Trainer<->Cliente
    return isAdmin || isTrainerAndClient;
};


// @desc    Enviar mensagem
// Rota: POST /api/messages/send
exports.sendMessage = async (req, res) => {
    const senderId = req.user._id;
    const { receiverId, content, attachmentUrl, attachmentType } = req.body;

    try {
        // ✅ Validar: Precisa ter conteúdo OU anexo
        if ((!content || content.trim() === '') && !attachmentUrl) {
            return res.status(400).json({
                success: false,
                message: 'Mensagem precisa ter conteúdo ou anexo.'
            });
        }

        // Verificar relacionamento
        if (!(await checkRelationship(senderId, receiverId))) {
            return res.status(403).json({
                success: false,
                message: 'Não autorizado a enviar mensagens a este utilizador.'
            });
        }

        // Criar mensagem
        const messageData = {
            sender: senderId,
            receiver: receiverId,
            type: 'message',
            read: false
        };

        // Adicionar conteúdo se existir
        if (content && content.trim()) {
            messageData.content = content.trim();
        }

        // Adicionar anexo se existir
        if (attachmentUrl) {
            messageData.attachmentUrl = attachmentUrl;
            messageData.attachmentType = attachmentType || 'image';
        }

        const message = await Message.create(messageData);

        // Popular dados do sender
        await message.populate('sender', 'firstName lastName avatar role email');
        await message.populate('receiver', 'firstName lastName avatar role email');

        // Socket.IO notification (se disponível)
        const io = req.app.get('io');
        if (io) {
            io.to(receiverId.toString()).emit('new_message', {
                message,
                senderId: senderId.toString()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Mensagem enviada com sucesso.',
            data: message
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem.',
            error: error.message
        });
    }
};


// @desc    Obter conversação entre dois utilizadores
// Rota: GET /api/messages/:interlocutorId
exports.getConversation = async (req, res) => {
    const userId = req.user._id;
    const interlocutorId = req.params.interlocutorId;

    try {
        // Verificar relacionamento
        if (!(await checkRelationship(userId, interlocutorId))) {
            return res.status(403).json({
                success: false,
                message: 'Não autorizado a ver esta conversação.'
            });
        }

        // Buscar mensagens
        const conversation = await Message.find({
            $or: [
                { sender: userId, receiver: interlocutorId },
                { sender: interlocutorId, receiver: userId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'firstName lastName avatar role email')
            .populate('receiver', 'firstName lastName avatar role email');

        // Marcar mensagens recebidas como lidas
        await Message.updateMany(
            {
                sender: interlocutorId,
                receiver: userId,
                read: false
            },
            { $set: { read: true } }
        );

        res.status(200).json({
            success: true,
            results: conversation.length,
            data: conversation
        });

    } catch (error) {
        console.error('Erro ao obter conversação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter conversação.',
            error: error.message
        });
    }
};


// @desc    Obter todas as conversações do utilizador
// Rota: GET /api/messages/conversations
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Buscar todas as mensagens onde o user é sender ou receiver
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
            .populate('sender', 'firstName lastName avatar role email')
            .populate('receiver', 'firstName lastName avatar role email')
            .sort({ createdAt: -1 });

        // Agrupar por conversação (interlocutor único)
        const conversationsMap = new Map();

        messages.forEach(msg => {
            const interlocutorId = msg.sender._id.equals(userId)
                ? msg.receiver._id.toString()
                : msg.sender._id.toString();

            if (!conversationsMap.has(interlocutorId)) {
                const interlocutor = msg.sender._id.equals(userId)
                    ? msg.receiver
                    : msg.sender;

                conversationsMap.set(interlocutorId, {
                    interlocutor,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            // Contar não lidas
            if (msg.receiver._id.equals(userId) && !msg.read) {
                conversationsMap.get(interlocutorId).unreadCount++;
            }
        });

        // Converter para array
        const conversations = Array.from(conversationsMap.values());

        res.status(200).json({
            success: true,
            results: conversations.length,
            data: conversations
        });

    } catch (error) {
        console.error('Erro ao buscar conversações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar conversações.',
            error: error.message
        });
    }
};


// @desc    Obter mensagens não lidas
// Rota: GET /api/messages/unread
exports.getUnreadMessages = async (req, res) => {
    try {
        const unreadMessages = await Message.find({
            receiver: req.user._id,
            read: false
        })
            .populate('sender', 'firstName lastName role avatar email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalUnread: unreadMessages.length,
            data: unreadMessages
        });

    } catch (error) {
        console.error('Erro ao obter mensagens não lidas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter notificações.',
            error: error.message
        });
    }
};


// @desc    Marcar mensagem como lida
// Rota: PUT /api/messages/:messageId/read
exports.markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensagem não encontrada.'
            });
        }

        // Apenas o receiver pode marcar como lida
        if (!message.receiver.equals(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Não autorizado.'
            });
        }

        message.read = true;
        await message.save();

        res.status(200).json({
            success: true,
            data: message
        });

    } catch (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar mensagem.',
            error: error.message
        });
    }
};


// @desc    Enviar alerta de treino (Trainer para Cliente)
// Rota: POST /api/messages/alert
exports.sendTrainingAlert = async (req, res) => {
    const trainerId = req.user._id;

    // ✅ Aceitar ambos os formatos:
    // Novo: { receiverId, content }
    // Antigo: { clientId, date, missingDetails }
    const { receiverId, content, clientId, date, missingDetails } = req.body;

    // Determinar o ID do cliente (priorizar receiverId se presente)
    const targetClientId = receiverId || clientId;

    try {
        // Verificar se o cliente existe
        const client = await User.findById(targetClientId);
        if (!client || client.role !== 'client') {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado.'
            });
        }

        // ✅ REMOVIDO: Verificação rígida de associação
        // Permite que qualquer trainer envie alerta para qualquer cliente
        // (Ajusta conforme regra de negócio)

        // Conteúdo do alerta
        let alertContent;
        if (content) {
            // Novo formato: usar conteúdo personalizado
            alertContent = content;
        } else if (date) {
            // Formato antigo: gerar conteúdo estruturado
            alertContent = `⚠️ ALERTA DE TREINO: Falta registada no treino de ${date}. ${missingDetails ? `Motivo: ${missingDetails}` : ''}`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'É necessário fornecer "content" ou "date" para o alerta.'
            });
        }

        const alert = await Message.create({
            sender: trainerId,
            receiver: targetClientId,
            content: alertContent,
            type: 'alert',
            read: false
        });

        // Popular dados
        await alert.populate('sender', 'firstName lastName avatar role');
        await alert.populate('receiver', 'firstName lastName avatar role');

        // ✅ Criar notificação persistente
        await Notification.createNotification({
            recipient: targetClientId,
            sender: trainerId,
            type: 'alert',
            title: '⚠️ Alerta do Trainer',
            message: alertContent,
            link: `/chat/${trainerId}`
        });

        // Socket.IO notification
        const io = req.app.get('io');
        if (io) {
            io.to(targetClientId.toString()).emit('training_alert', {
                alert,
                trainerId: trainerId.toString()
            });
        }

        res.status(201).json({
            success: true,
            message: 'Alerta de treino enviado ao cliente.',
            data: alert
        });

    } catch (error) {
        console.error('Erro ao enviar alerta:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar alerta de treino.',
            error: error.message
        });
    }
};