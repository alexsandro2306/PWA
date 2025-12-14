require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado com sucesso'))
  .catch(err => console.error('Erro ao conectar MongoDB:', err));

// Socket.IO - Configuração de eventos
const notificationService = require('./src/services/notificationService');

io.on('connection', (socket) => {
  console.log('✅ Novo cliente conectado:', socket.id);

  // Evento: Utilizador entra na sua sala privada
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`✅ Utilizador ${userId} entrou na sala ${userId}`);

    // Confirmar conexão
    socket.emit('connected', {
      message: 'Conectado ao servidor de notificações',
      userId: userId,
      socketId: socket.id
    });
  });

  // Evento: Utilizador sai da sala
  socket.on('leave', (userId) => {
    socket.leave(userId);
    console.log(`👋 Utilizador ${userId} saiu da sala`);
  });

  // Evento: Ping para manter conexão ativa
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Evento: Desconexão
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Inicializar serviço de notificações com instância do Socket.IO
notificationService.initialize(io);

// Disponibilizar io para as rotas
app.set('io', io);

// Swagger Documentation
const { swaggerUi, swaggerSpec } = require('./src/swagger/swaggerConfig');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/workouts', require('./src/routes/workouts'));
app.use('/api/exercises', require('./src/routes/exercises'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/upload', require('./src/routes/upload'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📖 Documentação API: http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket pronto para conexões`);
});