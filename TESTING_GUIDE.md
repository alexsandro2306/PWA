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

## 📖 Passo 2: Testar com Swagger UI

### 2.1 Aceder ao Swagger
```
http://localhost:5000/api-docs
```

### 2.2 Fluxo de Teste Completo no Swagger

#### **A. Registar Utilizadores**

1. **Registar um Cliente**
   - Ir para `Auth > POST /api/auth/register`
   - Clicar "Try it out"
   - Inserir dados:
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
   - Clicar "Execute"
   - ✅ **Copiar o `token` da resposta**

2. **Registar um Personal Trainer**
   - Mesma rota, mudar apenas:
   ```json
   {
     "username": "maria_trainer",
     "email": "maria@email.com",
     "password": "senha123",
     "firstName": "Maria",
     "lastName": "Costa",
     "role": "trainer"
   }
   ```
   - ✅ **Copiar o `token`**

#### **B. Autenticar no Swagger**

1. Clicar no botão **"Authorize" 🔓** (topo da página)
2. No campo `Value`, inserir **APENAS o token** (sem "Bearer"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
   > [!WARNING]
   > **NÃO colocar "Bearer"** - O Swagger adiciona automaticamente!
   > 
   > ✅ **CORRETO:** `eyJhbGc...`  
   > ❌ **ERRADO:** `Bearer eyJhbGc...`

3. Clicar "Authorize"
4. Clicar "Close"
5. Agora podes testar rotas protegidas! ✅

#### **C. Testar Rotas Protegidas**

1. **Ver Perfil**
   - `GET /api/auth/me` → Execute
   - Deve retornar os teus dados

2. **Atualizar Perfil**
   - `PATCH /api/users/me` → Try it out
   ```json
   {
     "firstName": "João Atualizado",
     "theme": "dark"
   }
   ```

3. **Upload de Avatar**
   - `POST /api/upload/avatar`
   - Choose File → Selecionar uma imagem
   - Execute
   - ✅ Deve retornar `avatarUrl`

---

## 🧰 Passo 3: Testar com Postman/Insomnia

### 3.1 Importar Collection (Opcional)

Podes criar uma collection com os requests básicos:

### 3.2 Exemplos de Requests

#### **1. Registar Cliente**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "teste_cliente",
  "email": "teste@email.com",
  "password": "senha123",
  "firstName": "Teste",
  "lastName": "Cliente",
  "role": "client"
}
```

#### **2. Login**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "teste_cliente",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### **3. Ver Perfil (Autenticado)**
```http
GET http://localhost:5000/api/users/me
Authorization: Bearer SEU_TOKEN_AQUI
```

#### **4. Criar Plano de Treino (Trainer)**
```http
POST http://localhost:5000/api/workouts
Authorization: Bearer TOKEN_DO_TRAINER
Content-Type: application/json

{
  "client": "ID_DO_CLIENTE",
  "name": "Plano de Hipertrofia - Janeiro",
  "frequency": "4x",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "weeklyPlan": [
    {
      "dayOfWeek": 1,
      "exercises": [
        {
          "name": "Supino Reto",
          "sets": 4,
          "reps": "8-12",
          "rest": "90s",
          "notes": "Controlar descida"
        }
      ]
    }
  ]
}
```

---

## 🔌 Passo 4: Testar WebSockets

### 4.1 Usando Browser Console

1. Abrir DevTools (F12)
2. Ir para Console
3. Executar:

```javascript
// Conectar ao WebSocket
const socket = io('http://localhost:5000');

// Event: Conectado
socket.on('connect', () => {
  console.log('✅ Conectado:', socket.id);
  
  // Entrar na sala privada
  const userId = 'SEU_USER_ID_AQUI'; // Ex: do token JWT
  socket.emit('join', userId);
});

// Event: Confirmação
socket.on('connected', (data) => {
  console.log('📡', data);
});

// Event: Nova mensagem
socket.on('new_message', (data) => {
  console.log('📨 Nova mensagem:', data);
});

// Event: Novo plano de treino
socket.on('new_training_plan', (data) => {
  console.log('💪 Novo plano:', data);
});

// Event: Notificação genérica
socket.on('notification', (data) => {
  console.log('🔔 Notificação:', data);
});
```

### 4.2 Testar Notificação

1. Fazer login com 2 utilizadores diferentes (em abas separadas)
2. Conectar ambos ao WebSocket
3. Enviar mensagem de um para o outro:

```http
POST http://localhost:5000/api/messages/send
Authorization: Bearer TOKEN_USER_1
Content-Type: application/json

{
  "receiverId": "ID_DO_USER_2",
  "content": "Olá! Teste de mensagem em tempo real"
}
```

4. ✅ O User 2 deve receber evento `new_message` no WebSocket!

---

## 📤 Passo 5: Testar Upload de Ficheiros

### 5.1 Upload de Avatar (cURL)

```bash
curl -X POST http://localhost:5000/api/upload/avatar \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "avatar=@/caminho/para/foto.jpg"
```

### 5.2 Upload de Comprovativo

```bash
curl -X POST http://localhost:5000/api/upload/training-proof \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "proofImage=@/caminho/para/comprovativo.jpg"
```

### 5.3 Verificar Upload

1. Aceder à pasta:
   ```
   backend/uploads/avatars/
   backend/uploads/proofs/
   ```

2. Verificar ficheiro foi guardado

3. Aceder via browser:
   ```
   http://localhost:5000/uploads/avatars/avatar-123456789.jpg
   ```

---

## 🎯 Passo 6: Fluxos Completos de Teste

### Fluxo 1: Cliente Regista Treino

```bash
# 1. Cliente faz login
POST /api/auth/login
{ "username": "joao_cliente", "password": "senha123" }

