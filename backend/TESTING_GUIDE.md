# 🧪 Guia Completo de Testes - Backend Fitness Platform

## 🚀 Passo 1: Iniciar o Servidor

### 1.1 Verificar .env
Certifica-te que tens o ficheiro `.env` configurado:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fitness-platform
JWT_SECRET=seu_secret_super_seguro_aqui
FRONTEND_URL=http://localhost:3000
```

### 1.2 Instalar Dependências
```bash
npm install
```

### 1.3 Iniciar Servidor
```bash
npm run dev
```

**Verificação de sucesso:**
```
🚀 Servidor rodando na porta 5000
📖 Documentação API: http://localhost:5000/api-docs
🔌 WebSocket pronto para conexões
MongoDB conectado com sucesso
✅ Serviço de notificações inicializado
```

---

## 📖 Passo 2: Aceder ao Swagger UI

### 2.1 Abrir Swagger
```
http://localhost:5000/api-docs
```

### 2.2 Como Autenticar no Swagger

> [!IMPORTANT]
> **Autenticação obrigatória** para testar a maioria dos endpoints!

1. Primeiro, **registar** ou fazer **login** (ver secção Auth abaixo)
2. **Copiar o token** da resposta (começa com `eyJ...`)
3. Clicar no botão **"Authorize" 🔓** (topo da página Swagger)
4. No campo `Value`, colar **APENAS o token** (sem "Bearer"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> [!WARNING]
> **NÃO colocar "Bearer"** - O Swagger adiciona automaticamente!
> 
> ✅ **CORRETO:** `eyJhbGc...`  
> ❌ **ERRADO:** `Bearer eyJhbGc...`

5. Clicar **"Authorize"** → **"Close"**
6. ✅ Agora podes testar todas as rotas protegidas!

---

## 🔐 Endpoints Disponíveis por Categoria

### 📌 Auth (Autenticação)

#### 1. **POST /api/auth/register** - Registar novo utilizador
- **Público** (não requer autenticação)
- **Body:**
```json
{
  "username": "joao_cliente",
  "email": "joao@email.com",
  "password": "senha123",
  "firstName": "João",
  "lastName": "Silva",
  "role": "client",
  "phone": "+351912345678"
}
```
- **Roles disponíveis:** `client`, `trainer`
- **Resposta:** Retorna `token` e dados do `user`
- ✅ **Copiar o token para autenticar!**

#### 2. **POST /api/auth/login** - Login
- **Público**
- **Body:**
```json
{
  "username": "joao_cliente",
  "password": "senha123"
}
```
- **Resposta:** Retorna `token` e dados do `user`

#### 3. **GET /api/auth/me** - Ver utilizador autenticado
- **Autenticado**
- Retorna os dados do utilizador logado

#### 4. **POST /api/auth/qrcode/generate** - Gerar QR Code (2FA)
- **Autenticado**
- Gera QR Code para autenticação de dois fatores
- **Resposta:** `qrCodeURL` e `secret`

#### 5. **POST /api/auth/qrcode/verify** - Verificar QR Code
- **Autenticado**
- **Body:**
```json
{
  "token": "123456"
}
```

#### 6. **POST /api/auth/qrcode/login** - Login com QR Code
- **Público**
- **Body:**
```json
{
  "username": "joao_cliente",
  "token": "123456"
}
```

---

### 👤 Users (Utilizadores)

#### 1. **GET /api/users/me** - Ver perfil do utilizador logado
- **Autenticado**
- Retorna dados completos do perfil

#### 2. **PATCH /api/users/me** - Atualizar perfil
- **Autenticado**
- **Body:**
```json
{
  "firstName": "João Atualizado",
  "lastName": "Silva",
  "phone": "+351912345678",
  "theme": "dark"
}
```

#### 3. **POST /api/users/request-trainer-change** - Solicitar mudança de trainer
- **Cliente apenas**
- **Body:**
```json
{
  "newTrainerId": "507f1f77bcf86cd799439012",
  "reason": "Horários incompatíveis"
}
```

#### 4. **GET /api/users/my-clients** - Ver lista de clientes
- **Trainer apenas**
- Retorna todos os clientes do trainer logado

#### 5. **POST /api/users/logs** - Registar cumprimento de treino
- **Cliente apenas**
- **Body:**
```json
{
  "date": "2025-01-15",
  "isCompleted": true,
  "reasonNotCompleted": "",
  "proofImageURL": "/uploads/proofs/proof-123.jpg"
}
```

#### 6. **GET /api/users/logs/{clientId}** - Ver logs de treino de cliente
- **Trainer apenas**
- **Parâmetros:**
  - `clientId` (path) - ID do cliente
  - `from` (query, opcional) - Data inicial
  - `to` (query, opcional) - Data final

#### 7. **GET /api/users/dashboard/me** - Dashboard do cliente logado
- **Cliente apenas**
- Retorna estatísticas e dados do dashboard

#### 8. **GET /api/users/dashboard/{clientId}** - Dashboard de um cliente
- **Trainer apenas**
- Ver dashboard de um cliente específico

---

### 💪 Workouts (Planos de Treino)

#### 1. **POST /api/workouts** - Criar plano de treino
- **Trainer apenas**
- **Body:**
```json
{
  "client": "693c79d81aea91380c5aae86",
  "name": "Plano Hipertrofia - Janeiro",
  "frequency": 4,
  "startDate": "2025-01-15",
  "endDate": "2025-02-15",
  "weeklyPlan": [
    {
      "dayOfWeek": 1,
      "exercises": [
        {
          "name": "Supino",
          "sets": 4,
          "reps": "10",
          "instructions": "Controlar descida",
          "videoUrl": "",
          "order": 1
        }
      ]
    },
    {
      "dayOfWeek": 3,
      "exercises": [
        {
          "name": "Agachamento",
          "sets": 4,
          "reps": "12",
          "instructions": "Manter costas retas",
          "videoUrl": "",
          "order": 1
        }
      ]
    },
    {
      "dayOfWeek": 5,
      "exercises": [
        {
          "name": "Levantamento Terra",
          "sets": 3,
          "reps": "8",
          "instructions": "Pegada firme",
          "videoUrl": "",
          "order": 1
        }
      ]
    },
    {
      "dayOfWeek": 6,
      "exercises": [
        {
          "name": "Desenvolvimento",
          "sets": 4,
          "reps": "10",
          "instructions": "Não arquear costas",
          "videoUrl": "",
          "order": 1
        }
      ]
    }
  ]
}
```

> [!NOTE]
> **Dias da semana:** 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
> 
> **Frequência:** Deve ser 3, 4 ou 5 (número de treinos por semana)
> 
> **Importante:** O número de dias no `weeklyPlan` deve ser igual à `frequency`!

#### 2. **GET /api/workouts** - Listar planos de treino
- **Autenticado**
- **Parâmetros de query:**
  - `clientId` (opcional) - Filtrar por cliente
  - `dayOfWeek` (opcional) - Filtrar por dia da semana (0-6)
- **Comportamento:**
  - **Cliente:** Vê apenas os seus planos ativos
  - **Trainer:** Vê planos dos seus clientes
  - **Admin:** Vê todos os planos

#### 3. **GET /api/workouts/active** - Ver plano ativo (Cliente)
- **Cliente apenas**
- Retorna o plano de treino ativo do cliente logado

#### 4. **GET /api/workouts/client/active** - Ver plano ativo detalhado
- **Cliente apenas**
- Versão detalhada do plano ativo

#### 5. **GET /api/workouts/client/logs** - Histórico de logs de treino
- **Cliente apenas**
- Retorna histórico de cumprimento de treinos

#### 6. **GET /api/workouts/client/exercise/{sessionId}/{exerciseId}** - Detalhes de exercício
- **Cliente apenas**
- Ver detalhes de um exercício específico

---

### 🏋️ Exercises (Exercícios)

#### 1. **GET /api/exercises** - Listar exercícios
- **Autenticado**
- **Parâmetros de query:**
  - `muscleGroup` (opcional) - Filtrar por grupo muscular
  - `difficulty` (opcional) - `beginner`, `intermediate`, `advanced`
  - `search` (opcional) - Pesquisar por nome
  - `page` (opcional, default: 1) - Página
  - `limit` (opcional, default: 10) - Itens por página

#### 2. **GET /api/exercises/{id}** - Ver detalhes de exercício
- **Autenticado**
- Retorna informações completas de um exercício

#### 3. **POST /api/exercises** - Criar novo exercício
- **Trainer/Admin apenas**
- **Body:**
```json
{
  "name": "Supino Reto",
  "muscleGroup": "Peito",
  "difficulty": "intermediate",
  "description": "Exercício para peito",
  "videoUrl": "https://...",
  "imageUrl": "https://..."
}
```

---

### 💬 Messages (Mensagens)

#### 1. **POST /api/messages/send** - Enviar mensagem
- **Autenticado**
- **Body:**
```json
{
  "receiverId": "507f1f77bcf86cd799439011",
  "content": "Olá! Como estão os treinos?"
}
```

#### 2. **GET /api/messages/unread** - Ver mensagens não lidas
- **Autenticado**
- Retorna todas as mensagens não lidas

#### 3. **GET /api/messages/{interlocutorId}** - Ver conversação
- **Autenticado**
- Ver histórico de mensagens com um utilizador específico

#### 4. **POST /api/messages/alert** - Enviar alerta de treino
- **Trainer apenas**
- **Body:**
```json
{
  "receiverId": "507f1f77bcf86cd799439011",
  "content": "Treino de hoje não foi cumprido!"
}
```

---

### 📤 Upload (Upload de Ficheiros)

#### 1. **POST /api/upload/avatar** - Upload de avatar
- **Autenticado**
- **Form-data:**
  - `avatar` (file) - Imagem JPEG, PNG, GIF ou WebP
- **Resposta:**
```json
{
  "success": true,
  "message": "Avatar carregado com sucesso",
  "avatarUrl": "/uploads/avatars/avatar-1234567890.jpg"
}
```

#### 2. **POST /api/upload/training-proof** - Upload de comprovativo
- **Autenticado**
- **Form-data:**
  - `proofImage` (file) - Imagem do comprovativo
- **Resposta:**
```json
{
  "success": true,
  "message": "Comprovativo de treino carregado com sucesso",
  "proofUrl": "/uploads/proofs/proofImage-1234567890.jpg"
}
```

> [!TIP]
> Após fazer upload do comprovativo, usa o `proofUrl` retornado no campo `proofImageURL` ao criar um log de treino!

---

### 👨‍💼 Admin (Administração)

#### 1. **GET /api/admin/trainers/pending** - Listar trainers pendentes
- **Admin apenas**
- Retorna trainers aguardando validação

#### 2. **PATCH /api/admin/trainers/{trainerId}/validate** - Validar trainer
- **Admin apenas**
- Aprovar um Personal Trainer

#### 3. **DELETE /api/admin/trainers/{trainerId}** - Remover trainer
- **Admin apenas**
- Eliminar um Personal Trainer do sistema

#### 4. **GET /api/admin/requests/pending** - Listar pedidos de mudança
- **Admin apenas**
- Ver pedidos de mudança de trainer pendentes

#### 5. **PATCH /api/admin/requests/{requestId}** - Processar pedido
- **Admin apenas**
- **Body:**
```json
{
  "action": "approve"
}
```
- **Actions:** `approve` ou `reject`

---

### 🔔 Notifications (Notificações)

#### 1. **GET /api/notifications** - Obter notificações
- **Autenticado**
- Retorna histórico de notificações (implementação via WebSocket)

#### 2. **PATCH /api/notifications/{id}/read** - Marcar como lida
- **Autenticado**
- Marcar uma notificação como lida

---

## 🎯 Fluxos de Teste Completos

### 🔄 Fluxo 1: Registo e Autenticação

```
1. POST /api/auth/register (role: client)
   → Copiar token

