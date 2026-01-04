const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: false,  // ✅ Agora opcional (mensagens podem ter só anexo)
    trim: true
  },
  attachmentUrl: {
    type: String,
    required: false
  },
  attachmentType: {
    type: String,
    enum: ['image', 'document'],
    required: false
  },
  read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['message', 'alert'],
    default: 'message'
  }
}, {
  timestamps: true
});

// Índice para otimizar queries de conversação
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);