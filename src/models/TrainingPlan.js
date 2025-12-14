const mongoose = require('mongoose');

// Sub-Schema para Exercícios
const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do exercício é obrigatório']
  },
  sets: {
    type: Number,
    required: [true, 'Número de séries é obrigatório'],
    min: [1, 'Deve ter pelo menos 1 série']
  },
  reps: {
    type: String,
    required: [true, 'Número de repetições é obrigatório']
  },
  instructions: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: [true, 'Ordem do exercício é obrigatória']
  }
});

// Sub-Schema para Treino do Dia
const dayWorkoutSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: [true, 'Dia da semana é obrigatório'],
    min: [0, 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)'],
    max: [6, 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)']
  },
  exercises: {
    type: [exerciseSchema],
    validate: [arrayLimit, 'Máximo de 10 exercícios por sessão']
  }
});

// Validação customizada para limite de exercícios
function arrayLimit(val) {
  return val.length <= 10;
}

// Schema Principal - Plano de Treino
const workoutSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Cliente é obrigatório']
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Personal Trainer é obrigatório']
  },
  name: {
    type: String,
    required: [true, 'Nome do plano é obrigatório'],
    trim: true
  },
  frequency: {
    type: Number,
    enum: {
      values: [3, 4, 5],
      message: 'Frequência deve ser 3x, 4x ou 5x por semana'
    },
    required: [true, 'Frequência é obrigatória']
  },
  startDate: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  endDate: {
    type: Date,
    required: [true, 'Data de fim é obrigatória']
  },
  weeklyPlan: {
    type: [dayWorkoutSchema],
    validate: {
      validator: function (plan) {
        // Validar que o número de dias corresponde à frequência
        // Use parent() to access the parent document if this is a subdocument
        const frequency = this.frequency || this.parent?.frequency;
        if (!frequency) {
          return true; // Skip validation if frequency is not set yet
        }
        return plan.length === frequency;
      },
      message: function (props) {
        const frequency = props.instance.frequency;
        const actualLength = props.value?.length || 0;
        return `O plano deve ter exatamente ${frequency} dias de treino, mas tem ${actualLength}`;
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ✅ MIDDLEWARE PRE-SAVE - VALIDAÇÃO DE DATAS
workoutSchema.pre('save', function (next) {
  // 1. Validar que startDate é anterior a endDate
  if (this.startDate >= this.endDate) {
    const error = new Error('A data de início deve ser anterior à data de fim do plano.');
    error.name = 'ValidationError';
    return next(error);
  }

  // 2. Validar que o plano não está muito longe no futuro (máximo 1 ano)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (this.endDate > oneYearFromNow) {
    const error = new Error('O plano não pode ter duração superior a 1 ano.');
    error.name = 'ValidationError';
    return next(error);
  }

  // 3. Validar que o plano não começa no passado (permitir criar no dia atual)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Resetar horas para comparar apenas data

  const startDateOnly = new Date(this.startDate);
  startDateOnly.setHours(0, 0, 0, 0);

  if (startDateOnly < today) {
    const error = new Error('Não é possível criar planos com data de início no passado.');
    error.name = 'ValidationError';
    return next(error);
  }

  // 4. Validar duração mínima (pelo menos 1 semana)
  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
  const duration = this.endDate - this.startDate;

  if (duration < oneWeekInMs) {
    const error = new Error('O plano deve ter duração mínima de 1 semana.');
    error.name = 'ValidationError';
    return next(error);
  }

  next();
});

// ✅ MIDDLEWARE PRE-SAVE - VALIDAR DIAS DA SEMANA ÚNICOS
workoutSchema.pre('save', function (next) {
  if (!this.weeklyPlan || this.weeklyPlan.length === 0) {
    return next();
  }

  const days = this.weeklyPlan.map(session => session.dayOfWeek);
  const uniqueDays = new Set(days);

  if (days.length !== uniqueDays.size) {
    const error = new Error('Não pode haver dias da semana duplicados no plano.');
    error.name = 'ValidationError';
    return next(error);
  }

  next();
});

// Índices para otimização de queries
workoutSchema.index({ client: 1, isActive: 1 });
workoutSchema.index({ trainer: 1 });
workoutSchema.index({ startDate: 1, endDate: 1 });

// Método virtual para calcular duração do plano em dias
workoutSchema.virtual('durationDays').get(function () {
  const duration = this.endDate - this.startDate;
  return Math.ceil(duration / (1000 * 60 * 60 * 24));
});

// Método virtual para verificar se o plano está em vigor
workoutSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Método para desativar plano
workoutSchema.methods.deactivate = async function () {
  this.isActive = false;
  return await this.save();
};

// Método estático para encontrar plano ativo de um cliente
workoutSchema.statics.findActiveByClient = function (clientId) {
  return this.findOne({ client: clientId, isActive: true })
    .populate('trainer', 'firstName lastName email phone')
    .populate('client', 'firstName lastName email');
};

// Configurar para incluir virtuals em JSON e Object
workoutSchema.set('toJSON', { virtuals: true });
workoutSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Workout', workoutSchema);