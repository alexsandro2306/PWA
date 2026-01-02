# WebSockets e Notificações em Tempo Real

## 🔌 Sistema Implementado

Sistema completo de notificações em tempo real usando Socket.IO para comunicação bidirecional entre servidor e clientes.

---

## 📡 Arquitetura

```
Cliente (Browser) ←→ WebSocket ←→ Socket.IO Server ←→ NotificationService ←→ Controllers
```

### Fluxo de Notificação

1. **Evento acontece** (ex: nova mensagem, plano criado)
2. **Controller** chama `notificationService.notifyX()`
3. **NotificationService** emite evento via Socket.IO
4. **Cliente conectado** recebe notificação em tempo real
5. **Frontend** exibe toast/atualiza UI

---

## 🎯 Eventos Disponíveis

### Eventos do Servidor (Server → Cliente)

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `connected` | Confirmação de conexão | `{message, userId, socketId}` |
| `new_message` | Nova mensagem recebida | `{type, senderId, senderName, content, timestamp, messageId}` |
| `training_alert` | Alerta de treino faltado | `{type, trainerId, trainerName, content, timestamp, alertId}` |
| `new_training_plan` | Novo plano de treino criado | `{type, planId, planName, trainerName, startDate, endDate, frequency, timestamp}` |
| `client_training_log` | Cliente registou treino | `{type, clientId, clientName, isCompleted, date, hasProof, timestamp}` |
| `account_validated` | Conta de trainer validada | `{type, message, timestamp}` |
| `trainer_change_response` | Resposta a pedido de mudança | `{type, status, message, newTrainer, timestamp}` |
| `notification` | Notificação genérica | `{...custom, timestamp}` |
| `broadcast_notification` | Notificação para todos | `{...custom, timestamp}` |
| `pong` | Resposta a ping (keep-alive) | - |

### Eventos do Cliente (Cliente → Servidor)

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `join` | Entrar na sala privada | `userId` (String) |
| `leave` | Sair da sala | `userId` (String) |
| `ping` | Manter conexão ativa | - |

---

## 💻 Como Usar no Frontend

### 1. Instalar Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Conectar ao Servidor

```javascript
import { io } from 'socket.io-client';

// Conectar ao servidor
const socket = io('http://localhost:5000', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Aguardar conexão
socket.on('connect', () => {
  console.log('✅ Conectado ao WebSocket:', socket.id);
  
  // Entrar na sala privada do utilizador
  const userId = localStorage.getItem('userId'); // Ex: do token JWT
  socket.emit('join', userId);
});

// Confirmação de entrada na sala
socket.on('connected', (data) => {
  console.log('📡', data.message);
});

// Tratamento de desconexão
socket.on('disconnect', () => {
  console.log('❌ Desconectado do WebSocket');
});
```

### 3. Escutar Notificações

```javascript
// Nova mensagem
socket.on('new_message', (data) => {
  console.log('📨 Nova mensagem de:', data.senderName);
  showToast({
    type: 'info',
    title: 'Nova Mensagem',
    message: `${data.senderName}: ${data.content}`,
    duration: 5000
  });
  
  // Atualizar lista de mensagens
  refreshMessages();
});

// Alerta de treino
socket.on('training_alert', (data) => {
  console.log('⚠️ Alerta do trainer:', data.trainerName);
  showToast({
    type: 'warning',
    title: 'Alerta de Treino',
    message: data.content,
    duration: 7000
  });
});

// Novo plano de treino
socket.on('new_training_plan', (data) => {
  console.log('💪 Novo plano:', data.planName);
  showToast({
    type: 'success',
    title: 'Novo Plano de Treino!',
    message: `${data.trainerName} criou um novo plano: ${data.planName}`,
    duration: 5000
  });
  
  // Redirecionar ou recarregar planos
  window.location.href = '/training-plans';
});

// Cliente registou treino (para trainers)
socket.on('client_training_log', (data) => {
  const icon = data.isCompleted ? '✅' : '❌';
  const message = data.isCompleted 
    ? `${data.clientName} completou o treino!` 
    : `${data.clientName} não completou o treino`;
    
  showToast({
    type: data.isCompleted ? 'success' : 'warning',
    title: 'Log de Treino',
    message: message,
    duration: 5000
  });
});

// Conta validada (para trainers)
socket.on('account_validated', (data) => {
  showToast({
    type: 'success',
    title: '🎉 Validação Completa!',
    message: data.message,
    duration: 10000
  });
  
  // Recarregar página para atualizar UI
  setTimeout(() => window.location.reload(), 3000);
});

// Notificação genérica
socket.on('notification', (data) => {
  showToast({
    type: data.type || 'info',
    title: data.title || 'Notificação',
    message: data.message,
    duration: data.duration || 5000
  });
});
```

### 4. Keep-Alive (Opcional)

```javascript
// Enviar ping a cada 25 segundos para manter conexão
setInterval(() => {
  socket.emit('ping');
}, 25000);

socket.on('pong', () => {
  console.log('🏓 Pong recebido');
});
```

---

## 🔧 Como Integrar nos Controllers

### Exemplo: messageController.js

