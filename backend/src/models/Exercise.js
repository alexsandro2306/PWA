const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExerciseSchema = new Schema({
    name: {
        type: String,
        required: [true, 'O nome do exercício é obrigatório'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String, // Ex: Peito, Pernas, Cardio, Flexibilidade
        required: [true, 'A categoria do exercício é obrigatória']
    },
    // [REQUISITO: Possibilidade de anexar links de vídeo para demonstração]
    videoLink: {
        type: String, // Link para o YouTube ou vídeo
        trim: true
    },
    // Quem registou o exercício na plataforma (opcional, pode ser o Admin)
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);