2. Authorize no Swagger (colar token)

3. GET /api/auth/me
   → Verificar dados do utilizador

4. PATCH /api/users/me
   → Atualizar perfil

5. POST /api/upload/avatar
   → Upload de foto de perfil
```

### 🔄 Fluxo 2: Trainer Cria Plano para Cliente

```
1. POST /api/auth/register (role: trainer)
   → Copiar token do trainer

2. POST /api/auth/register (role: client)
   → Copiar ID do cliente criado

3. Authorize com token do trainer

4. POST /api/workouts
   → Criar plano com 4 dias de treino
   → Usar ID do cliente no campo "client"

5. GET /api/users/my-clients
   → Verificar que cliente aparece na lista

6. ✅ Cliente recebe notificação WebSocket!
```

### 🔄 Fluxo 3: Cliente Regista Cumprimento de Treino

```
1. Authorize com token do cliente

2. POST /api/upload/training-proof
   → Upload de comprovativo
   → Copiar proofUrl retornado

3. POST /api/users/logs
   {
     "date": "2025-01-15",
     "isCompleted": true,
     "proofImageURL": "/uploads/proofs/proof-123.jpg"
   }

4. GET /api/users/dashboard/me
   → Ver estatísticas atualizadas

5. ✅ Trainer recebe notificação WebSocket!
```

### 🔄 Fluxo 4: Admin Valida Trainer

```
1. POST /api/auth/register (role: trainer)
   → Copiar ID do trainer

