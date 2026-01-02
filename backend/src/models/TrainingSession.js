const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- 1. Sub-Esquema para o Exercício na Sessão ---
// Corresponde ao seu `exerciseSchema` dentro do `TrainingPlan.js`
const SessionExerciseSchema = new Schema({
    // NOTA: o campo `exercise` no `TrainingPlan.js` é um sub-documento (não uma referência `ref: 'Exercise'`),
   
    name: {
        type: String,
        required: true
    },
    sets: {
        type: Number,
        required: true,
        min: 1
    },
    reps: {
        type: String,
        required: true
    },
    instructions: {
        type: String,
        default: ''
    },
    // [REQUISITO: Possibilidade de anexar links de vídeo]
    videoUrl: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        required: true
    }
}, { _id: true }); // Usar ID para identificar o exercício dentro da sessão


// --- 2. Sub-Esquema para o Treino do Dia ---

const TrainingSessionSchema = new Schema({
    dayOfWeek: {
        type: Number, // 0=Domingo, 1=Segunda, ...
        required: true,
        min: 0,
        max: 6
    },
    // Lista de exercícios para este dia
    exercises: {
        type: [SessionExerciseSchema],
        validate: {
            validator: function(val) {
                return val.length <= 10; // [REQUISITO: Limite de até 10 exercícios por sessão]
            },
            message: props => `${props.value.length} exercícios, o máximo permitido é 10 por sessão.`
        }
    }
}, { _id: false });


// Exportamos os esquemas para serem embutidos em TrainingPlan.js
module.exports = {
    TrainingSessionSchema,
    SessionExerciseSchema
};        