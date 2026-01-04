# 🧪 Guia de Testes Automatizados

Este documento explica como executar e criar testes automatizados para o backend da aplicação.

## 📋 Índice

- [Executar Testes](#executar-testes)
- [Estrutura dos Testes](#estrutura-dos-testes)
- [Tipos de Testes](#tipos-de-testes)
- [Criar Novos Testes](#criar-novos-testes)
- [Boas Práticas](#boas-práticas)

---

## 🚀 Executar Testes

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (re-executa ao modificar arquivos)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage
```

### Saída Esperada

Ao executar `npm test`, você deve ver algo como:

```
 PASS  src/tests/models/User.test.js
 PASS  src/tests/models/TrainingPlan.test.js
 PASS  src/tests/api/auth.test.js
 PASS  src/tests/api/workouts.test.js

Test Suites: 4 passed, 4 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        X.XXXs
```

### Relatório de Cobertura

Após executar `npm run test:coverage`, será criada uma pasta `coverage/` com relatórios:

- **Terminal**: Resumo de cobertura
- **HTML**: Abrir `coverage/lcov-report/index.html` no browser para relatório detalhado

---

## 📁 Estrutura dos Testes

```
backend/
├── jest.config.js              # Configuração do Jest
├── src/
│   ├── tests/
│   │   ├── setup.js           # Setup global (MongoDB Memory Server)
│   │   ├── helpers/
│   │   │   └── testHelpers.js # Funções auxiliares
│   │   ├── models/            # Testes de modelos
│   │   │   ├── User.test.js
│   │   │   └── TrainingPlan.test.js
│   │   └── api/               # Testes de API
│   │       ├── auth.test.js
│   │       └── workouts.test.js
```

---

## 🧩 Tipos de Testes

### 1. Testes de Modelos

Testam validações, métodos e comportamentos dos schemas Mongoose.

**Exemplo: User.test.js**
```javascript
test('Deve criar um usuário válido', async () => {
  const user = await User.create({
    username: 'test',
    email: 'test@test.com',
    password: 'senha123',
    firstName: 'Test',
    lastName: 'User'
  });

  expect(user._id).toBeDefined();
  expect(user.password).not.toBe('senha123'); // Deve estar hasheada
});
```

**O que testam:**
- ✅ Criação de documentos válidos
- ✅ Validações de campos obrigatórios
- ✅ Validações customizadas (ex: datas, frequência)
- ✅ Middlewares (ex: hash de password)
- ✅ Métodos de instância e estáticos
- ✅ Campos virtuais

### 2. Testes de API

Testam endpoints HTTP usando Supertest.

**Exemplo: auth.test.js**
```javascript
test('Deve fazer login com credenciais válidas', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'test',
      password: 'senha123'
    })
    .expect(200);

  expect(response.body.token).toBeDefined();
});
```

**O que testam:**
- ✅ Endpoints retornam status corretos
- ✅ Autenticação e autorização
- ✅ Validação de dados de entrada
- ✅ Estrutura das respostas
- ✅ Casos de erro

---

## ✍️ Criar Novos Testes

### Passo 1: Criar arquivo de teste

Criar arquivo com extensão `.test.js` em:
- `src/tests/models/` para testes de modelos
- `src/tests/api/` para testes de API

### Passo 2: Estrutura básica

```javascript
// Importar dependências
const Model = require('../../models/Model');
const { createTestUser } = require('../helpers/testHelpers');

describe('Nome do Componente', () => {
  // Setup antes de cada teste
  beforeEach(async () => {
    // Preparar dados
  });

  describe('Funcionalidade específica', () => {
    test('Deve fazer X com sucesso', async () => {
      // Arrange: Preparar dados
      const data = { ... };

      // Act: Executar ação
      const result = await Model.create(data);

      // Assert: Verificar resultado
      expect(result).toBeDefined();
      expect(result.field).toBe(expectedValue);
    });

    test('Deve falhar quando Y', async () => {
      const invalidData = { ... };

      await expect(Model.create(invalidData)).rejects.toThrow();
    });
  });
});
```

### Passo 3: Usar helpers

Aproveitar funções auxiliares em `testHelpers.js`:

```javascript
const { 
  createTestUser,
  createTestTrainer,
  createTestClient,
  generateToken,
  mockTrainingPlan
} = require('../helpers/testHelpers');

// Criar usuário de teste
const user = await createTestUser({ role: 'client' });

// Gerar token JWT
const token = generateToken(user._id);

// Criar plano de treino mock
const plan = mockTrainingPlan(clientId, trainerId);
```

---

## 📝 Boas Práticas

### 1. Nomenclatura Clara

```javascript
// ✅ BOM: Descreve exatamente o que testa
test('Deve falhar ao criar usuário sem email', async () => { ... });

// ❌ RUIM: Vago
test('Teste de validação', async () => { ... });
```

### 2. Testes Independentes

Cada teste deve ser independente e não depender de outros:

```javascript
// ✅ BOM: Cria seus próprios dados
test('Deve fazer login', async () => {
  const user = await createTestUser();
  // ... resto do teste
});

// ❌ RUIM: Depende de teste anterior
let sharedUser;
test('Criar usuário', async () => {
  sharedUser = await createTestUser();
});
test('Fazer login', async () => {
  // Usa sharedUser do teste anterior
});
```

### 3. Arrange-Act-Assert

Organizar testes em 3 fases:

```javascript
test('Exemplo', async () => {
  // Arrange: Preparar dados
  const userData = { ... };

  // Act: Executar ação
  const result = await User.create(userData);

  // Assert: Verificar resultado
  expect(result).toBeDefined();
});
```

### 4. Testar Casos de Sucesso e Erro

```javascript
describe('Registro de Usuário', () => {
  test('Deve registar com dados válidos', async () => { ... });
  test('Deve falhar sem email', async () => { ... });
  test('Deve falhar com email duplicado', async () => { ... });
  test('Deve falhar com password curta', async () => { ... });
});
```

### 5. Usar expect Apropriados

```javascript
// Verificar existência
expect(value).toBeDefined();
expect(value).toBeNull();

// Verificar valores
expect(value).toBe(expectedValue);
expect(value).toEqual(expectedObject);

// Verificar tipos
expect(value).toBeInstanceOf(Date);
expect(Array.isArray(value)).toBe(true);

// Verificar arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Verificar strings
expect(string).toMatch(/regex/);

// Verificar exceções
await expect(promise).rejects.toThrow();
await expect(promise).rejects.toThrow('mensagem específica');
```

### 6. Limpar Dados

O setup global (`src/tests/setup.js`) já limpa o banco entre testes, mas você pode adicionar limpeza específica:

```javascript
afterEach(async () => {
  // Limpeza específica se necessário
});
```

---

## 🔧 Configuração

### Jest Config (`jest.config.js`)

- **testEnvironment**: `node` - Ambiente Node.js
- **testTimeout**: `10000` - Timeout de 10s para testes
- **setupFilesAfterEnv**: Setup global com MongoDB Memory Server
- **collectCoverageFrom**: Arquivos incluídos na cobertura
- **coverageThreshold**: Limites mínimos de cobertura

### MongoDB Memory Server

Os testes usam MongoDB em memória (não afeta o banco real):

- ✅ Rápido e isolado
- ✅ Não requer MongoDB instalado
- ✅ Limpo automaticamente entre testes
- ✅ Cada suite de testes tem banco limpo

---

## 🐛 Troubleshooting

### Testes muito lentos

- Verificar se há muitos `await` desnecessários
- Usar `beforeEach` para setup comum
- Considerar reduzir número de testes de integração

### Erro "Jest did not exit"

- Verificar se há conexões abertas
- Adicionar `--forceExit` ao comando (já configurado)

### Erro de timeout

- Aumentar timeout específico: `test('...', async () => { ... }, 15000);`
- Ou aumentar global em `jest.config.js`

### Testes falhando aleatoriamente

- Garantir que testes são independentes
- Verificar se há dados compartilhados entre testes
- Usar `afterEach` para limpeza

---

## 📊 Cobertura de Código

### Metas de Cobertura

Configuradas em `jest.config.js`:

- **Linhas**: 60%
- **Funções**: 50%
- **Branches**: 50%
- **Statements**: 60%

### Ver Cobertura

```bash
npm run test:coverage
```

Abrir `coverage/lcov-report/index.html` para ver:
- Arquivos não cobertos
- Linhas específicas não testadas
- Percentual por arquivo

---

## 🎯 Próximos Passos

Para expandir os testes:

1. **Adicionar mais testes de modelos**: WorkoutLog, Message, etc.
2. **Testes de API adicionais**: Upload, mensagens, admin
3. **Testes de integração**: Fluxos completos de usuário
4. **Testes de performance**: Tempo de resposta de endpoints
5. **Testes E2E**: Com frontend integrado

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Mongoose Testing Guide](https://mongoosejs.com/docs/jest.html)