2. Criar utilizador admin manualmente no MongoDB:
   db.users.updateOne(
     { username: "admin" },
     { $set: { role: "admin" } }
   )

3. Login como admin

4. GET /api/admin/trainers/pending
   → Ver trainers pendentes

5. PATCH /api/admin/trainers/{trainerId}/validate
   → Validar trainer

6. ✅ Trainer recebe notificação de validação!
```

---

## 🔌 Passo 3: Testar WebSockets

### 3.1 Usando Browser Console

1. Abrir DevTools (F12) → Console
2. Executar:

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:5000');

// Event: Conectado
socket.on('connect', () => {
  console.log('✅ Conectado:', socket.id);
  
  // Entrar na sala privada
  const userId = 'SEU_USER_ID_AQUI'; // Obter do token JWT
  socket.emit('join', userId);
});

// Event: Confirmação
socket.on('connected', (data) => {
  console.log('📡 Conectado à sala:', data);
});

// Event: Nova mensagem
socket.on('new_message', (data) => {
  console.log('📨 Nova mensagem:', data);
});

// Event: Novo plano de treino
socket.on('new_training_plan', (data) => {
  console.log('💪 Novo plano:', data);
});

// Event: Log de treino
socket.on('training_log_created', (data) => {
  console.log('📊 Log criado:', data);
});

// Event: Notificação genérica
socket.on('notification', (data) => {
  console.log('🔔 Notificação:', data);
});
```