# 2. Upload de comprovativo
POST /api/upload/training-proof
Form-data: proofImage = [ficheiro]
→ Retorna: { "proofUrl": "/uploads/proofs/proof-123.jpg" }

# 3. Registar cumprimento de treino
POST /api/users/logs
{
  "date": "2025-01-15",
  "isCompleted": true,
  "proofImageURL": "/uploads/proofs/proof-123.jpg"
}

# 4. ✅ Trainer recebe notificação WebSocket!
```

### Fluxo 2: Trainer Cria Plano para Cliente

```bash
# 1. Trainer faz login
POST /api/auth/login
{ "username": "maria_trainer", "password": "senha123" }

# 2. Ver lista de clientes
GET /api/users/my-clients

# 3. Criar plano para cliente
POST /api/workouts
{
  "client": "ID_DO_CLIENTE",
  "name": "Plano Semanal",
  "frequency": "3x",
  ...
}

# 4. ✅ Cliente recebe notificação WebSocket de novo plano!
```

### Fluxo 3: Admin Valida Trainer

```bash
# 1. Admin faz login
POST /api/auth/login
{ "username": "admin", "password": "senha123" }

# 2. Ver trainers pendentes
GET /api/admin/trainers/pending

# 3. Validar trainer
PATCH /api/admin/trainers/{trainerId}/validate

# 4. ✅ Trainer recebe notificação de validação!
```

---

## 🐛 Troubleshooting

### Problema: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules
npm install
```

### Problema: "MongoDB connection failed"
```bash
# Verificar se MongoDB está a correr
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
- Verificar se token está no formato: `Bearer TOKEN`
- Token deve começar com `eyJ...`
- Não incluir aspas no header

### Problema: "JWT malformed"
- **Causa:** Colocaste "Bearer" no campo de autorização do Swagger
- **Solução:** No Swagger Authorize, cola **APENAS o token** (sem "Bearer")
- O Swagger adiciona "Bearer" automaticamente!

### Problema: WebSocket não conecta
- Verificar CORS no server.js
- Verificar se Socket.IO client está instalado
- Ver console do browser para erros

---

## ✅ Checklist de Teste Completo

### Autenticação
- [ ] Registar cliente
- [ ] Registar trainer  
- [ ] Login com cliente
- [ ] Login com trainer
- [ ] Ver perfil (`/api/auth/me`)
- [ ] Atualizar perfil
- [ ] Gerar QR Code (opcional)

### Utilizadores
- [ ] Trainer ver seus clientes
- [ ] Cliente requestar mudança de trainer
- [ ] Admin validar trainer

### Workouts
- [ ] Trainer criar plano para cliente
- [ ] Cliente ver plano ativo
- [ ] Cliente ver vista calendário
- [ ] Cliente registar log de treino

### Upload
- [ ] Upload de avatar
- [ ] Upload de comprovativo de treino
- [ ] Verificar ficheiros em /uploads

### Mensagens
- [ ] Enviar mensagem entre users
- [ ] Ver conversação
- [ ] Ver mensagens não lidas
- [ ] Trainer enviar alerta

### WebSockets
- [ ] Conectar ao WebSocket
- [ ] Receber notificação de nova mensagem
- [ ] Receber notificação de novo plano
- [ ] Receber notificação de validação

### Admin
- [ ] Listar trainers pendentes
- [ ] Validar trainer
- [ ] Listar pedidos de mudança
- [ ] Aprovar/rejeitar pedido

---

## 📊 Resultados Esperados

Após testar tudo:

✅ **Server iniciado** sem erros  
✅ **MongoDB conectado** com sucesso  
✅ **Swagger acessível** em /api-docs  
✅ **Registo e login** funcionais  
✅ **Autenticação JWT** a proteger rotas  
✅ **Upload de ficheiros** a guardar em /uploads  
✅ **WebSocket** a receber notificações  
✅ **CRUD completo** para todas as entidades  

---

## 🎓 Próximos Passos

1. **Frontend**: Conectar frontend ao backend
2. **Testes Automatizados**: Implementar Jest (plano criado)
3. **Deploy**: Preparar para produção
4. **Documentação API**: Expandir Swagger
5. **Segurança**: Rate limiting, helmet, etc.

---

## 📞 Suporte

**Problemas?**
1. Verificar logs do servidor
2. Verificar console do browser
3. Testar com cURL/Postman primeiro
4. Verificar documentação Swagger

**Endpoints principais:**
- API: `http://localhost:5000/api`
- Swagger: `http://localhost:5000/api-docs`
- Uploads: `http://localhost:5000/uploads`
