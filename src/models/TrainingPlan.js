const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
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
  videoUrl: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true
  }
});

const dayWorkoutSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  exercises: {
    type: [exerciseSchema],
    validate: [arrayLimit, 'Máximo de 10 exercícios por sessão']
  }
});

function arrayLimit(val) {
  return val.length <= 10;
}

const workoutSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: Number,
    enum: [3, 4, 5],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  weeklyPlan: [dayWorkoutSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workout', workoutSchema);