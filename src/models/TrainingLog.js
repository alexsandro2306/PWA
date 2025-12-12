const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrainingLogSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trainer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Data em que o treino deveria ter ocorrido
    date: {
        type: Date,
        required: true,
        // Garante que só há um log por cliente por dia (opcional, mas útil)
        index: true 
    },
    isCompleted: {
        type: Boolean,
        required: true,
        default: false
    },
    // [REQUISITO: Caso não cumpra, deverá indicar o motivo]
    reasonNotCompleted: {
        type: String,
        trim: true,
        default: null,
        required: function() { return !this.isCompleted; } // Obrigatório se não foi concluído
    },
    // [REQUISITO: Para demonstrar o cumprimento do treino o cliente pode associar uma imagem]
    proofImageURL: {
        type: String, // Link para a imagem (ex: foto do equipamento ou registo de smartwatch)
        default: null
    },
    // Referência ao plano (para análise e contextualização)
    workoutPlan: {
        type: Schema.Types.ObjectId,
        ref: 'Workout'
    },
    // Qual dia da semana do plano foi (ex: 0=Domingo, 1=Segunda)
    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
    }
}, { timestamps: true });

// Índice composto para garantir que o cliente só faz um log por dia
TrainingLogSchema.index({ client: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrainingLog', TrainingLogSchema);