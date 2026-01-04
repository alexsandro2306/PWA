const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Cliente é obrigatório']
    },
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Trainer é obrigatório']
    },
    newTrainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Para pedidos de mudança de trainer
    },
    reason: {
        type: String,
        required: [true, 'Motivo é obrigatório'],
        trim: true,
        maxlength: [500, 'Motivo não pode exceder 500 caracteres']
    },
    type: {
        type: String,
        enum: ['association', 'trainer_change'],
        default: 'association',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        required: true
    }
}, {
    timestamps: true
});

// Índices para performance
RequestSchema.index({ client: 1, status: 1 });
RequestSchema.index({ trainer: 1, status: 1 });
RequestSchema.index({ type: 1, status: 1 });

// Middleware: prevenir pedidos duplicados
RequestSchema.pre('save', async function (next) {
    if (this.isNew && this.type === 'association') {
        const existing = await this.constructor.findOne({
            client: this.client,
            trainer: this.trainer,
            status: 'pending'
        });

        if (existing) {
            const error = new Error('Já existe um pedido pendente para este trainer');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Request', RequestSchema);