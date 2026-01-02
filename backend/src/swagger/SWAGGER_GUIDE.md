# Documentação Swagger da API - Guia de Utilização

## 🚀 Acesso à Documentação Interativa

Após iniciar o servidor, aceda à documentação Swagger em:

```
http://localhost:5000/api-docs
```

A documentação interativa permite:
- 📖 Visualizar todos os endpoints disponíveis
- 🧪 Testar requisições diretamente no browser
- 📝 Ver schemas de dados e exemplos
- 🔐 Autenticar com Bearer Token JWT

---

## 🔑 Como Autenticar na Documentação Swagger

### Passo 1: Fazer Login
1. Navegue até `/api/auth/login`
2. Clique em **"Try it out"**
3. Preencha o body com credenciais:
```json
{
  "username": "seu_username",
  "password": "sua_password"
}
```
4. Clique em **"Execute"**
5. Copie o **token** da resposta

### Passo 2: Autorizar
1. Clique no botão **"Authorize"** 🔓 (topo da página)
2. Cole o token no campo `Value` no formato:
```
Bearer SEU_TOKEN_AQUI
```
3. Clique em **"Authorize"**
4. Agora pode testar endpoints protegidos! ✅

---

## 📚 Estrutura da API Documentada

### Tags Organizadas

| Tag | Descrição | Endpoints |
|-----|-----------|-----------|
| **Auth** | Autenticação e registo | 6 endpoints (register, login, QR code) |
| **Users** | Gestão de perfis | Perfil, clientes, logs, dashboard |
| **Admin** | Administração | Validar trainers, gerir pedidos |
| **Workouts** | Planos de treino | Criar, listar, vista cliente |
| **Exercises** | Exercícios | Biblioteca de exercícios |
| **Messages** | Chat e alertas | Mensagens, conversações |
| **Notifications** | Notificações | WebSocket em tempo real |

---

## 🎯 Exemplos de Uso

### 1. Registar Novo Cliente

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "username": "joaosilva",
  "email": "joao@email.com",
  "password": "senha123",
  "firstName": "João",
  "lastName": "Silva",
  "role": "client",
  "phone": "+351912345678"
}
```

**Resposta (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "joaosilva",
    "role": "client",
    "email": "joao@email.com"
  }
}
```

### 2. Criar Plano de Treino (Trainer)

**Endpoint:** `POST /api/workouts`  
**Requer:** Token JWT de trainer

**Body:**
```json
{
  "client": "507f1f77bcf86cd799439011",
  "name": "Plano de Hipertrofia - 4x Semana",
  "frequency": "4x",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",
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

### 3. Enviar Mensagem

**Endpoint:** `POST /api/messages/send`  
**Requer:** Token JWT

**Body:**
```json
{
  "receiverId": "507f1f77bcf86cd799439012",
  "content": "Olá! Como estão os treinos esta semana?"
}
```

---

## 🔐 Schemas Principais Definidos

### User Schema
```typescript
{
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: 'client' | 'trainer' | 'admin'
  phone?: string
  theme: 'light' | 'dark'
  isValidated: boolean
  trainer?: string  // ID do PT (para clientes)
}
```

### TrainingPlan Schema
```typescript
{
  _id: string
  client: string
  trainer: string
  name: string
  frequency: '2x' | '3x' | '4x' | '5x' | '6x'
  startDate: Date
  endDate: Date
  isActive: boolean
  weeklyPlan: [{
    dayOfWeek: 0-6,
    exercises: [{
      name: string
      sets: number
      reps: string
      rest: string
      notes?: string
    }]
  }]
}
```

---

## ⚙️ Configuração Técnica

### Ficheiros Criados

1. **[swaggerConfig.js](file:///c:/Users/alexs/OneDrive/Ambiente%20de%20Trabalho/DWDM/2º%20Ano/1º%20Semestre/PWA/Trabalho/fitness-platform/backend/src/swagger/swaggerConfig.js)**
   - Configuração OpenAPI 3.0
   - Definição de schemas
   - Segurança Bearer Auth
   - Tags organizadas

2. **[auth.js](file:///c:/Users/alexs/OneDrive/Ambiente%20de%20Trabalho/DWDM/2º%20Ano/1º%20Semestre/PWA/Trabalho/fitness-platform/backend/src/routes/auth.js)** (documentado)
   - Anotações JSDoc completas
   - 6 endpoints documentados
   - Exemplos de request/response

### Integração no Server

O Swagger foi integrado no [server.js](file:///c:/Users/alexs/OneDrive/Ambiente%20de%20Trabalho/DWDM/2º%20Ano/1º%20Semestre/PWA/Trabalho/fitness-platform/backend/server.js):

```javascript
const { swaggerUi, swaggerSpec } = require('./src/swagger/swaggerConfig');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## 📝 Próximos Passos Sugeridos

Para documentar as rotas restantes, adicione anotações JSDoc semelhantes ao que foi feito em `auth.js`:

1. ✅ **auth.js** - Totalmente documentado
2. ⏳ **users.js** - Adicionar anotações para perfil, clientes, dashboard
3. ⏳ **admin.js** - Documentar validação de trainers e pedidos
4. ⏳ **workouts.js** - Documentar criação e listagem de planos
5. ⏳ **exercises.js** - Já tem lógica inline, fácil de documentar
6. ⏳ **messages.js** - Documentar chat e alertas

### Template de Anotação

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   post:
 *     summary: Descrição curta
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campo: { type: string, example: "valor" }
 *     responses:
 *       200:
 *         description: Sucesso
 */
```

---

## ✨ Funcionalidades do Swagger UI

- **Try it out**: Testa endpoints diretamente
- **Authorize**: Adiciona token JWT para rotas protegidas
- **Schemas**: Visualiza modelos de dados
- **Examples**: Vê exemplos de requisições
- **Responses**: Códigos de status e schemas de resposta
- **Download**: Exporta OpenAPI spec em JSON/YAML

---

## 🎓 Recursos Adicionais

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
