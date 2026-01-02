const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrainerRequestSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentTrainer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null // Pode ser null se o cliente ainda não tiver trainer
    },
    newTrainer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // [REQUISITO: A alteração de personal trainer já atribuído carece de um pedido autorizado]
    reason: {
        type: String,
        required: [true, 'O motivo da alteração é obrigatório'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // Quem processou o pedido (o Administrador)
    adminHandledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    handledAt: Date
}, { timestamps: true });

// Índice para buscas rápidas por pedidos pendentes de um cliente
TrainerRequestSchema.index({ client: 1, status: 1 });

module.exports = mongoose.model('TrainerRequest', TrainerRequestSchema);