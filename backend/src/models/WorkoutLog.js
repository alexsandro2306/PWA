const mongoose = require('mongoose');

const WorkoutLogSchema = new mongoose.Schema({
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
    trainingPlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingPlan',
        required: [true, 'Plano de treino é obrigatório']
    },
    date: {
        type: Date,
        default: Date.now
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: [true, 'Dia da semana é obrigatório']
    },
    exercises: [{
        exerciseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise'
        },
        name: String,
        sets: Number,
        reps: Number,
        weight: Number,
        duration: Number, // em minutos
        completed: {
            type: Boolean,
            default: false
        },
        notes: String
    }],
    completed: {
        type: Boolean,
        default: false,
        required: true
    },
    notes: {
        type: String,
        maxlength: [500, 'Notas não podem exceder 500 caracteres']
    },
    proofImage: {
        type: String // URL da imagem de prova
    },
    missedReason: {
        type: String,
        maxlength: [300, 'Razão não pode exceder 300 caracteres']
    }
}, {
    timestamps: true
});

// Índices para melhor performance
WorkoutLogSchema.index({ client: 1, date: -1 });
WorkoutLogSchema.index({ trainer: 1, date: -1 });
WorkoutLogSchema.index({ completed: 1 });

// Virtual para taxa de conclusão
WorkoutLogSchema.virtual('completionRate').get(function () {
    if (!this.exercises || this.exercises.length === 0) return 0;
    const completedExercises = this.exercises.filter(ex => ex.completed).length;
    return Math.round((completedExercises / this.exercises.length) * 100);
});

// Middleware: Enviar notificação ao trainer se treino não foi completado
WorkoutLogSchema.post('save', async function (doc) {
    if (!doc.completed && doc.isNew) {
        // Aqui podes adicionar lógica de notificação via Socket.IO
        console.log(`⚠️ Cliente ${doc.client} faltou ao treino. Razão: ${doc.missedReason}`);
    }
});

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);