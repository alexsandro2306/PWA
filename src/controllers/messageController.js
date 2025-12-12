const Message = require('../models/Message');
const User = require('../models/User'); 
// Não precisamos do Workout neste controlador, pois a lógica de alerta será apenas de envio.

// Função auxiliar para verificar se a comunicação é permitida
const checkRelationship = async (senderId, receiverId) => {
    // 1. Verificar se ambos os utilizadores existem
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) return false;
    
    // 2. A comunicação é permitida se forem Trainer e Cliente um do outro, ou Admin
    
    // Se um é Trainer e o outro é seu Cliente (ou vice-versa)
    const isTrainerClient = (sender.role === 'trainer' && receiver.trainer && receiver.trainer.equals(senderId));
    const isClientTrainer = (sender.role === 'client' && sender.trainer && sender.trainer.equals(receiverId));
    
    // Permite a comunicação se for Admin (opcional, dependendo da regra de negócio)
    const isAdminInvolved = sender.role === 'admin' || receiver.role === 'admin';

    return isTrainerClient || isClientTrainer || isAdminInvolved;
};


// @desc    Troca de mensagens em chat.
// [REQUISITO: Troca de mensagens em chat.]
// Rota: POST /api/v1/messages/send
exports.sendMessage = async (req, res) => {
    const senderId = req.user._id; // Utilizador logado
    const { receiverId, content } = req.body;

    try {
        if (!(await checkRelationship(senderId, receiverId))) {
            return res.status(403).json({ success: false, message: 'Não autorizado a enviar mensagens a este utilizador.' });
        }

        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content: content,
            type: 'message',
            read: false
        });

        // NOTIFICAÇÃO: Em um sistema de tempo real, esta é a fase onde
        // um evento de WebSocket seria emitido para o `receiverId` para acionar
        // a notificação "toast" no frontend.

        res.status(201).json({
            success: true,
            message: 'Mensagem enviada com sucesso.',
            data: message
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao enviar mensagem.', error: error.message });
    }
};


// @desc    Obtém histórico de conversação entre o utilizador logado e outro utilizador
// Rota: GET /api/v1/messages/:interlocutorId
exports.getConversation = async (req, res) => {
    const userId = req.user._id;
    const interlocutorId = req.params.interlocutorId;

    try {
        if (!(await checkRelationship(userId, interlocutorId))) {
            return res.status(403).json({ success: false, message: 'Não autorizado a ver esta conversação.' });
        }

        // 1. Obter a conversação
        const conversation = await Message.find({
            $or: [
                { sender: userId, receiver: interlocutorId },
                { sender: interlocutorId, receiver: userId }
            ]
        })
        .sort({ createdAt: 1 }) // Ordem cronológica ascendente
        .populate('sender', 'firstName lastName avatar role')
        .populate('receiver', 'firstName lastName avatar role');

        // 2. Marcar mensagens não lidas como lidas
        await Message.updateMany(
            { sender: interlocutorId, receiver: userId, read: false }, // Mensagens que o utilizador logado recebeu e não leu
            { $set: { read: true } }
        );

        res.status(200).json({
            success: true,
            results: conversation.length,
            data: conversation
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter conversação.', error: error.message });
    }
};

// @desc    Obtém mensagens não lidas e alertas para notificação toast
// [REQUISITO: Quando houver uma nova mensagem, o recetor deve receber uma notificação (toast).]
// Rota: GET /api/v1/messages/unread
exports.getUnreadMessages = async (req, res) => {
    try {
        const unreadMessages = await Message.find({ receiver: req.user._id, read: false })
            .populate('sender', 'firstName lastName role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalUnread: unreadMessages.length,
            data: unreadMessages // O frontend pode usar isto para gerar o toast
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter notificações.', error: error.message });
    }
};


// @desc    Enviar alerta do Trainer ao Cliente por falta a treinos
// [REQUISITO: Possibilidade de o treinador enviar alertas quando o cliente faltar a treinos]
// Rota: POST /api/v1/messages/alert
exports.sendTrainingAlert = async (req, res) => {
    const trainerId = req.user._id;
    const { clientId, date, missingDetails } = req.body; 

    // O Trainer só pode alertar os seus próprios clientes
    if (!(await checkRelationship(trainerId, clientId))) {
        return res.status(403).json({ success: false, message: 'Acesso negado. Não é o Personal Trainer deste cliente.' });
    }

    try {
        const client = await User.findById(clientId);
        
        // Conteúdo do Alerta
        const alertContent = `ALERTA (FALTA): Cliente falhou o treino agendado para ${date}. Motivo: ${missingDetails || 'Não especificado'}.`;

        const alert = await Message.create({
            sender: trainerId,
            receiver: clientId,
            content: alertContent,
            type: 'alert', // Usar o enum 'alert'
            read: false
        });

        // NOTIFICAÇÃO: Aqui, o evento de WebSocket seria crucial para notificação imediata.
        
        res.status(201).json({
            success: true,
            message: 'Alerta de treino enviado ao cliente.',
            data: alert
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao enviar alerta de treino.', error: error.message });
    }
};