### 3.2 Eventos WebSocket Disponíveis

| Evento | Descrição | Quem recebe |
|--------|-----------|-------------|
| `new_message` | Nova mensagem recebida | Destinatário |
| `new_training_plan` | Novo plano criado | Cliente |
| `training_log_created` | Log de treino registado | Trainer |
| `trainer_validated` | Trainer foi validado | Trainer |
| `notification` | Notificação genérica | Utilizador específico |

---

## ✅ Checklist de Teste Completo

### Autenticação ✓
- [ ] Registar cliente
- [ ] Registar trainer
- [ ] Login com cliente
- [ ] Login com trainer
- [ ] Ver perfil (`/api/auth/me`)
- [ ] Gerar QR Code
- [ ] Verificar QR Code
- [ ] Login com QR Code

### Utilizadores ✓
- [ ] Atualizar perfil
- [ ] Cliente solicitar mudança de trainer
- [ ] Trainer ver lista de clientes
- [ ] Cliente registar log de treino
- [ ] Trainer ver logs de cliente
- [ ] Ver dashboard do cliente
- [ ] Trainer ver dashboard de cliente específico

### Workouts ✓
- [ ] Trainer criar plano para cliente (4 dias)
- [ ] Cliente ver plano ativo
- [ ] Listar planos com filtros
- [ ] Ver detalhes de exercício específico
- [ ] Ver histórico de logs