```javascript
const notificationService = require('../services/notificationService');

exports.sendMessage = async (req, res) => {
  // ... lógica de criação de mensagem
  
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content: content
  });
  
  // 🔔 ENVIAR NOTIFICAÇÃO EM TEMPO REAL
  notificationService.notifyNewMessage(receiverId, {
    sender: senderId,
    senderName: req.user.firstName + ' ' + req.user.lastName,
    content: content,
    createdAt: message.createdAt,
    _id: message._id
  });
  
  res.status(201).json({ success: true, data: message });
};
```

### Exemplo: trainingController.js

```javascript
const notificationService = require('../services/notificationService');

exports.createTrainingPlan = async (req, res) => {
  // ... lógica de criação de plano
  
  const newPlan = await TrainingPlan.create({/*...*/});
  
  // 🔔 NOTIFICAR CLIENTE
  notificationService.notifyNewTrainingPlan(clientId, {
    _id: newPlan._id,
    name: newPlan.name,
    trainerName: req.user.firstName + ' ' + req.user.lastName,
    startDate: newPlan.startDate,
    endDate: newPlan.endDate,
    frequency: newPlan.frequency
  });
  
  res.status(201).json({ success: true, data: newPlan });
};
```

### Exemplo: logController.js

```javascript
const notificationService = require('../services/notificationService');

exports.createTrainingLog = async (req, res) => {
  // ... lógica de criação de log
  
  const log = await TrainingLog.create({/*...*/});
  
  // 🔔 NOTIFICAR TRAINER
  notificationService.notifyTrainerAboutLog(trainerId, {
    client: clientId,
    clientName: req.user.firstName + ' ' + req.user.lastName,
    isCompleted: log.isCompleted,
    date: log.date,
    proofImageURL: log.proofImageURL
  });
  
  res.status(201).json({ success: true, data: log });
};
```

---

## 🧪 Testar WebSockets

### Usando Browser Console

```javascript
// Abrir console no browser (F12)
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Conectado:', socket.id);
  socket.emit('join', '507f1f77bcf86cd799439011'); // Seu userId
});

socket.on('connected', (data) => console.log(data));
socket.on('new_message', (data) => console.log('Nova mensagem:', data));
socket.on('notification', (data) => console.log('Notificação:', data));
```

### Usando Postman/Insomnia

1. Criar New Request → WebSocket
2. URL: `ws://localhost:5000`
3. Connect
4. Send: `{"event":"join","data":"userIdHere"}`
5. Observar eventos recebidos

---

## 📊 Métodos do NotificationService

```javascript
const notificationService = require('./services/notificationService');

// Mensagens
notificationService.notifyNewMessage(userId, messageData);
notificationService.notifyTrainingAlert(clientId, alertData);

// Treinos
notificationService.notifyNewTrainingPlan(clientId, planData);
notificationService.notifyTrainerAboutLog(trainerId, logData);

// Admin
notificationService.notifyTrainerValidation(trainerId, trainerName);
notificationService.notifyTrainerChangeResponse(clientId, status, details);

// Genérico
notificationService.sendNotification(userId, {/*custom*/});
notificationService.broadcastNotification({/*custom*/});

// Utilidades
const count = await notificationService.getConnectedUsersCount();
const isOnline = await notificationService.isUserOnline(userId);
```

---

## 🔒 Segurança

### Boas Práticas Implementadas

✅ **Salas privadas** - Cada utilizador tem sua sala (userId)  
✅ **CORS configurado** - Apenas frontend autorizado  
✅ **Validação de dados** - Verificar relações antes de notificar  
✅ **Autenticação** - Usar tokens JWT para identificar utilizadores  

### Melhorias Futuras

> [!WARNING]
> **Autenticação no Socket.IO**: Implementar middleware de autenticação no handshake para validar token JWT antes de permitir conexão

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Validar token JWT
  if (validToken) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

---

## ✅ Checklist de Implementação

- [x] Serviço de notificações criado
- [x] Socket.IO configurado no servidor
- [x] Eventos de conexão/desconexão
- [x] Sistema de salas privadas
- [x] Eventos para mensagens
- [x] Eventos para treinos
- [x] Eventos para admin
- [x] Métodos utilitários
- [x] Documentação completa
- [ ] Integrar com todos os controllers
- [ ] Testar em produção
- [ ] Adicionar autenticação no socket

---

## 🚀 Exemplo Completo - React Hook

```javascript
// hooks/useNotifications.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

export const useNotifications = (userId) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', userId);
    });

    newSocket.on('connected', (data) => {
      console.log('✅', data.message);
    });

    newSocket.on('new_message', (data) => {
      toast.info(`📨 ${data.senderName}: ${data.content}`);
    });

    newSocket.on('new_training_plan', (data) => {
      toast.success(`💪 Novo plano: ${data.planName}`);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      newSocket.emit('leave', userId);
      newSocket.close();
    };
  }, [userId]);

  return { socket, isConnected };
};
```

**Uso no componente:**
```javascript
function App() {
  const userId = useAuth().user?.id;
  const { socket, isConnected } = useNotifications(userId);

  return (
    <div>
      {isConnected && <span>🟢 Online</span>}
      {/* resto do app */}
    </div>
  );
}
```
