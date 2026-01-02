/**
 * Serviço de Notificações em Tempo Real com Socket.IO
 * 
 * Este serviço centraliza todas as emissões de eventos WebSocket
 * para notificações em tempo real aos utilizadores.
 */

let io;

/**
 * Inicializa o serviço com a instância do Socket.IO
 */
const initialize = (socketIO) => {
    io = socketIO;
    console.log('✅ Serviço de notificações inicializado');
};

/**
 * Obtém a instância do Socket.IO
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO não foi inicializado! Chame initialize() primeiro.');
    }
    return io;
};

// ==================== EVENTOS DE MENSAGENS ====================

/**
 * Notifica sobre nova mensagem recebida
 * @param {String} userId - ID do utilizador que vai receber a notificação
 * @param {Object} message - Objeto da mensagem
 */
const notifyNewMessage = (userId, message) => {
    if (!io) return;

    io.to(userId.toString()).emit('new_message', {
        type: 'message',
        senderId: message.sender,
        senderName: message.senderName || 'Utilizador',
        content: message.content,
        timestamp: message.createdAt || new Date(),
        messageId: message._id
    });

    console.log(`📨 Notificação de mensagem enviada para ${userId}`);
};

/**
 * Notifica sobre alerta de treino enviado pelo trainer
 * @param {String} clientId - ID do cliente
 * @param {Object} alert - Objeto do alerta
 */
const notifyTrainingAlert = (clientId, alert) => {
    if (!io) return;

    io.to(clientId.toString()).emit('training_alert', {
        type: 'alert',
        trainerId: alert.sender,
        trainerName: alert.trainerName || 'Personal Trainer',
        content: alert.content,
        timestamp: alert.createdAt || new Date(),
        alertId: alert._id
    });

    console.log(`⚠️ Alerta de treino enviado para ${clientId}`);
};

// ==================== EVENTOS DE PLANOS DE TREINO ====================

/**
 * Notifica cliente sobre novo plano de treino criado
 * @param {String} clientId - ID do cliente
 * @param {Object} plan - Objeto do plano de treino
 */
const notifyNewTrainingPlan = (clientId, plan) => {
    if (!io) return;

    io.to(clientId.toString()).emit('new_training_plan', {
        type: 'training_plan',
        planId: plan._id,
        planName: plan.name,
        trainerName: plan.trainerName || 'Seu Personal Trainer',
        startDate: plan.startDate,
        endDate: plan.endDate,
        frequency: plan.frequency,
        timestamp: new Date()
    });

    console.log(`💪 Notificação de novo plano enviada para ${clientId}`);
};

/**
 * Notifica trainer sobre log de treino do cliente
 * @param {String} trainerId - ID do trainer
 * @param {Object} log - Objeto do log de treino
 */
const notifyTrainerAboutLog = (trainerId, log) => {
    if (!io) return;

    io.to(trainerId.toString()).emit('client_training_log', {
        type: 'training_log',
        clientId: log.client,
        clientName: log.clientName || 'Cliente',
        isCompleted: log.isCompleted,
        date: log.date,
        hasProof: !!log.proofImageURL,
        timestamp: new Date()
    });

    console.log(`📊 Notificação de log enviada para trainer ${trainerId}`);
};

// ==================== EVENTOS DE ADMINISTRAÇÃO ====================

/**
 * Notifica trainer sobre validação da conta
 * @param {String} trainerId - ID do trainer
 */
const notifyTrainerValidation = (trainerId, trainerName) => {
    if (!io) return;

    io.to(trainerId.toString()).emit('account_validated', {
        type: 'validation',
        message: `Parabéns ${trainerName}! A sua conta de Personal Trainer foi validada.`,
        timestamp: new Date()
    });

    console.log(`✅ Notificação de validação enviada para ${trainerId}`);
};

/**
 * Notifica cliente sobre resposta a pedido de mudança de trainer
 * @param {String} clientId - ID do cliente
 * @param {String} status - 'approved' ou 'rejected'
 * @param {Object} details - Detalhes do pedido
 */
const notifyTrainerChangeResponse = (clientId, status, details) => {
    if (!io) return;

    const message = status === 'approved'
        ? `O seu pedido de mudança de trainer foi aprovado! Novo trainer: ${details.newTrainerName}`
        : `O seu pedido de mudança de trainer foi rejeitado.`;

    io.to(clientId.toString()).emit('trainer_change_response', {
        type: 'trainer_change',
        status: status,
        message: message,
        newTrainer: status === 'approved' ? details.newTrainerId : null,
        timestamp: new Date()
    });

    console.log(`🔄 Notificação de mudança de trainer enviada para ${clientId}`);
};

// ==================== EVENTOS GENÉRICOS ====================

/**
 * Envia notificação genérica
 * @param {String} userId - ID do utilizador
 * @param {Object} notification - Dados da notificação
 */
const sendNotification = (userId, notification) => {
    if (!io) return;

    io.to(userId.toString()).emit('notification', {
        ...notification,
        timestamp: notification.timestamp || new Date()
    });

    console.log(`🔔 Notificação enviada para ${userId}`);
};

/**
 * Envia notificação broadcast para todos os utilizadores conectados
 * @param {Object} notification - Dados da notificação
 */
const broadcastNotification = (notification) => {
    if (!io) return;

    io.emit('broadcast_notification', {
        ...notification,
        timestamp: notification.timestamp || new Date()
    });

    console.log(`📢 Notificação broadcast enviada`);
};

// ==================== GESTÃO DE CONEXÕES ====================

/**
 * Obtém número de utilizadores conectados
 * @returns {Number}
 */
const getConnectedUsersCount = async () => {
    if (!io) return 0;

    const sockets = await io.fetchSockets();
    return sockets.length;
};

/**
 * Verifica se um utilizador está online
 * @param {String} userId - ID do utilizador
 * @returns {Boolean}
 */
const isUserOnline = async (userId) => {
    if (!io) return false;

    const socketsInRoom = await io.in(userId.toString()).fetchSockets();
    return socketsInRoom.length > 0;
};

module.exports = {
    initialize,
    getIO,
    // Mensagens
    notifyNewMessage,
    notifyTrainingAlert,
    // Treinos
    notifyNewTrainingPlan,
    notifyTrainerAboutLog,
    // Admin
    notifyTrainerValidation,
    notifyTrainerChangeResponse,
    // Genérico
    sendNotification,
    broadcastNotification,
    // Utilidades
    getConnectedUsersCount,
    isUserOnline
};