### Exercícios ✓
- [ ] Listar exercícios
- [ ] Filtrar por grupo muscular
- [ ] Filtrar por dificuldade
- [ ] Pesquisar exercício
- [ ] Ver detalhes de exercício
- [ ] Trainer criar novo exercício

### Upload ✓
- [ ] Upload de avatar
- [ ] Upload de comprovativo de treino
- [ ] Verificar ficheiros em `/uploads`
- [ ] Aceder ficheiro via URL

### Mensagens ✓
- [ ] Enviar mensagem entre users
- [ ] Ver conversação
- [ ] Ver mensagens não lidas
- [ ] Trainer enviar alerta

### WebSockets ✓
- [ ] Conectar ao WebSocket
- [ ] Receber notificação de nova mensagem
- [ ] Receber notificação de novo plano
- [ ] Receber notificação de log de treino
- [ ] Receber notificação de validação

### Admin ✓
- [ ] Listar trainers pendentes
- [ ] Validar trainer
- [ ] Remover trainer
- [ ] Listar pedidos de mudança
- [ ] Aprovar/rejeitar pedido

---

## 🐛 Troubleshooting

### Problema: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Problema: "MongoDB connection failed"
```bash
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongodb
# ou
mongod
```

### Problema: "Port 5000 already in use"
```bash
# Mudar porta no .env
PORT=5001

# Ou matar processo
# Windows:
netstat -ano | findstr :5000
taskkill /PID [PID] /F

# Mac/Linux:
lsof -ti:5000 | xargs kill
```

### Problema: "JWT malformed"
- **Causa:** Colocaste "Bearer" no campo de autorização do Swagger
- **Solução:** No Swagger Authorize, cola **APENAS o token** (sem "Bearer")
- O Swagger adiciona "Bearer" automaticamente!

### Problema: "Workout validation failed: weeklyPlan"
- **Causa:** Número de dias no `weeklyPlan` não corresponde à `frequency`
- **Solução:** Se `frequency: 4`, o `weeklyPlan` deve ter exatamente 4 objetos

### Problema: "Expected double-quoted property name in JSON"
- **Causa:** JSON contém comentários (`//`)
- **Solução:** Remover todos os comentários do JSON antes de enviar

### Problema: WebSocket não conecta
- Verificar CORS no `server.js`
- Verificar se Socket.IO client está instalado
- Ver console do browser para erros

---

## 📊 Resultados Esperados

Após testar tudo:

✅ **Server iniciado** sem erros  
✅ **MongoDB conectado** com sucesso  
✅ **Swagger acessível** em `/api-docs`  
✅ **Registo e login** funcionais  
✅ **Autenticação JWT** a proteger rotas  
✅ **Upload de ficheiros** a guardar em `/uploads`  
✅ **WebSocket** a receber notificações em tempo real  
✅ **CRUD completo** para todas as entidades  
✅ **Validações** a funcionar corretamente  
✅ **Notificações** enviadas via WebSocket  

---

## 🎓 Próximos Passos

1. **Frontend**: Conectar frontend ao backend
2. **Testes Automatizados**: Implementar Jest
3. **Deploy**: Preparar para produção
4. **Segurança**: Rate limiting, helmet, etc.
5. **Documentação**: Expandir Swagger com mais exemplos

---

## 📞 Suporte

**Endpoints principais:**
- API: `http://localhost:5000/api`
- Swagger: `http://localhost:5000/api-docs`
- Uploads: `http://localhost:5000/uploads`
- WebSocket: `http://localhost:5000` (Socket.IO)

**Problemas?**
1. Verificar logs do servidor
2. Verificar console do browser
3. Testar com cURL/Postman primeiro
4. Verificar documentação Swagger
