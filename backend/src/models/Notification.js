const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Destinatário é obrigatório']
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        enum: ['plan_created', 'plan_updated', 'workout_logged', 'message', 'alert', 'request', 'other'],
        default: 'other'
    },
    title: {
        type: String,
        required: [true, 'Título é obrigatório']
    },
    message: {
        type: String,
        required: [true, 'Mensagem é obrigatória']
    },
    link: {
        type: String,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Índices
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Método para marcar como lida
notificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
};

// Método estático para criar notificação
notificationSchema.statics.createNotification = async function (data) {
    return await this.create({
        recipient: data.recipient,
        sender: data.sender || null,
        type: data.type || 'other',
        title: data.title,
        message: data.message,
        link: data.link || null
    });
};

module.exports = mongoose.model('Notification', notificationSchema);