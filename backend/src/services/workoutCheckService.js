const TrainingLog = require('../models/TrainingLog');
const TrainingPlan = require('../models/TrainingPlan');
const User = require('../models/User');
const Notification = require('../models/Notification');
const NotificationService = require('./notificationService');

/**
 * Verificar treinos não respondidos e criar notificações
 * Esta função deve ser executada diariamente (ex: à meia-noite)
 */
exports.checkMissedWorkouts = async () => {
    try {
        console.log('🔍 Verificando treinos não respondidos...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Buscar todos os planos ativos
        const activePlans = await TrainingPlan.find({ isActive: true })
            .populate('client', 'firstName lastName name')
            .populate('trainer', '_id');

        let notificationsCreated = 0;

        for (const plan of activePlans) {
            // Verificar se o plano estava ativo ontem
            if (plan.startDate > yesterday || plan.endDate < yesterday) {
                continue;
            }

            // Verificar qual era o dia da semana ontem
            const yesterdayDayOfWeek = yesterday.getDay();

            // Verificar se havia treino agendado para ontem
            const scheduledWorkout = plan.weeklyPlan.find(
                w => w.dayOfWeek === yesterdayDayOfWeek
            );

            if (!scheduledWorkout) {
                continue; // Não havia treino agendado
            }

            // Verificar se existe log para ontem
            const existingLog = await TrainingLog.findOne({
                clientId: plan.client._id,
                planId: plan._id,
                workoutId: yesterdayDayOfWeek,
                date: {
                    $gte: yesterday,
                    $lt: today
                }
            });

            if (!existingLog) {
                // Cliente não respondeu! Criar notificação
                const notification = await Notification.create({
                    recipient: plan.trainer._id,
                    sender: plan.client._id,
                    type: 'alert',
                    title: '⚠️ Treino não registado',
                    message: `${plan.client.name || plan.client.firstName} não registou o treino de ${yesterday.toLocaleDateString('pt-PT')}. O cliente pode ter esquecido de marcar.`,
                    link: '/trainer/clients'
                });

                // Enviar notificação em tempo real via WebSocket
                try {
                    NotificationService.sendNotification(plan.trainer._id.toString(), {
                        type: 'alert',
                        title: notification.title,
                        message: notification.message,
                        link: notification.link,
                        notificationId: notification._id,
                        timestamp: new Date()
                    });
                } catch (err) {
                    console.warn('⚠️ Erro ao enviar notificação via WebSocket:', err.message);
                }

                notificationsCreated++;
                console.log(`📧 Notificação criada para trainer do cliente ${plan.client.firstName}`);
            }
        }

        console.log(`✅ Verificação concluída. ${notificationsCreated} notificações criadas.`);
        return { success: true, notificationsCreated };

    } catch (error) {
        console.error('❌ Erro ao verificar treinos não respondidos:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verificar treinos de HOJE e criar notificações para trainers
 * Esta função deve ser executada no final do dia (ex: 23:00)
 */
exports.checkTodayWorkouts = async () => {
    try {
        console.log('🔍 Verificando treinos de hoje...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayDayOfWeek = today.getDay();

        // Buscar todos os planos ativos
        const activePlans = await TrainingPlan.find({ isActive: true })
            .populate('client', 'firstName lastName name')
            .populate('trainer', '_id');

        let notificationsCreated = 0;
        const notificationsByTrainer = {}; // Agrupar por trainer

        for (const plan of activePlans) {
            // Verificar se o plano estava ativo hoje
            if (plan.startDate > today || plan.endDate < today) {
                continue;
            }

            // Verificar se havia treino agendado para hoje
            const scheduledWorkout = plan.weeklyPlan.find(
                w => w.dayOfWeek === todayDayOfWeek
            );

            if (!scheduledWorkout) {
                continue; // Não havia treino agendado
            }

            const trainerId = plan.trainer._id.toString();
            if (!notificationsByTrainer[trainerId]) {
                notificationsByTrainer[trainerId] = {
                    completed: [],
                    missed: [],
                    unmarked: []
                };
            }

            // Verificar se existe log para hoje
            const existingLog = await TrainingLog.findOne({
                clientId: plan.client._id,
                planId: plan._id,
                workoutId: todayDayOfWeek,
                date: {
                    $gte: today,
                    $lt: tomorrow
                }
            });

            const clientName = plan.client.name || plan.client.firstName;

            if (!existingLog) {
                // Cliente não marcou nada
                notificationsByTrainer[trainerId].unmarked.push(clientName);
            } else if (existingLog.isCompleted) {
                // Cliente completou o treino
                notificationsByTrainer[trainerId].completed.push(clientName);
            } else {
                // Cliente não completou (com justificação)
                notificationsByTrainer[trainerId].missed.push({
                    name: clientName,
                    reason: existingLog.reason || 'Não especificado'
                });
            }
        }

        // Criar notificações agrupadas por trainer
        for (const [trainerId, data] of Object.entries(notificationsByTrainer)) {
            const parts = [];

            if (data.completed.length > 0) {
                parts.push(`✅ Concluídos (${data.completed.length}): ${data.completed.join(', ')}`);
            }

            if (data.missed.length > 0) {
                const missedDetails = data.missed.map(m => `${m.name} (${m.reason})`).join('; ');
                parts.push(`❌ Não concluídos (${data.missed.length}): ${missedDetails}`);
            }

            if (data.unmarked.length > 0) {
                parts.push(`⚠️ Não marcados (${data.unmarked.length}): ${data.unmarked.join(', ')}`);
            }

            if (parts.length > 0) {
                const notification = await Notification.create({
                    recipient: trainerId,
                    type: 'alert',
                    title: `📊 Resumo de Treinos - ${today.toLocaleDateString('pt-PT')}`,
                    message: parts.join(' | '),
                    link: '/trainer/clients'
                });

                // Enviar notificação em tempo real via WebSocket
                try {
                    NotificationService.sendNotification(trainerId, {
                        type: 'alert',
                        title: notification.title,
                        message: notification.message,
                        link: notification.link,
                        notificationId: notification._id,
                        timestamp: new Date()
                    });
                } catch (err) {
                    console.warn('⚠️ Erro ao enviar notificação via WebSocket:', err.message);
                }

                notificationsCreated++;
                console.log(`📧 Notificação de resumo criada para trainer ${trainerId}`);
            }
        }

        console.log(`✅ Verificação de hoje concluída. ${notificationsCreated} notificações criadas.`);
        return { success: true, notificationsCreated };

    } catch (error) {
        console.error('❌ Erro ao verificar treinos de hoje:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Rota manual para testar a verificação de treinos de hoje
 */
exports.triggerTodayWorkoutsCheck = async (req, res) => {
    try {
        const result = await exports.checkTodayWorkouts();
        res.json({
            success: true,
            message: 'Verificação de hoje executada com sucesso',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao executar verificação',
            error: error.message
        });
    }
};

/**
 * Rota manual para testar a verificação de treinos não respondidos (ontem)
 */
exports.triggerMissedWorkoutsCheck = async (req, res) => {
    try {
        const result = await exports.checkMissedWorkouts();
        res.json({
            success: true,
            message: 'Verificação executada com sucesso',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao executar verificação',
            error: error.message
        });
    }
};
