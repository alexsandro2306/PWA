const mongoose = require('mongoose');

const trainingLogSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingPlan',
        required: true
    },
    workoutId: {
        type: Number, // dayOfWeek (0-6)
        required: true,
        min: 0,
        max: 6
    },
    date: {
        type: Date,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    reason: {
        type: String,
        default: ''
    },
    proofImage: {
        type: String, // URL da imagem de prova
        default: null
    },
    notes: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // Duração em minutos
        default: null
    }
}, {
    timestamps: true
});

// Index para consultas rápidas
trainingLogSchema.index({ clientId: 1, date: -1 });
trainingLogSchema.index({ trainerId: 1, date: -1 });
trainingLogSchema.index({ planId: 1, workoutId: 1, date: 1 }); // Removed unique constraint

module.exports = mongoose.model('TrainingLog', trainingLogSchema);